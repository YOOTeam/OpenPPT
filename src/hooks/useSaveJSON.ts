import { storeToRefs } from 'pinia'
import { useSlidesStore, useMainStore } from '@/store'
import { SaveJsonData } from '@/api/careate'
import useExport from '@/hooks/useExport'
import { ref } from 'vue'
import { toPng } from 'html-to-image'
import { svgImgBase64 } from '@/utils/svg2Base64'
import { isPC, fileMd5Sum, base64ToFile } from '@/utils/common'
import $ from 'jquery'
import { onUploads } from '@/utils/upload'

interface ExportImageConfig {
  quality: number
  width: number
  height?: number
  fontEmbedCSS?: string
}

export default () => {
  const _isPC = isPC()
  const slidesStore = useSlidesStore()
  const mainStore = useMainStore()
  const { userToken, useFileId, beautifyDocument } = storeToRefs(mainStore)
  const { exportApiToJSON } = useExport()
  const { slides, title, oldSlides, resourcesData, oldTilte } =
    storeToRefs(slidesStore)

  const returnImgUrl = async (
    dom: any,
    index: number,
    imgType = 'image',
    requestId?: string
  ) => {
    let url = ''
    const file = await exportImageUrl(
      dom,
      'png',
      1,
      title.value + (index + 1) + '.png'
    )

    const res: any = await onUploads(file, imgType, requestId)
    url = res?.url ? res.url : ''

    return { url, fileMd5: res?.fileMd5 }
  }

  const getImgUrl = async (
    dom: any,
    index: number,
    imgType = 'image',
    requestId?: string
  ) => {
    let url = ''
    const file = await exportImageUrl(
      dom,
      'png',
      1,
      title.value + (index + 1) + '.png'
    )

    if (!file || !userToken.value) {
      return
    }
    const res: any = await onUploads(file, imgType, requestId)
    url = res?.url ? res.url : ''

    return url
  }
  const isSaveData: any = ref({})
  const saveJSONData = async (
    data?: any,
    imgFile?: any,
    sessionStorageData?: any,
    isUpload?: boolean
  ) => {
    if (!useFileId.value && !isUpload) {
      return
    }

    if (isUpload) {
      // 这个一定要写在 获取data前 因为如果是创建新的数据要 删除场景
      mainStore.setSceneData(null)
    }
    let datajson = null
    if (data) {
      datajson = Array.isArray(data) ? exportApiToJSON(data) : data
    } else {
      datajson = slides.value?.length ? exportApiToJSON(slides.value) : null
    }

    const dom = document.querySelector('.catalog-list')

    if (!datajson) return
    const timerData = mainStore.saveTimerData
    datajson.timerData = timerData
    let is_sessionStorageData = false
    if (!sessionStorageData) {
      is_sessionStorageData = true
      const carpCover = carpCoverHtml()
      if (carpCover) {
        mainStore.setShowCarpSlide({
          show: true,
          isAllSlide: true,
        })
      }

      const blob = new Blob([JSON.stringify(datajson)], {
        type: 'application/json',
      })
      const file = new File([blob], `${title.value}.json`, {
        type: 'application/json',
      })

      const fileMd5 = await fileMd5Sum(file)
      let type = 'onlineEditorJson'

      const res: any = await onUploads(file, type)
      let saveRes: any = null

      if (!res?.url) return { code: 500 }

      const params: any = {
        request_id: isUpload ? '' : useFileId.value,
        title: title.value,
        main_color: resourcesData.value?.main_color,
        doc_json: res?.url,
        size: file.size,
        pages: slides.value.length,
        fileMd5: fileMd5,
      }

      if (isSaveData.value.is_import) {
        params.is_import = isSaveData.value?.is_import
      }

      // 封面截图
      if (carpCover) {
        const slide = slides.value[0]
        const coverDom = document.getElementById(`save-${slide.id}`)
        if (coverDom) {
          const imgRes = await getImgUrl(coverDom, 0)
          params.coverImg = imgRes
          mainStore.setShowCarpSlide({
            show: false,
          })
        }
      }

      slidesStore.updateResourcesData({ jsonUrl: res?.url })

      if (dom) {
        params.countTextNum = dom.textContent?.length
      }
      if (isUpload) {
        if (beautifyDocument.value?.fileKey) {
          params.pptx_url = beautifyDocument.value?.fileKey
          params.type = 'beautify'
        } else {
          params.type = 'upload'
        }
      }

      if (imgFile?.length && imgFile?.length === slides.value.length) {
        params.images = JSON.stringify(imgFile)
      }

      saveRes = await SaveJsonData(params)
      saveRes.jsonData = params.doc_json
      if (saveRes?.code === 200) {
        slidesStore.setOldTilte(title.value)

        if (isUpload && saveRes.data.is_new) {
          mainStore.setUseFileId(saveRes.data.id)
        }

        slidesStore.setOldSlides(JSON.parse(JSON.stringify(slides.value)))
      }
      return saveRes
    }

    if (sessionStorage.getItem('storeDatajson')) {
      sessionStorage.removeItem('storeDatajson')
    }

    if (sessionStorage.getItem('storeDatajson-old')) {
      sessionStorage.removeItem('storeDatajson-old')
    }

    if (sessionStorageData || !is_sessionStorageData) {
      const data = JSON.parse(JSON.stringify(datajson))
      data.slides = JSON.parse(JSON.stringify(slides.value))
      sessionStorage.setItem(
        'storeDatajson',
        JSON.stringify({
          datajson: data,
          fileid: useFileId.value,
          bg_color: resourcesData.value?.main_color,
        })
      )

      sessionStorage.setItem(
        'storeDatajson-old',
        JSON.stringify({
          oldSlidesData: slides.value,
          fileid: useFileId.value,
        })
      )
    }
  }

  const exporting = ref(false)

  const exportImageUrl = async (
    domRef: HTMLElement,
    format: string,
    quality: number,
    filename: string
  ) => {
    try {
      exporting.value = true
      const config: ExportImageConfig = {
        quality,
        width: _isPC ? 1600 : 400,
        fontEmbedCSS: '',
      }

      if (!domRef) return
      const svgImgList = $(domRef).find('svg').find('image')
      if (svgImgList?.length) {
        const list = Array.from(svgImgList)
        for (const imgDom of list) {
          const dom = $(imgDom).parents('svg')
          if (dom?.length) {
            const parent = dom.parent()
            const base64SVG = await svgImgBase64(dom[0])
            $(parent).prepend(`<img src="${base64SVG}"/>`)
            $(dom).remove()
          }
        }
      }

      let flie = null

      const res = await toPng(domRef, config)
      if (res) {
        flie = base64ToFile(res, filename)
      }

      return flie
    } catch (error) {
      return null
    }
  }

  const userCanSave = () => {
    let isSave = false
    const slideList = JSON.parse(JSON.stringify(slides.value))
    const oldList = JSON.parse(JSON.stringify(oldSlides.value))
    const oldTimerData = mainStore.oldTimerData
    const timeData = mainStore.saveTimerData

    if (
      JSON.stringify(slideList) !== JSON.stringify(oldList) ||
      oldTilte.value !== title.value ||
      JSON.stringify(oldTimerData) !== JSON.stringify(timeData)
    ) {
      isSave = true
    }
    return isSave
  }

  const carpCoverHtml = () => {
    const slide = slides.value?.length
      ? JSON.parse(JSON.stringify(slides.value[0]))
      : null
    const oldSlide = oldSlides.value?.length
      ? JSON.parse(JSON.stringify(oldSlides.value[0]))
      : null
    let isSave = false
    if (slide) {
      delete slide.remark
    }
    if (oldSlide) {
      delete oldSlide.remark
    }
    if (JSON.stringify(slide) !== JSON.stringify(oldSlide)) {
      isSave = true
    }
    return isSave
  }
  return {
    saveJSONData,
    exportImageUrl,
    getImgUrl,
    returnImgUrl,
    userCanSave,
    isSaveData,
  }
}
