import {
  ref,
  nextTick,
  reactive,
  onMounted,
  onBeforeUnmount,
  watch,
  computed,
} from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import useThemeStyle from '@/hooks/useThemeStyle'
import useThemeFileTemplate from '@/hooks/useThemeFileTemplate'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import useExport from '@/hooks/useExport'
import { debounce } from 'lodash'
import useSaveJSON from '@/hooks/useSaveJSON'
import { cancelRequestsWithPrefix, returnCancel } from '@/utils/HttpRequest'
import { fetchUrl } from '@/utils/common'
import { beautifyResult } from '@/api/pinganApi'
import { viewThemeModle, canceltask } from '@/api/careate'
import { onUploads } from '@/utils/upload'
import useInitSlides from '@/hooks/useInitSlides'
import { nanoid } from 'nanoid'
import { useI18n } from 'vue-i18n'

export default () => {
  const { t } = useI18n()

  const { exportApiToJSON } = useExport()
  const { addHistorySnapshot } = useHistorySnapshot()
  const { fontSizeResize } = useInitSlides()
  const {
    elementAddThemeColor,
    deletThemeColorList,
    beautifyThemeApply,
    beautifySingTheme,
    hasNoTagsElement,
    handleDrawingImage,
    replaceImg,
    getImageApi,
    filleImageUrlToElement,
    openDrawing,
    schoolBgList,
    beatufiySlideList,
  } = useThemeFileTemplate()
  const {
    getFullTemplate,
    fullScrollNext,
    handleCheckFullSingColor,
    setCustomeTheme,
    FullApiChannle,
    fullThemePages,
    allDeepViewData,
    themeModleIds,
    isOnlyUse,
    openColorSingle,
  } = useThemeStyle()
  FullApiChannle.value = 'beautify'
  openColorSingle.value = false
  const mainStore = useMainStore()
  const slidesStore = useSlidesStore()
  const {
    beautifyDocument,
    beautifyData,
    beautifyFirstView,
    presentation,
    useFileId,
    showCarpSlide,
    userToken,
    useInfo,
  } = storeToRefs(mainStore)
  const { returnImgUrl } = useSaveJSON()
  const { slides, title } = storeToRefs(slidesStore)
  const isFristTips = ref(false)
  const themeDatas: any = ref(null)
  const fileJsonData: any = ref(null)
  // 美化是否结束
  const beautifyEnd = ref(false)
  const viewSiles: any = ref([])
  const activeTheme = ref(0)
  const checkBeautify = ref(0)
  const pageList = reactive([
    {
      name: t('beautify.cover'),
      type: 'cover',
    },
    {
      name: t('beautify.catalog'),
      type: 'catalog',
    },
    {
      name: t('beautify.chatper'),
      type: 'chatper',
    },
    {
      name: t('beautify.chatper'),
      type: 'chapter',
    },
    {
      name: t('beautify.contentPage'),
      type: 'content',
    },
    {
      name: t('beautify.contentPage'),
      type: 'multcontent',
    },
    {
      name: t('beautify.contentPage'),
      type: 'background',
    },
    {
      name: t('beautify.endPage'),
      type: 'end',
    },
  ])

  const themeLoadingList = [
    t('beautify.tips5'),
    t('beautify.tips6'),
    t('beautify.tips7'),
    t('beautify.tips8'),
    t('beautify.tips9'),
    t('beautify.tips10'),
    t('beautify.tips11'),
    t('beautify.tips12'),
    t('beautify.tips13'),
    t('beautify.tips14'),
    t('beautify.tips15'),
    t('beautify.tips16'),
  ]

  const pageLoadingList = [
    `${t('beautify.tips17')}...num/count`,
    `${t('beautify.tips18')}...num/count`,
    `${t('beautify.tips19')}...num/count`,
    `${t('beautify.tips20')}...num/count`,
    `${t('beautify.tips21')}...num/count`,
    `${t('beautify.tips22')}...num/count`,
    `${t('beautify.tips23')}...num/count`,
    `${t('beautify.tips24')}...num/count`,
    `${t('beautify.tips25')}...num/count`,
    `${t('beautify.tips26')}...num/count`,
    `${t('beautify.tips27')}...num/count`,
    `${t('beautify.tips28')}...num/count`,
    `${t('beautify.tips29')}...num/count`,
  ]

  let imgFileType = 'screenshotTmp'

  const beautifyTips = ref('')
  const isOpenCompare = ref(false)
  const watchInitData: any = ref(null)
  const isNoViewData: any = ref(null)
  const slideInfo: any = ref({
    info: {},
    slides: [],
    themeColor: null,
  })
  // 美化记录id
  const record_id = ref('')
  // 美化loading状态
  const beautifyLoading = ref(true)

  const beautifyIdStation = beautifyDocument.value?.id
  // 当前活动索引
  const activeIndex = ref(-1)
  // 父元素节点
  const upperThumbnailBox: any = ref(null)
  // 每个slider元素列表
  const slideItems = ref<(HTMLElement | null)[]>([])
  // 当前展示的幻灯片内容
  const checkItem: any = ref({})
  // 旧数据图片路径
  const oldImgUrl = ref('')
  // 深拷贝viewSiles值
  const viewSilesCopy = ref(JSON.parse(JSON.stringify(viewSiles.value)))
  // 大图展示框
  const showBigView = ref(false)

  // 当前模版id
  const acitveThemeId = ref('')

  // 取消接口id
  const canceltaskId = ref(sessionStorage.getItem('statisPathString'))

  // 切换模版
  const handleThemeClick = async (item: any, index: number) => {
    beautifyTips.value = t('beautify.tips17')
    if (upperThumbnailBox.value) {
      upperThumbnailBox.value.scrollTo(0, 0)
    }
    beautifyEnd.value = false
    beautifyLoading.value = true
    activeTheme.value = index
    acitveThemeId.value = item.id

    viewSiles.value = JSON.parse(JSON.stringify(slides.value)).map(
      (item: any) => {
        return {
          ...item,
          isChangNum: '',
          isShow: false,
          isGood: '',
          showPageList: false,
        }
      }
    )
    isOpenCompare.value = false
    sessionStorage.setItem(
      'fullTheme',
      JSON.stringify({ id: item.id, json: item.json })
    )
    isTaskError.value = false

    await handleDomToView('isClick')
  }

  const isBeautyCount = ref(0)
  const isCheck = ref(false)
  const isTaskError = ref(false)

  // 模版应用
  const handleDomToView = async (type?: string) => {
    loadingSept.value = 2
    if (fullThemePages.value.list.length === 0) {
      beautifyLoading.value = false
      beautifyTips.value = `<p style="color:#fa2020">${t(
        'beautify.tips30'
      )}</p>`
      isCheck.value = true
      return
    }

    let themeData = fullThemePages.value.list[activeTheme.value]

    if (beautifyDocument.value?.themeId && !isCheck.value) {
      themeData = fullThemePages.value.list.find(
        (item: any) => item.id === beautifyDocument.value?.themeId
      )
      if (themeData) {
        isCheck.value = true
      }
    }
    if (!themeData) {
      beautifyLoading.value = false
      return
    }

    if (themeData?.slide?.elements?.length) {
      const hasSchoolbg = themeData?.slide?.elements?.find(
        (item: any) =>
          item?.tags?.custom?.shape_type === 'school_bg' ||
          item.tags?.normal.some(
            (key: any) => key.value === 'YOO_CHATSHAPE_SCHOOL_BG'
          )
      )
      if (hasSchoolbg) {
        schoolBgList.value = []
        schoolBgList.value.push(hasSchoolbg.src)
      }
    }

    // 模版风格
    themeDatas.value = themeData

    let content: any = ''
    try {
      content = await fetchUrl(themeData.json)
    } catch (error) {
      console.error('Error fetching data:', error)
    }

    if (!content) return
    const jsondata: any = JSON.parse(content)

    const newSlides = jsondata.slides.map((slide: any) => {
      slide.style = themeData.style
      return (slide = elementAddThemeColor(
        slide,
        themeData.themeColorData,
        true
      ))
    })

    slideInfo.value.info = jsondata.presentation
    slideInfo.value.slides = newSlides
    slideInfo.value.fontStyleData = themeData.fontStyleData
    slideInfo.value.themeColor = themeData.themeColorData

    await Promise.all(
      viewSiles.value.map(async (item: any, index: number) => {
        try {
          const data = beautifyData.value ? beautifyData.value[item.id] : null
          loadingThemeTipsNext(pageLoadingList, item, true)
          const test = index + 1
          // 动态滚动效果
          if (test % 8 === 0 || test % 10 === 0) {
            const element = slideItems.value[index]
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', inline: 'center' })
            }
          }
          let viewData: any = null
          if (item?.elements?.length) {
            if (hasNoTagsElement(item)) {
              // 如果没有tags 就截图 这块 有 tags 就走tags 的 匹配
              // 视觉模型
              if (data?.viewData) {
                viewData = JSON.parse(JSON.stringify(data.viewData))
              } else {
                const param: any = {
                  total_page: slides.value.length,
                  now_page: index + 1,
                  image_path: '',
                  task_id: canceltaskId.value,
                }
                if (data?.url) {
                  param.image_path = data.url
                  if (data.file_md5) {
                    param.file_md5 = data.fileMd5
                    param.refresh = 'False'
                  }
                } else {
                  if (!showCarpSlide.value?.show) {
                    mainStore.setShowCarpSlide({
                      show: true,
                      isAllSlide: true,
                    })
                  }
                  const imageData: any = await handleCarpImg(item.id)
                  if (!imageData.url) {
                    item.isError = true
                    item.isShow = true
                    if (
                      item.isShow &&
                      isBeautyCount.value < slides.value?.length
                    ) {
                      isBeautyCount.value++
                    }
                    return
                  }
                  param.image_path = imageData.url
                  param.file_md5 = imageData?.fileMd5
                  param.refresh = 'False'
                }
                try {
                  const res: any = param.image_path
                    ? await viewThemeModle(param, `beautify-${index}`)
                    : null

                  if (res?.code !== 200) {
                    item.isError = true
                    item.isShow = true
                    if (
                      item.isShow &&
                      isBeautyCount.value < slides.value?.length
                    ) {
                      isBeautyCount.value++
                    }
                    return
                  }
                  const newData = {
                    ...data,
                    viewData: res.data,
                  }
                  mainStore.setBeautifyData({ [item.id]: newData })
                  viewData = JSON.parse(JSON.stringify(newData.viewData))
                } catch (error) {}
              }
            }
            await beautifyThemeApply(item, newSlides, viewData, {
              font: themeData.fontStyleData,
              color: JSON.parse(JSON.stringify(themeData.themeColorData)),
              style: themeData.style,
              width: slideInfo.value.info.width,
              height: slideInfo.value.info.height,
            })
          } else {
            item.isShow = true
          }

          if (item.isShow && isBeautyCount.value < slides.value?.length) {
            isBeautyCount.value++
          }
        } catch (error) {
          item.isShow = true
          if (item.isShow && isBeautyCount.value < slides.value?.length) {
            isBeautyCount.value++
          }
        }
      })
    )

    viewSiles.value.forEach((item: any) => {
      if (item.elements?.length) {
        item.elements.forEach((element: any) => {
          if (element.imgResect) {
            delete element.imgResect
          }

          if (element.iconResect) {
            delete element.iconResect
          }
        })
      }
    })
    nextTick(() => {
      fontSizeResize(viewSiles.value)
      viewSilesCopy.value = ref(JSON.parse(JSON.stringify(viewSiles.value)))
    })

    beautifyEnd.value = true
    isFristTips.value = false
    // 美化结束
    beautifyLoading.value = false
    viewSiles.value.forEach((item: any) => {
      item.isShow = true
    })
  }

  const handlePageViewChange = (item?: any) => {
    viewSiles.value.forEach((el: any) => {
      if (el.id === item?.id) {
        item.showPageList = !item.showPageList
      } else {
        el.showPageList = false
      }
    })
  }

  // 更改视觉请求
  const changeVisison = async (current: any, item: any) => {
    beautifyTips.value = t('beautify.tips17')
    let name = current.name
    if (current.type === 'chapter' || current.type === 'chatper') {
      name = '章节页'
    } else if (current.type === 'cover') {
      name = '封面页'
    } else if (current.type === 'catalog') {
      name = '目录页'
    } else if (current.type === 'end') {
      name = '结束页'
    } else {
      name = '内容页'
    }
    checkItem.value.showPageList = false
    item.showPageList = false
    item.isShow = false
    item.isError = false

    const checkItemID = item.id
    const slideData = viewSiles.value.find(
      (item: any) => item.id === checkItemID
    )
    const oldeSlides = JSON.parse(JSON.stringify(slides.value))
    const oldeSlideData = oldeSlides.find(
      (item: any) => item.id === checkItemID
    )

    loadingThemeTipsNext(pageLoadingList, item)

    slideData.elements = oldeSlideData.elements
    let data = beautifyData?.value ? beautifyData?.value[slideData.id] : null

    if (watchInitData.value?.type === 'byBeautifyBtn' && !data) {
      await delayTime(200)
      item.isShow = true
      return
    }
    let viewData: any = null
    beautifyEnd.value = false
    // 美化结束
    beautifyLoading.value = true

    const param = {
      total_page: slides.value.length,
      now_page: activeIndex.value + 1,
      image_path: data?.url,
      page_type: name,
      file_md5: data?.fileMd5,
      refresh: 'True',
      task_id: canceltaskId.value,
    }

    if (!data?.url) {
      if (!data) {
        data = {}
      }
      if (!showCarpSlide.value?.show) {
        mainStore.setShowCarpSlide({
          show: true,
          isAllSlide: true,
        })
      }
      const imageData: any = await handleCarpImg(item.id)
      if (!imageData?.url) {
        item.isShow = true
        return
      }
      data.url = imageData?.url
      data.fileMd5 = imageData?.fileMd5
      param.image_path = imageData.url
      param.file_md5 = imageData?.fileMd5
    }
    slideData.showPageList = false

    if (!param.image_path) {
      item.isShow = true
      return
    }
    let res: any = null

    res = await viewThemeModle(param, `beautify-${item.id}`)

    if (res?.code !== 200) {
      slideData.isShow = true
      return
    }
    const newData = {
      ...data,
      viewData: res.data,
    }
    mainStore.setBeautifyData({ [slideData.id]: newData })
    viewData = JSON.parse(JSON.stringify(newData.viewData))

    if (!item.isChangNum) {
      item.isChangNum = 1
    } else {
      item.isChangNum += 1
    }

    const newSlides = slideInfo.value.slides
    await beautifyThemeApply(slideData, newSlides, viewData, {
      font: themeDatas.value?.fontStyleData,
      color: JSON.parse(JSON.stringify(themeDatas.value?.themeColorData)),
      style: themeDatas.value?.style,
      width: slideInfo.value.info.width,
      height: slideInfo.value.info.height,
    })

    nextTick(() => {
      fontSizeResize(viewSiles.value)
      viewSilesCopy.value = ref(JSON.parse(JSON.stringify(viewSiles.value)))
    })
    beautifyEnd.value = true
    // 美化结束
    beautifyLoading.value = false

    item.isShow = true
  }

  // 单页内容单独美化
  const handleSingView = async (item?: any) => {
    beautifyTips.value = t('beautify.tips17')
    item.showPageList = false
    item.showOldImg = false
    const checkItemID = item.id
    const slideData = viewSiles.value.find(
      (item: any) => item.id === checkItemID
    )
    if (!slideData) return
    item.isShow = false
    item.isError = false

    loadingThemeTipsNext(pageLoadingList, item)
    const oldeSlides = JSON.parse(JSON.stringify(slides.value))
    const oldeSlideData = oldeSlides.find(
      (item: any) => item.id === checkItemID
    )
    slideData.elements = oldeSlideData.elements
    const newSlides = slideInfo.value.slides
    beautifyEnd.value = false
    // 美化结束
    beautifyLoading.value = true
    let data = beautifyData.value ? beautifyData.value[slideData.id] : null

    if (!data?.viewData && hasNoTagsElement(item)) {
      const param = {
        total_page: slides.value.length,
        now_page: activeIndex.value + 1,
        image_path: data?.url,
        page_type: name,
        file_md5: data?.fileMd5,
        refresh: 'True',
        task_id: canceltaskId.value,
      }
      if (!data?.url) {
        if (!data) {
          data = {}
        }
        if (!showCarpSlide.value?.show) {
          mainStore.setShowCarpSlide({
            show: true,
            isAllSlide: true,
          })
        }
        const imageData: any = await handleCarpImg(item.id)
        if (!imageData?.url) {
          item.isShow = true
          return
        }
        data.url = imageData.url
        data.fileMd5 = imageData?.fileMd5
        param.image_path = imageData.url
        param.file_md5 = imageData?.fileMd5
      }
      if (!param.image_path) {
        item.isShow = true
        return
      }
      try {
        const res: any = await viewThemeModle(param, `beautify-${item.id}`)
        if (res?.code !== 200) {
          slideData.isShow = true
          beautifyEnd.value = true
          // 美化结束
          beautifyLoading.value = false
          return
        }
        const newData = {
          ...data,
          viewData: res.data,
        }

        mainStore.setBeautifyData({ [slideData.id]: newData })
        data.viewData = JSON.parse(JSON.stringify(newData.viewData))
      } catch (error) {
        item.isShow = true
      }
    }

    if (!item.isChangNum) {
      item.isChangNum = 1
    } else {
      item.isChangNum += 1
    }
    beatufiySlideList.value = viewSiles.value
    await beautifySingTheme(slideData, newSlides, data?.viewData, {
      font: themeDatas.value.fontStyleData,
      color: JSON.parse(JSON.stringify(themeDatas.value.themeColorData)),
      style: themeDatas.value.style,
      width: slideInfo.value.info.width,
      height: slideInfo.value.info.height,
    })
    nextTick(() => {
      fontSizeResize(viewSiles.value)
      viewSilesCopy.value = ref(JSON.parse(JSON.stringify(viewSiles.value)))
    })
    beautifyEnd.value = true
    // 美化结束
    beautifyLoading.value = false
  }

  const handleToggleDrawing = async () => {
    const imgTags = ['image', 'wordcloud', 'childimage']
    const pageTags = ['content', 'multcontent', 'background']
    viewSiles.value = viewSiles.value.map((item: any) => {
      if (item.elements?.length) {
        let count = 0
        if (pageTags.includes(item?.tags?.custom?.page_type)) {
          item.elements.forEach((el: any) => {
            if (imgTags.includes(el.tags?.custom?.shape_type)) {
              if (openDrawing.value) {
                // 如果是打开了的数据
                // 应该存储的是 不是实时绘制的图片
                if (!item.cc0ImageList) {
                  item.cc0ImageList = []
                }
                item.cc0ImageList.push(el.src)
              } else {
                // 存储是 实时绘制的图片
                if (!item.drawingImageList) {
                  item.drawingImageList = []
                }
                item.drawingImageList.push(el.src)
              }
              el.imgResect = true
              el.src = ''
              count++
            }
          })
          if (count > 0) {
            item.isShow = false
          }
        }
      }
      return item
    })

    await Promise.all(
      viewSiles.value.map(async (element: any) => {
        const imgLeng = element.elements.filter((item: any) => {
          return item.imgResect
        }).length
        let imgIndex = 0
        if (openDrawing.value) {
          // 这里是渲染的取实时绘制的图
          element.tempImageList = element?.drawingImageList || []
        } else {
          element.tempImageList = element?.cc0ImageList || []
        }
        await Promise.all(
          element.elements.map(async (item: any) => {
            if (item.imgResect) {
              if (!item.src) {
                // 如果总的图片个数小于 当前模版图片数量时 请求接口
                if (element.tempImageList?.length < imgLeng) {
                  const { text, content }: any = filleImageUrlToElement(
                    item,
                    element.elements
                  )
                  if (text) {
                    const imgRes = await getImageApi(text, content, content)
                    element.tempImageList = [
                      ...element.tempImageList,
                      ...imgRes,
                    ]
                  } else {
                    delete item.imgResect
                  }
                }
                if (element.tempImageList?.length) {
                  item.src = element.tempImageList[imgIndex]
                  imgIndex++
                }
              }

              if (openDrawing.value) {
                // 这里是渲染的取实时绘制的图
                element.drawingImageList = element?.tempImageList || []
              } else {
                element.cc0ImageList = element?.tempImageList || []
              }
              if (item.src) {
                item = await replaceImg(item, item.src)
              } else {
                delete item.imgResect
              }
            }
          })
        )
        element.isShow = true
      })
    )
  }

  // 点赞 不点赞
  const handleClickThumbs = debounce(
    function (item, type, index) {
      const data = beautifyData.value ? beautifyData.value[item.id] : null
      let title = ''
      if (type === 'yes') {
        title = '点赞'
        item.isGood = type
      } else if (type === 'no') {
        title = '踩'
        item.isGood = type
      } else if (type === 'clear') {
        title = '清除页面效果'
        item.background = slides.value[index].background
        item.elements = slides.value[index].elements
        item.tags = slides.value[index].tags
      }
    },
    300,
    { trailing: true }
  )

  // pc端
  const showSearchIndex = ref(0)
  // 查看大图
  const handleOpenItem = (item: any, index: number) => {
    handlePageViewChange()
    item.showOldImg = false
    showSearchIndex.value = index
    checkItem.value = item
    checkItemIndex.value = index
    showBigView.value = true

    nextTick(() => {
      if (!thumbnailsRef.value) return
      const element: any = document.getElementById(
        `views-bar-${checkItem.value.id}`
      )
      thumbnailsRef.value.scrollBy(element.offsetWidth * index, 0)
    })
  }

  const handleCompare = () => {
    oldImgUrl.value = ''
    isOpenCompare.value = !isOpenCompare.value
    viewSiles.value = viewSiles.value.map((item: any) => {
      item.showOldImg = isOpenCompare.value
      return item
    })
  }

  const delayTime = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
  // 解析json文件
  const handleUploadJson = async (slides: any) => {
    const datajson = exportApiToJSON(slides)
    const blob = new Blob([JSON.stringify(datajson)], {
      type: 'application/json',
    })
    const file = new File([blob], `${title.value}.json`, {
      type: 'application/json',
    })
    let type = 'onlineEditorJson'

    return await onUploads(file, type)
  }
  // 取消美化
  const handleClose = () => {
    cancelRequestsWithPrefix('beautify-')
    canceltask({ id: canceltaskId.value, task: 'VisionSlide' })
    slidesStore.updateSlideIndex(0)
    mainStore.setShowBeautifyPage(false)
    mainStore.setChatPPTBeautify(false)

    mainStore.removeBeautifyDocument(null)
    mainStore.setBeautifyFirstView(null)
    localStorage.removeItem('beautifyPPT')
    localStorage.removeItem('importPPT')
    localStorage.removeItem('ppt2json_id')

    const w = presentation.value.width
    const h = presentation.value.height
    slidesStore.setViewportSize(w)
    slidesStore.setViewportRatio(h / w)
    mainStore.setShowCarpSlide({
      show: false,
    })

    mainStore.setBeautifyDataNew(null)
  }
  // 美化 保存
  const handleSave = async (isMobile?: boolean) => {
    if (!beautifyEnd.value) {
      return
    }

    const themeData: any = themeDatas.value
    const pptInfo: any = slideInfo.value.info
    pptInfo.style = themeData.style
    pptInfo.docTheme.themeColors = themeData?.themeColorData

    if (presentation.value?.tags) {
      pptInfo.tags = presentation.value.tags
      if (pptInfo.tags.normal?.length) {
        pptInfo.tags.normal.forEach((item: any) => {
          if (item?.key === 'TAG_PRESENTATION_STYLE') {
            item.value = pptInfo.style
          }
        })
      }
    }
    mainStore.setPresentationItem({
      width: pptInfo.width,
      height: pptInfo.height,
      name: title.value,
      docTheme: pptInfo.docTheme,
      style: pptInfo.style,
    })
    slidesStore.setThemeColorList(pptInfo?.docTheme?.themeColors)
    if (!watchInitData.value?.openColorSingle) {
      const colorStyle = pptInfo?.docTheme?.color
      if (colorStyle) {
        slidesStore.updateResourcesData({ color_style: colorStyle })
      }
      slidesStore.updateResourcesData({ main_color: themeData.page_color })
    }

    viewSiles.value = viewSiles.value.map((oldSlide: any) => {
      delete oldSlide?.tempImageList
      delete oldSlide?.cc0ImageList
      delete oldSlide?.drawingImageList
      return deletThemeColorList(oldSlide)
    })

    slidesStore.setSlides(viewSiles.value)
    addHistorySnapshot()
    handleClose()

    const hasChangePage = viewSiles.value.some(
      (item: any) => item.isChangNum > 0
    )
    const params: any = {
      record_id: record_id.value,
    }

    const theme = {
      color_style: themeDatas.value.color_style,
      design_type: themeDatas.value.design_type,
      id: themeDatas.value.id,
      include_bg: themeDatas.value.include_bg,
      json: themeDatas.value.json,
      language: themeDatas.value.language,
      page_color: themeDatas.value.page_color,
      style: themeDatas.value.style,
    }
    if (hasChangePage) {
      fileJsonData.value = await handleUploadJson(viewSiles.value)
      params.url = fileJsonData.value?.key
      params.beautify = JSON.stringify(theme)
    }

    mainStore.setSaveBoxShow({
      show: true,
      view: false,
      noInfo: true,
    })
  }
  const handleCarpImg = async (id: string) => {
    return await nextTick(async () => {
      let dom = null
      dom = document.getElementById(`save-${id}`)
      if (!dom) return
      const imageData: any = await returnImgUrl(
        dom,
        1,
        imgFileType,
        `beautify-img-${id}`
      )
      return imageData
    })
  }

  // 裁剪图片
  const hadleCarpSlide = async () => {
    await nextTick(async () => {
      const silde = slides.value[0]
      let dom = null
      dom = document.getElementById(`save-${silde.id}`)
      if (!dom) return

      const imageData: any = await returnImgUrl(
        dom,
        1,
        imgFileType,
        'beautify-btn-singImage'
      )
      if (!imageData?.url) return
      let tempData = {
        url: imageData.url,
        id: silde.id,
        fileMd5: imageData?.fileMd5,
      }
      const params = {
        total_page: slides.value.length,
        now_page: 1,
        image_path: imageData.url,
        file_md5: imageData?.fileMd5,
        refresh: 'False',
        task_id: canceltaskId.value,
      }
      try {
        const res: any = params?.image_path
          ? await viewThemeModle(params, `beautify-${silde.id}`)
          : null
        if (res?.code !== 200) return
        const newData = {
          ...tempData,
          viewData: res.data,
        }
        isNoViewData.value = newData
        tempData = newData
        mainStore.setBeautifyData({ [silde.id]: tempData })
      } catch (error) {}
    })
  }

  const loadingSept = ref(1)
  const loadingThemeTips = async (list: any, num?: number) => {
    for (let index = 0; index < list.length; index++) {
      let element = list[index]
      if (loadingSept.value > 1) {
        break
      }
      await delayTime(100)
      if (element.indexOf('num/count') > -1) {
        if (num) {
          let page_num = num > 9 ? num : `0${num}`
          const page_count =
            slides.value?.length <= 9
              ? `0${slides.value?.length}`
              : slides.value?.length
          if (num === 0) {
            page_num = 0
          }
          element = element.replace('num/count', `${page_num}/${page_count}`)
        } else {
          element = element.replace('num/count', '')
        }
      }
      if (themeDatas.value) {
        if (element.indexOf('theme') > -1) {
          element = element.replace('theme', themeDatas.value?.style)
        } else if (element.indexOf('color') > -1) {
          element = element.replace('color', themeDatas.value?.color_style)
        } else if (element.indexOf('font') > -1) {
          element = element.replace('font', themeDatas.value?.color_style)
        }
      } else {
        if (element.indexOf('theme') > -1) {
          element = element.replace('theme', '')
        } else if (element.indexOf('color') > -1) {
          element = element.replace('color', '')
        } else if (element.indexOf('font') > -1) {
          element = element.replace('font', '')
        }
      }
      beautifyTips.value = element
    }
    if (!themeDatas.value && loadingSept.value === 1) {
      await delayTime(100)
      loadingThemeTips(themeLoadingList)
    }
  }
  const loadingThemeTipsNext = async (
    list: any,
    data?: any,
    isNum?: boolean
  ) => {
    let num = slides.value.findIndex((item: any) => item.id === data.id)
    if (num !== undefined) {
      num = num + 1
    }
    if (isNum) {
      num = isBeautyCount.value
    }
    for (let index = 0; index < list.length; index++) {
      let element = JSON.parse(JSON.stringify(list[index]))
      if (data && data.isShow) {
        break
      }
      await delayTime(200)
      if (element.indexOf('num/count') > -1) {
        if (num || num === 0) {
          let page_num = num > 9 ? num : `0${num}`
          if (num === 0) {
            page_num = 0
          }
          const page_count =
            slides.value?.length <= 9
              ? `0${slides.value?.length}`
              : slides.value?.length
          element = element.replace('num/count', `${page_num}/${page_count}`)
        } else {
          element = element.replace('num/count', '')
        }
      }
      beautifyTips.value = element
    }
    if (data && !data?.isShow) {
      if (isNum && isBeautyCount.value === slides.value?.length) {
        return
      }
      await delayTime(100)
      await loadingThemeTipsNext(list, data, isNum)
    }
  }

  const handleToggle = (value: boolean, type: string) => {
    const themeData = fullThemePages.value.list[activeTheme.value]
    if (type === 'img') {
      openDrawing.value = value
      handleToggleDrawing()
    } else {
      openColorSingle.value = !value
      handleCheckFullSingColor()
      viewSiles.value = viewSiles.value.map((item: any) => {
        return elementAddThemeColor(item, themeData.themeColorData)
      })
    }
  }
  isOnlyUse.value = true

  // 初始化
  const initFunction = async (value: any, isOtherSet?: boolean) => {
    beautifyTips.value = t('beautify.tips5')
    if (!isOtherSet) {
      mainStore.setBeautifyData({ [value.id]: value })
    }
    loadingThemeTips(themeLoadingList)
    if (watchInitData.value?.type === 'byBeautifyBtn') {
      canceltaskId.value = nanoid(10)
    }

    if (!value) {
      if (
        (watchInitData.value?.type === 'byBeautifyBtn' &&
          hasNoTagsElement(watchInitData.value?.slidesData?.slide)) ||
        watchInitData.value?.type !== 'byBeautifyBtn'
      ) {
        if (!showCarpSlide.value?.show) {
          mainStore.setShowCarpSlide({
            show: true,
            isAllSlide: true,
          })
        }
        await hadleCarpSlide()
        value = isNoViewData.value
      }

      if (watchInitData.value?.type === 'byBeautifyBtn') {
        mainStore.setBeautifyData({ [watchInitData.value.id]: value })
      }
    }

    activeTheme.value = 0
    const viewDataTheme = value?.viewData
      ? JSON.parse(JSON.stringify(value?.viewData))
      : null
    allDeepViewData.value = viewDataTheme
    if (allDeepViewData.value) {
      allDeepViewData.value.slideId = viewDataTheme?.id
    }

    openColorSingle.value = false
    // 这是 ai排版全文美化进入的
    if (
      watchInitData.value?.type === 'byBeautifyBtn' &&
      watchInitData.value?.list?.length
    ) {
      fullThemePages.value.list = JSON.parse(
        JSON.stringify(watchInitData.value?.list)
      )
      activeTheme.value = watchInitData.value?.list.findIndex(
        (item: any) => item.id === watchInitData.value?.slidesData.id
      )

      nextTick(() => {
        const element = document.getElementById(
          `list-${watchInitData.value?.slidesData.id}`
        )
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      })

      openColorSingle.value = watchInitData.value?.openColorSingle
      openDrawing.value = watchInitData.value?.openDrawing
      if (!activeTheme.value) {
        activeTheme.value = 0
      }

      fullThemePages.value.showLoding = false
      if (watchInitData.value?.scrollId) {
        themeModleIds.value = watchInitData.value?.scrollId
      }
      loadingSept.value = 2
      beautifyTips.value = t('beautify.tips31')
      await handleDomToView()
    } else {
      await getFullTemplate(10, beautifyDocument.value?.themeId)
      loadingSept.value = 2
      beautifyTips.value = t('beautify.tips31')
    }
  }

  // 下一页
  const handleClickLeftOrRight = (type: any) => {
    let index = viewSiles.value.findIndex(
      (item: any) => item.id === checkItem.value.id
    )
    if (
      (type === 'left' && index === viewSiles.value.length - 1) ||
      (type === 'right' && index === 0)
    ) {
      return
    }

    if (type === 'left') {
      index++
    } else {
      index--
    }

    showSearchIndex.value = index
    if (!viewSiles.value[index]) return
    checkItem.value = viewSiles.value[index]
    nextTick(() => {
      const element = document.getElementById(`views-bar-${checkItem.value.id}`)
      if (element) {
        element.scrollIntoView({ inline: 'center', behavior: 'smooth' })
      }
    })
  }
  const handleChangeViewSearch = (item: any, index: number) => {
    checkItem.value = item
    showSearchIndex.value = index
  }

  const thumbnailsRef = ref<HTMLElement>()
  const WheelThumbnails = (e: WheelEvent) => {
    if (!upperThumbnailBox.value) return
    upperThumbnailBox.value.scrollBy(0, e.deltaY)
  }

  const handleMousewheelThumbnails = (e: WheelEvent) => {
    if (!thumbnailsRef.value) return
    thumbnailsRef.value.scrollBy(e.wheelDelta, 0)
  }
  const handleMouseOverRight = (index: number) => {
    if (upperThumbnailBox.value) {
      upperThumbnailBox.value.scrollTo(0, 0)
    }
    if (beautifyLoading.value) return
    viewSiles.value[0] = {
      ...viewSiles.value[0],
      isShow: true,
      background: fullThemePages.value.list[index].slide.background.color,
      elements: fullThemePages.value.list[index].slide.elements,
    }
  }
  const handleMouseLeaveRight = () => {
    if (beautifyLoading.value) return
    if (viewSilesCopy.value.value) {
      viewSiles.value[0] = {
        ...viewSilesCopy.value.value[0],
        isShow: true,
      }
    }
  }

  // 主题滚动加载
  const handleScrollTheme = async (event: any) => {
    const { scrollTop, scrollHeight, clientHeight } = event.target
    // // 当滚动到底部时加载更多数据
    if (scrollHeight - scrollTop - clientHeight < 2) {
      fullScrollNext()
    }
  }

  const handleChildEvent = (item: any, type: any) => {
    item.showPageList = false
    if (type === 'show') {
      if (isOpenCompare.value) {
        item.showOldImg = !item.showOldImg
      } else {
        item.showOldImg = true
      }
      oldImgUrl.value = beautifyData.value
        ? beautifyData.value[item.id]?.url
        : ''
    } else {
      if (isOpenCompare.value) {
        item.showOldImg = !item.showOldImg
      } else {
        item.showOldImg = false
      }
    }
  }

  const checkItemIndex = ref(-1)
  // 移动端
  const themeRef = ref(null)

  const handleChildEventMobile = (item: any) => {
    if (!item?.showOldImg) {
      item.showOldImg = true
      oldImgUrl.value = beautifyData.value
        ? beautifyData.value[item.id]?.url
        : ''
    } else {
      item.showOldImg = false
    }
  }
  onMounted(async () => {
    const width = 960
    const h = 540
    slidesStore.setViewportSize(width)
    slidesStore.setViewportRatio(h / width)
    viewSiles.value =
      slides.value.length > 0 ? JSON.parse(JSON.stringify(slides.value)) : []
  })

  const isFirstLogding = ref(true)

  const showSelectTheme = ref(false)

  const knowledgeData = computed(() => {
    let AccessKeyId = 'csVyGKphwMxRcJ5w'
    return {
      requestData: {
        Accesskeyid: AccessKeyId,
        signKey: '',
        httpUrl: window._AIP_BASE_URL || import.meta.env.VITE_APP_BASE_API, // 请求接口环境
        token: userToken.value,
        userinfo: useInfo?.value || {},
      },
      source: 'web',
      type: 3,
    }
  })
  const isUploadFlage = ref(false)

  const handleUseTheme = async (key?: any, data?: any) => {
    if (key === 'close') {
      if (isUploadFlage.value) {
        showSelectTheme.value = false
        knowledgeData.value.type = 3
        isUploadFlage.value = false
        showSelectTheme.value = true
      } else {
        showSelectTheme.value = false
      }
    } else if (key === 'chooseSubmit') {
      const themeData = data.data
      if (themeData) {
        let firstSlide = viewSiles.value.find(
          (item: any) => item?.tags?.page_type === 'cover'
        )
        if (!firstSlide) {
          firstSlide = viewSiles.value[0]
        }

        firstSlide = JSON.parse(JSON.stringify(firstSlide))

        const datas = await setCustomeTheme(
          themeData.template_data_url,
          themeData.data.colorList,
          firstSlide
        )
        fullThemePages.value.list.unshift(datas)
        datas.showSlide = true
        nextTick(() => {
          const element = document.getElementById(`list-${datas.id}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
          }
        })
        await handleThemeClick(datas, 0)
      }
    } else if (key === 'opentemplate') {
      showSelectTheme.value = false
      knowledgeData.value.type = 1
      showSelectTheme.value = true
    } else if (key === 'savecustemplate') {
      isUploadFlage.value = true
    }
  }

  watch(
    fullThemePages.value.list,
    async (newVal) => {
      if (isFirstLogding.value && newVal.length > 0 && !isCheck.value) {
        if (!beautifyDocument.value?.id && beautifyData.value?.templateUrl) {
          const defaultThemeplatData = {
            id: nanoid(10),
            json: beautifyData.value.templateUrl,
            style: beautifyData.value.templateStyle,
            page_color: '',
            special: '',
          }
          fullThemePages.value.list.unshift(defaultThemeplatData)
        }

        if (beautifyDocument.value?.themeId) {
          const themeData = fullThemePages.value.list.find(
            (item: any) => item.id === beautifyDocument.value.themeId
          )
          if (themeData) {
            isFirstLogding.value = false
          }
        } else {
          isFirstLogding.value = false
        }

        await handleDomToView()
      }
    },
    {
      immediate: true,
      deep: true,
    }
  )

  return {
    handleThemeClick,
    handleDomToView,
    handlePageViewChange,
    changeVisison,
    handleSingView,
    handleSave,
    handleClose,
    handleClickThumbs,
    handleOpenItem,
    handleCompare,
    initFunction,
    handleClickLeftOrRight,
    handleChangeViewSearch,
    WheelThumbnails,
    handleMousewheelThumbnails,
    handleMouseOverRight,
    handleMouseLeaveRight,
    handleScrollTheme,
    getFullTemplate,
    handleChildEvent,
    handleChildEventMobile,
    handleToggle,
    handleUseTheme,
    knowledgeData,
    showSelectTheme,
    isCheck,
    pageList,
    activeTheme,
    viewSiles,
    slides,
    title,
    beautifyDocument,
    beautifyData,
    beautifyFirstView,
    presentation,
    useFileId,
    fullThemePages,
    watchInitData,
    isOpenCompare,
    showBigView,
    oldImgUrl,
    checkItem,
    slideItems,
    upperThumbnailBox,
    activeIndex,
    thumbnailsRef,
    beautifyEnd,
    beautifyLoading,
    acitveThemeId,
    checkItemIndex,
    showSearchIndex,
    beautifyTips,
    openColorSingle,
    openDrawing,
    themeRef,
    isFristTips,
    FullApiChannle,
  }
}
