import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore, useMainStore, useSnapshotStore } from '@/store'
import { deleteDiscardedDB } from '@/utils/database'
import useAddSlidesOrElements from '@/hooks/useAddSlidesOrElements'
import useSlideHandler from '@/hooks/useSlideHandler'
import message from '@/utils/message'
import { onUploads } from '@/utils/upload'
import { ppt2json, getPPTFileInfo, beautifyUpload } from '@/api/careate'
import useInitSlides from '@/hooks/useInitSlides'
import { useI18n } from 'vue-i18n'
export default () => {
  const { t } = useI18n()
  const mainStore = useMainStore()
  const snapshotStore = useSnapshotStore()
  const slidesStore = useSlidesStore()
  const {
    initJsonData,
    initSlids,
    jsonDataInitFile,
    closeJsonLoading,
    getPPTImage,
  } = useInitSlides()
  const { useFileId, beautifyLoadingData } = storeToRefs(mainStore)
  const { resourcesData, slides } = storeToRefs(slidesStore)
  const { addSlidesFromData } = useAddSlidesOrElements()
  const { isEmptySlide } = useSlideHandler()

  const exporting = ref(false)
  // 导入json文件
  const importJsonFile = (files: FileList, cover = false) => {
    exporting.value = true
    const file = files[0]
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      try {
        const title = file?.name?.split('.')[0]
        slidesStore.setResourcesData(null)
        slidesStore.setTitle(title)
        slidesStore.setOldTilte(title)
        const data = JSON.parse(reader.result as string)
        if (Array.isArray(data)) {
          const slides = data
          const ratio = 96 / 72
          const width = 960
          slidesStore.setViewportSize(width * ratio)
          if (cover) {
            slidesStore.updateSlideIndex(0)
            slidesStore.setSlides(slides)
          } else if (isEmptySlide.value) slidesStore.setSlides(slides)
          else addSlidesFromData(slides)
        } else {
          initJsonData(data)
        }

        exporting.value = false
      } catch {
        exporting.value = false
        message.error(t('dowload.error4'))
      }
    })
    reader.readAsText(file)
  }

  // 防止chat/info接口拿不到数据一直请求问题 超过5分钟就不要在请求
  let jsonDataApiTimer: any = null
  let jsonDataTime = 0
  const initJsonTime = () => {
    jsonDataApiTimer = setInterval(() => {
      jsonDataTime += 1000
    }, 1000)
  }
  const delay = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // chatppt 解析ppt接口 是异步行为  需要轮训
  const getJsonDataInfo = async (id?: string, type?: string) => {
    const res: any = await getPPTFileInfo({ id: id })
    let messageTips: any = beautifyLoadingData.value?.messageTips || ''

    try {
      // status = 2 时表示完成轮训 3错误
      if (parseInt(res.data?.status) === 1) {
        if (res.data?.data) {
          if (!type) {
            exporting.value = false
          }
          if (res.data.data) {
            if (type === 'beautify') {
              if (!messageTips) {
                messageTips = t('create.tips2')
              } else {
                let page_num = res?.data?.data?.page_num
                page_num = page_num <= 9 ? `0${page_num}` : page_num
                let page_count = res?.data?.data?.page_count
                page_count = page_count <= 9 ? `0${page_count}` : page_count
                messageTips = `${t(
                  'create.tips3'
                )} <span style='font-weight:800'>${page_num}/${page_count}</span>`
              }
              mainStore.setbeautifyLoadingData({
                loadingType: 'beautifyAction',
                messageTips: messageTips,
              })
            } else {
              mainStore.setbeautifyLoadingData({
                loadingType: '',
                message: '',
              })
            }
            await jsonDataInitFile(res.data.data, type ? type : 'isUpload')
          }
          clearInterval(jsonDataApiTimer)
          jsonDataTime = 0
          initJsonTime()
        }
        if (jsonDataTime > 300000) {
          clearInterval(jsonDataApiTimer)
          jsonDataTime = 0
          message.error(t('create.tips4'))
          return
        }

        await delay(1000)
        await getJsonDataInfo(id, type)
      } else if (res.data?.status === 2) {
        if (type === 'beautify') {
          messageTips = t('create.tips5')
          mainStore.setbeautifyLoadingData({
            loadingType: 'beautifyAction',
            messageTips: messageTips,
          })
        } else {
          mainStore.setbeautifyLoadingData({
            loadingType: '',
            messageTips: '',
          })
        }
        localStorage.removeItem('beautifyPPT')
        localStorage.removeItem('importPPT')
        clearInterval(jsonDataApiTimer)
        jsonDataTime = 0
        closeJsonLoading(res, type ? type : 'isUpload')
        exporting.value = false
      } else {
        // 错误行为
        clearInterval(jsonDataApiTimer)
        jsonDataTime = 0
        exporting.value = false
        closeJsonLoading(res, type ? type : 'isUpload')
      }
    } catch (error) {
      clearInterval(jsonDataApiTimer)
      jsonDataTime = 0
      if (res?.code !== 200) {
        exporting.value = false
      }
      closeJsonLoading(res, type ? type : 'isUpload')
    }
  }

  // 导入PPTX文件
  const importPPTXFile = async (files: FileList, type?: string) => {
    mainStore.setbeautifyLoadingData({ loadingType: '' })
    const file = files[0]
    if (!file) return
    if (type === 'beautify') {
      mainStore.setbeautifyLoadingData({ loadingType: 'beautify' })
    }
    exporting.value = true
    try {
      const title = file.name.split('.')[0]
      slidesStore.setTitle(title)
      slidesStore.setOldTilte(title)
      mainStore.setInitDataTotal(0)
      slidesStore.setOldSlides([])
      slidesStore.setSlides([])
      slidesStore.setResourcesData(null)
      mainStore.setCreateLoadingData(null)

      await deleteDiscardedDB()
      snapshotStore.initSnapshotDatabase()
      let Filetype = 'userChatPptTempFile'

      const fileRes: any = await onUploads(file, Filetype)
      if (!fileRes.url) {
        exporting.value = false
        return false
      }
      let data = {
        fileKey: fileRes.key,
      }

      // 用户上传美化时需要记录
      if (type === 'beautify') {
        const beautifyRes: any = await beautifyUpload({ url: fileRes.key })
        if (beautifyRes.code === 200) {
          data = { ...data, ...beautifyRes.data }
        }
      }
      if (type) {
        mainStore.setBeautifyDocument(data)
      }
      const result: any = await ppt2json({ file: fileRes.url, async: 'True' })
      if (result.code === 200) {
        if (type === 'beautify') {
          await getPPTImage(fileRes.url)
        } else {
          slidesStore.updateResourcesData({ pptUrl: fileRes.url })
        }
        initJsonTime()
        await getJsonDataInfo(result.data.id, type)
      } else {
        exporting.value = false
        if (result.code === 204) {
          message.error(t('dowload.error4'))
        }
      }
    } catch (error) {
      exporting.value = false
    }
  }

  return {
    importJsonFile,
    importPPTXFile,
    exporting,
    resourcesData,
  }
}
