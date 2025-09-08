import { nextTick, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore, useMainStore, useSnapshotStore } from '@/store'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import useHideElement from '@/hooks/useHideElement'
import useExport from '@/hooks/useExport'
import useColor from '@/hooks/useColor'
import useSaveJSON from '@/hooks/useSaveJSON'
import { SHAPE_PATH_FORMULAS } from '@/configs/shapes'
import { getSvgPathRange } from '@/utils/svgPathParser'
import { isPC, fetchUrl } from '@/utils/common'
import { emptyList } from '@/mocks/empty'
import { viewThemeModle, PPTImage, analyseStyle } from '@/api/careate'
import message from '@/utils/message'
import { useI18n } from 'vue-i18n'
export default () => {
  const { t } = useI18n()

  const { saveJSONData } = useSaveJSON()
  const { initColor } = useColor()
  const slidesStore = useSlidesStore()
  const mainStore = useMainStore()
  const snapshotStore = useSnapshotStore()
  const {
    userToken,
    useFileId,
    beautifyData,
    beautifyFirstView,
    presentation,
    getPPTStyle,
  } = storeToRefs(mainStore)
  const { toggleHideElement } = useHideElement()
  const { slideTextContentToData } = useExport()
  const { addHistorySnapshot } = useHistorySnapshot()

  const { slides, title, resourcesData, slideIndex } = storeToRefs(slidesStore)
  const ratio = 72 / 96
  const _isPC = isPC()

  let isApiFirstFlag: boolean = false
  let isElementWidthReplace = false
  // 是否转化数据值
  const dataNoReplace = ref(false)
  const lineHeightNoReplace = ref(false)
  // 如果请求接口了 需要初始化 图片组 chatppt网页需要 ，初始化一次ppt对象，这里都是为了解决保存加速问题
  const initOrgainData = () => {
    setTimeout(() => {
      const data = JSON.parse(JSON.stringify(slides.value))
      let oldData: any = sessionStorage.getItem('storeDatajson-old')
      if (oldData) {
        oldData = JSON.parse(oldData)
      }
      if (oldData && oldData.fileid === useFileId.value) {
        slidesStore.setOldSlides(oldData.oldSlidesData)
        sessionStorage.removeItem('storeDatajson-old')
      } else {
        slidesStore.setOldSlides(data)
      }
    }, 100)
  }

  const ThemeColorSave = (data: any, type?: string) => {
    if (data.presentation) {
      data.presentation.name = title.value
      mainStore.setPresentation(data.presentation)
    }
    const w = data?.presentation?.width || 960
    const h = data?.presentation?.height || 540
    slidesStore.setViewportSize(w)
    slidesStore.setViewportRatio(h / w)

    const themeColorList = data?.presentation?.docTheme?.themeColors
    if (themeColorList) {
      slidesStore.setThemeColorList(themeColorList)
    }

    const colorStyle = data?.presentation?.docTheme?.color
    if (colorStyle) {
      slidesStore.updateResourcesData({ color_style: colorStyle })
    }

    const sceneData: any = {}
    if (
      data?.presentation?.tags?.normal?.find(
        (item: any) => item.key === 'TAG_SCENE'
      )
    ) {
      sceneData.scene = data.presentation.tags.normal.find(
        (item: any) => item.key === 'TAG_SCENE'
      ).value
    }

    if (
      data?.presentation?.tags?.normal?.find(
        (item: any) => item.key === 'TAG_SPECIAL'
      )
    ) {
      sceneData.special = data.presentation.tags.normal.find(
        (item: any) => item.key === 'TAG_SPECIAL'
      ).value
    }

    mainStore.setSceneData(sceneData)
    // 上传时更改 背景颜色
    if ((type && themeColorList?.accent1) || !resourcesData.value?.main_color) {
      slidesStore.updateResourcesData({ main_color: themeColorList?.accent1 })
    }
  }

  const slideDataInit = (data: any, isFirst?: boolean, style?: string) => {
    const slides = data.slides
    if (!slides?.length) {
      slidesStore.setSlides(emptyList)
      snapshotStore.initSnapshotDatabase()
      return emptyList
    }
    slides.forEach((item: any) => {
      if (!item.actionList) {
        item.actionList = {
          interactionType: 'none',
          elInteractionType: 'default',
          elementsId: item.id,
          hiddenElementsIds: [],
          defaultElementIds: [],
        }
      }
      const elements: any = item.elements

      if (elements?.length) {
        elements.forEach((el: any) => {
          if (el.hide) {
            toggleHideElement(el.id)
          }
          handleInitElement(el, isFirst, style)
        })
      }
      if (
        JSON.stringify(item.background) === '{}' ||
        JSON.stringify(item.background) === '[]'
      ) {
        item.background = {
          type: 'solid',
          color: {
            type: 'themeColor', // 类型：themeColor、rgb
            value: 'bg1', // 颜色值，如果是themeColor，则为id；否则为十六进制色值
            transparent: 1, // 不透明度0~1
          },
        }
      }
      item.background = item.background || {
        type: 'solid',
        color: {
          type: 'themeColor', // 类型：themeColor、rgb
          value: 'bg1', // 颜色值，如果是themeColor，则为id；否则为十六进制色值
          transparent: 1, // 不透明度0~1
        },
      }
    })
    if (data.timerData) {
      mainStore.setSaveTimerData(JSON.parse(JSON.stringify(data.timerData))) // 获取JSON的时间赋值（新）2
      mainStore.setOldTimerData(JSON.parse(JSON.stringify(data.timerData))) // 获取JSON的时间赋值（旧）2
    }
    return slides
  }
  // 导入json文件初始化结构
  const initJsonData = (data: any) => {
    isElementWidthReplace = false
    ThemeColorSave(data)
    // 初始化数据
    dataNoReplace.value = sessionStorage.getItem('resectUnit') ? false : true
    const slides = sessionStorage.getItem('resectUnit')
      ? slideDataInit(data, true)
      : slideDataInit(data)
    delteSliedeVaule(slides)
    slidesStore.setSlides(slides)
    slidesStore.updateSlideIndex(0)
    snapshotStore.initSnapshotDatabase()
    // 处理字体
    fontSizeResize()
    // 初始化旧数据
    initOrgainData()
    mainStore.setSaveBoxShow({
      show: true,
      view: false,
      noInfo: true,
      isNewUplaod: true,
    })
  }
  // 刷新数据时的保存临时数据
  const oldDataJosn = (data: any) => {
    ThemeColorSave(data)
    const slides = JSON.parse(JSON.stringify(data.slides))
    delteSliedeVaule(slides)
    slidesStore.setSlides(slides)
    slidesStore.updateSlideIndex(0)
    snapshotStore.initSnapshotDatabase()
    let oldData: any = sessionStorage.getItem('storeDatajson-old')
    if (oldData) {
      oldData = JSON.parse(oldData)
    }
    if (oldData && oldData.fileid === useFileId.value) {
      slidesStore.setOldSlides(oldData.oldSlidesData)
      sessionStorage.removeItem('storeDatajson-old')
    }
  }
  const delteSliedeVaule = (slides: any) => {
    slides.forEach((item: any) => {
      if (item.elements) {
        item.elements.forEach((el: any) => {
          if (el.isApi) {
            delete el.isApi
          }
          if (el.imgResect) {
            delete el.imgResect
          }
          if (el.iconResect) {
            delete el.iconResect
          }
        })
      }
    })
  }
  const privateInitSlide = async (data: any, type?: string, save = true) => {
    ThemeColorSave(data, type)
    const slides = slideDataInit(data, true)
    slidesStore.setSlides(slides)
    slidesStore.updateSlideIndex(0)
    snapshotStore.initSnapshotDatabase()
    fontSizeResize()
    initOrgainData()
    if (save) {
      saveJSONData(slides.value, null, false, true)
    }

    if (type === 'beautify' || type === 'uploadBeautify') {
      mainStore.setShowBeautifyPage(true)
    }
  }
  // 根据返回的json文件解析数据，lineHeight，等数据无需转化
  const initSlids = (
    data: any,
    isApiFirst?: boolean,
    loadingData?: boolean
  ) => {
    isApiFirstFlag = isApiFirst || false

    isElementWidthReplace = false
    // 处理文档主题
    ThemeColorSave(data)
    dataNoReplace.value = sessionStorage.getItem('resectUnit') ? false : true
    const slides = sessionStorage.getItem('resectUnit')
      ? slideDataInit(data, true)
      : slideDataInit(data)
    if (!loadingData) {
      // 不需要逐一加载效果的
      delteSliedeVaule(slides)
      slidesStore.setSlides(slides)
      slidesStore.updateSlideIndex(0)
      snapshotStore.initSnapshotDatabase()
      fontSizeResize()
      if (isApiFirstFlag) {
        initOrgainData()
      }
      isApiFirstFlag = false
    } else {
      mainStore.setInitDataTotal(slides.length)
      mainStore.setShowLoadingMarks(true)
      const arr = JSON.parse(JSON.stringify(slides))
      slidesStore.setSlides([])
      slidesStore.updateSlideIndex(-1)
      isElementWidthReplace = true
      handleLoadingList(arr, 10)
      snapshotStore.initSnapshotDatabase()
    }
  }
  const closeJsonLoading = async (res: any, type?: string) => {
    if (res?.data?.task_status == '2') {
      // 判断最后一次 生成的内容是不是还有没有添加的json
      await jsonDataInit({
        ...res.data?.content,
      })
    }
    if (res?.data?.task_status == 2 || res?.data?.status == 2) {
      mainStore.setShowCarpSlide({ show: false, isAllSlide: false })
      fontSizeResize()
      if (!type) {
        initOrgainData()
        slidesStore.updateSlideIndex(0)
        message.success(t('create.tips6'))
      }

      // 美化
      if (type === 'beautify') {
        slides.value.forEach((item: any, index: number) => {
          const tempData = {
            url: fileUrl[index],
            id: item.id,
          }
          mainStore.setBeautifyData({ [item.id]: tempData })
        })
        mainStore.setShowBeautifyPage(true)
      }

      if (type && type !== 'init') {
        await saveJSONData(slides.value, fileUrl, false, true)
      } else {
        await saveJSONData(slides.value)
      }
      pptHearder.value = null
      initSlideList.value = []
      fileUrl = []
    } else {
      if (slides.value?.length > 0) {
        saveJSONData(slides.value)
      }
      mainStore.setShowCarpSlide({ show: false, isAllSlide: false })
      message.closeAll()
      let tips = t('create.tips7')
      if (type) {
        tips = t('create.tips8')
      }
      pptHearder.value = null
      initSlideList.value = []
      fileUrl = []
      message.error(tips)
    }
    slidesStore.updateSlideIndex(0)
    snapshotStore.initSnapshotDatabase()
    mainStore.setShowLoadingMarks(false)
    mainStore.setActiveElementIdList([])
    mainStore.setHandleElementId('')
    mainStore.setCreateLoading({
      showLoading: false,
      showRemark: null,
    })
  }
  mainStore.setbeautifyLoadingData({ loadingType: '', messageTips: '' })
  const pptHearder: any = ref(null)
  const initSlideList: any = ref([])
  let fileUrl: any = []
  const getPPTImage = async (pptUrl: string) => {
    const res: any = await PPTImage({ url: pptUrl })
    if (res.code === 200) {
      fileUrl = res.data
    }
  }
  const pptJsonList = ref([])
  const pptJsonIndex = ref([])
  const hasPPTInfo = ref(false)
  const nodesList = ref([])
  // 初始化接口解析文件
  const jsonDataInit = async (data: any, type?: string) => {
    dataNoReplace.value = false
    if (!data) return
    const conent = data.pages

    mainStore.setInitDataTotal(conent)

    slidesStore.updateResourcesData({
      main_color: data.main_color,
    })
    // ppt 宽高主题色等数据
    if (data.ppt_json && !hasPPTInfo.value) {
      const contentFile: any = await fetchUrl(data.ppt_json)
      const jsondata: any = JSON.parse(contentFile)
      // 保存主题颜色 风格 颜色等
      ThemeColorSave({ presentation: jsondata }, type)
      if (type !== 'beautify') {
        mainStore.setShowLoadingMarks(true)
      }

      isElementWidthReplace = true
      pptHearder.value = { presentation: jsondata }
      hasPPTInfo.value = true // 避免多次设置
    }

    if (data?.slide_json) {
      // 旧的缓存数据 和 新的数据 不相同时 才做章节添加
      if (
        JSON.stringify(pptJsonList.value) !==
        JSON.stringify(data.slide_json.urls)
      ) {
        const indexes = data.slide_json.indexes
        // 找出不同的章节页 如果时多个拆分添加 一个直接添加
        // 根据不同位置 进行添加
        // indexes 表示的是章节的排序 不是不同数据中索引
        const newSlideList = data.slide_json.urls.map(
          (item: any, index: any) => {
            return {
              url: item.url,
              slideIndex: indexes[index],
            }
          }
        )

        const diferentSlide = newSlideList.filter((item: any) => {
          return !pptJsonIndex.value.includes(item.slideIndex)
        })

        // 找到不一样的元素 以后要找到他要在slides数组里面添加的位置
        for (let index = 0; index < diferentSlide.length; index++) {
          const tempJsonData = diferentSlide[index]
          const tempJsonIndex = newSlideList.findIndex((item: any) => {
            return item.slideIndex === tempJsonData.slideIndex
          })

          const contentFile: any = await fetchUrl(tempJsonData.url)
          const jsondata: any = JSON.parse(contentFile)
          const slide = slideDataInit({ slides: [jsondata] }, true)[0]

          let elements = []
          if (!type) {
            if (slide.elements.length) {
              elements = JSON.parse(JSON.stringify(slide.elements))
              slide.elements = []
            }
          }

          slidesStore.addSlideAsIndex(tempJsonIndex, slide)
          mainStore.setCreateLoading({
            showLoading: false,
            loadingType: Math.floor(Math.random() * 11) + 1,
          })
          if (!_isPC) {
            await delay(50)
            const element = document.getElementById(
              `mobile-preview-${slide.id}`
            )
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' })
            }
          }

          // 默认初始化内容 一个一个加载
          const countTitme = 300
          let timer: any = 10
          timer =
            countTitme / elements.length < 40
              ? countTitme / elements.length
              : 10

          await unitDelay(elements, parseInt(timer), 1)
          fontSizeResize([slides.value[slideIndex.value]])
        }
        pptJsonList.value = JSON.parse(JSON.stringify(data.slide_json.urls))
        pptJsonIndex.value = JSON.parse(JSON.stringify(indexes))
      }
    }

    if (data?.note?.length) {
      mainStore.setCreateLoading({
        showLoading: false,
        showRemark: false,
      })
    }

    if (
      JSON.stringify(nodesList.value) !== JSON.stringify(data.note) &&
      data?.note?.length
    ) {
      const diferentNodes = data.note.filter((item: any) => {
        return !nodesList.value.includes(item.pages)
      })

      mainStore.setCreateLoading({
        tips: t('create.tips9'),
      })
      for (let index = 0; index < diferentNodes.length; index++) {
        mainStore.setCreateLoading({
          showRemark: false,
        })
        const element = diferentNodes[index]
        const slideIndex = element.page - 1
        let slideData: any = null
        slides.value.forEach((ele: any, index: number) => {
          if (index === slideIndex) {
            slideData = ele
          }
        })
        slidesStore.updateSlideIndex(slideIndex)
        slidesStore.updateSlide({ remark: element.text }, slideData.id)
        mainStore.setCreateLoading({
          showRemark: true,
        })
      }

      nodesList.value = JSON.parse(JSON.stringify(data.note))
    }
  }

  // 上传文件的接口解析文件
  const jsonDataInitFile = async (data: any, type?: string) => {
    // 是否转化数据值
    dataNoReplace.value = false
    if (!data) return
    // list  数组 json文件，当前索引
    try {
      const contentFile: any = await fetchUrl(data.key)
      const jsondata: any = JSON.parse(contentFile)

      if (data.page_num === '0') {
        if (type === 'Addin') {
          slidesStore.setTitle(jsondata.name)
          slidesStore.setOldTilte(jsondata.name)
        }

        // 保存主题颜色 风格 颜色等
        ThemeColorSave({ presentation: jsondata }, type)
        const noShowMark = ['beautify', 'init', 'Addin']
        if (type && !noShowMark.includes(type)) {
          mainStore.setShowLoadingMarks(true)
        }
        isElementWidthReplace = true
        pptHearder.value = { presentation: jsondata }
      } else {
        const conent = data.page_count
        mainStore.setInitDataTotal(conent)
        // 章节
        const slide = slideDataInit({ slides: [jsondata] }, true)[0]
        initSlideList.value.push({ num: parseInt(data.page_num), slide: slide })
        initSlideList.value.sort((a: any, b: any) => a.num - b.num)
        const index = initSlideList.value.findIndex(
          (item: any) => item.num === parseInt(data.page_num)
        )

        let elements = []
        if (!type) {
          if (slide.elements.length) {
            elements = JSON.parse(JSON.stringify(slide.elements))
            slide.elements = []
          }
        }

        slidesStore.addSlideAsIndex(index, slide)

        if (!_isPC) {
          await delay(50)
          const element = document.getElementById(`mobile-preview-${slide.id}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
          }
        }

        if (type) {
          const tempData = {
            url: fileUrl[index],
            id: slide.id,
          }
          if (type === 'beautify' && index === 0) {
            const param = {
              total_page: data?.page_count || 1,
              now_page: 1,
              image_path: fileUrl[0],
            }
            if (param.image_path) {
              viewThemeModle(param, `beautify-${slide.id}`).then((res: any) => {
                if (res.code === 200) {
                  const newData = {
                    ...tempData,
                    viewData: res.data,
                  }
                  mainStore.setBeautifyFirstView(newData)
                  if (!getPPTStyle.value) {
                    let text = ''
                    if (res.data?.title) {
                      text = res.data?.title
                    }
                    if (res.data?.subTitle) {
                      text += res.data?.subTitle.join(',')
                    }
                    if (res.data?.contentTexts) {
                      text += res.data?.contentTexts.join(',')
                    }
                    if (res.data?.otherText) {
                      text += res.data?.otherText.join(',')
                    }
                    if (text) {
                      analyseStyle({ text }).then((res: any) => {
                        if (res.code === 200) {
                          let style: any = res.data.style
                          if (Array.isArray(res.data.style)) {
                            style = res.data.style.join(',')
                          }
                          mainStore.setPresentationItem({
                            style: style,
                          })
                        }
                      })
                    }
                  }
                }
              })
            }
          }
          await delay(500)
        } else {
          // 默认初始化内容 一个一个加载
          const countTitme = 100
          let timer: any = 20
          timer =
            countTitme / elements.length < 40
              ? countTitme / elements.length
              : 10
          await unitDelay(elements, parseInt(timer), 1)
        }
        fontSizeResize([slides.value[slideIndex.value]])
      }
    } catch (error) {}
  }

  const handleLoadingList = (arr: any, interval: number) => {
    setTimeout(async () => {
      let elements = []
      const item = arr.shift()
      if (item.elements.length) {
        elements = JSON.parse(JSON.stringify(item.elements))
        item.elements = []
      }
      slidesStore.addSlide(item)
      if (!_isPC) {
        await delay(50)
        const element = document.getElementById(`mobile-preview-${item.id}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }
      const countTitme = 100
      let timer: any = 20
      timer =
        countTitme / elements.length > 10 ? countTitme / elements.length : 1
      await unitDelay(elements, parseInt(timer), 1)
      fontSizeResize([slides.value[slideIndex.value]])
      if (arr.length > 0) {
        handleLoadingList(arr, 20)
      } else {
        mainStore.setShowLoadingMarks(false)
        mainStore.setActiveElementIdList([])
        mainStore.setHandleElementId('')
        fontSizeResize()
        if (isApiFirstFlag) {
          initOrgainData()
        }
        isApiFirstFlag = false
      }
    }, interval)
  }
  const delay = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  const unitDelay = async (
    elementArr: any,
    timer: number,
    countNum: number
  ) => {
    if (countNum > 1) {
      await delay(timer)
    }

    countNum++
    let addElement: any = null
    addElement = elementArr.shift()
    let hasGroutId: any = []

    if (addElement?.groupId) {
      hasGroutId = elementArr.filter(
        (item: any) => item.groupId === addElement.groupId
      )
      if (!hasGroutId.find((el: any) => el.id === addElement.id)) {
        hasGroutId.unshift(JSON.parse(JSON.stringify(addElement)))
      }
    }
    if (hasGroutId.length) {
      addElement = JSON.parse(JSON.stringify(hasGroutId))
      elementArr = elementArr.filter((ele: any) => {
        return !hasGroutId.some((item: any) => item.id === ele.id)
      })
    }
    slidesStore.addElement(addElement)
    if (!hasGroutId.length) {
      mainStore.setActiveElementIdList([addElement?.id])
      mainStore.setHandleElementId(addElement?.id)
    }

    if (elementArr.length > 0) {
      await unitDelay(elementArr, timer, countNum)
    }
  }
  const handleInitElement = (item: any, isFirst?: boolean, style?: string) => {
    if (item.width < 0) {
      item.width = 0
    }
    if (item.height < 0) {
      item.height = 0
    }
    switch (item.type) {
      case 'text':
        setTextContent(item, null, isFirst, style)
        break
      case 'picture':
        setImgContent(item, isFirst)
        break
      case 'table':
        setTableContent(item)
        break
      case 'shape':
        setShapeContent(item, isFirst, style)
        break
      case 'chart':
        setChartContent(item)
        break

      case 'line':
        setLine(item)
        break
      default:
        break
    }
  }

  const updateFontSize = (
    element: HTMLElement,
    scaleFactor: number,
    data?: any
  ): boolean => {
    const currentFontSize = parseInt(element.style.fontSize)
    const newFontSize = currentFontSize + scaleFactor
    if (newFontSize < 8) return false

    if (!isNaN(newFontSize)) {
      element.style.fontSize = `${newFontSize}px`
    }

    let i = 0
    const children = element.childNodes
    while (i < children.length) {
      if (children[i].nodeType === Node.ELEMENT_NODE) {
        if (!updateFontSize(children[i] as HTMLElement, scaleFactor, data)) {
          return false // 如果子元素的更新失败，停止递归
        }
      }
      i++
    }

    if (element.nodeName === 'P') {
      const str = element.innerHTML
      const fontSizeMatches: any = str ? str.match(/font-size:\s*(\d+)px/g) : []
      // 2. 提取所有数值并转换为数字
      const fontSizes = fontSizeMatches?.length
        ? fontSizeMatches.map((match: any) => {
            return parseInt(match.match(/\d+/)[0], 10)
          })
        : []
      if (fontSizes.length) {
        // 3. 找出最大的数值
        const maxFontSize = Math.max(...fontSizes)
        const parentFontSize = 20 // 这是父元素字体大小 css定义的
        const targetHeight = maxFontSize + 4
        const multiple = (targetHeight / parentFontSize).toFixed(1)
        const dataLineHeight =
          data?.type === 'text' ? data.lineHeight : data.text.lineHeight
        const compareHeight = element.style.lineHeight || dataLineHeight
        const marginTop = element.style.marginTop || '0'
        if (multiple < compareHeight) {
          element.style.lineHeight = multiple.toString()
          element.style.marginBottom = '0px'
          if (parseInt(marginTop) > 5) {
            element.style.marginTop = parseInt(marginTop) - 2 + 'px'
          }
          element.style.removeProperty('margin-bottom')

          if (data) {
            if (data.type === 'text') {
              data.lineHeight = parseFloat(multiple)
            } else {
              data.text.lineHeight = parseFloat(multiple)
            }
          }
        }
      }
    }

    return true // 所有子元素更新成功
  }

  const resizeFontSize = (el: any): void => {
    try {
      if (el?.text) {
        const type = el.type
        const textDom: any = document.querySelector<HTMLElement>(
          `.base-element-${el.id} .base-element-${type}`
        )
        const height = textDom?.offsetHeight - 8 || 0 // 减8是框的padding 在/TextElement/index 可以看到
        const childBox = document.querySelector<HTMLElement>(
          `.base-element-${el.id} .ProseMirror-static`
        )
        const childrenHeight = childBox?.offsetHeight || 0

        if (childrenHeight > height && childBox) {
          const result = updateFontSize(childBox, -1, el)
          if (result && childBox.innerHTML) {
            if (type === 'text') {
              el.content = childBox.innerHTML
            } else {
              el.text.content = childBox.innerHTML
            }
            slideTextContentToData(el, el.type, true)
            resizeFontSize(el)
          }
        }
      }
    } catch (error) {
      console.error('Error in resizeFontSize:', error)
    }
  }
  const initSingleElement = async (el: any) => {
    await new Promise<void>((resolve) => {
      nextTick(async () => {
        if (el.text && el.text?.text && el?.text?.autoSize === 'textFitShape') {
          const type = el.type
          const textDom: any = document.querySelector<HTMLElement>(
            `.base-element-${el.id} .base-element-${type}`
          )
          const height = textDom?.offsetHeight - 8 || 0
          const childBox = document.querySelector<HTMLElement>(
            `.base-element-${el.id} .ProseMirror-static`
          )
          const childrenHeight = childBox?.offsetHeight || 0
          if (childrenHeight > height && childBox) {
            await delay(100)

            const result = updateFontSize(childBox, -1, el)
            if (result && childBox.innerHTML) {
              if (type === 'text') {
                el.content = childBox.innerHTML
              } else {
                el.text.content = childBox.innerHTML
              }
              slideTextContentToData(el, el.type, true)
              await initSingleElement(el)
            }
          }
        }
        resolve()
      })
    })
  }

  const fontSizeResize = (list?: any) => {
    const resizeList = list || slides.value
    if (!resizeList?.length) return
    nextTick(() => {
      resizeList.forEach((item: any) => {
        const textElement = item.elements?.filter(
          (el: any) =>
            el.text && el.text?.text && el?.text?.autoSize === 'textFitShape'
        )
        const childTitle: any = []
        const childContent: any = []
        const childContentLineHeight: any = []
        const childTitleLineHeight: any = []
        textElement.forEach((el: any) => {
          resizeFontSize(el)

          // 将图示类型的title 和子内容的字体大小设置统一大小
          if (
            (item?.tags?.custom?.page_type === 'multcontent' &&
              el?.tags?.custom?.shape_type === 'childtitle') ||
            el?.tags?.custom?.shape_type === 'childcontent'
          ) {
            const content = el.type === 'text' ? el.content : el.text.content

            const fontSizeMatches: any = content
              ? content.match(/font-size:\s*(\d+)px/g)
              : []
            const lineHeightMatches: any = content
              ? content.match(/line-height\s*:\s*([\d.]+);/g)
              : []
            // 2. 提取所有数值并转换为数字
            const fontSizes = fontSizeMatches?.length
              ? fontSizeMatches.map((match: any) => {
                  return parseInt(match.match(/\d+/)[0], 10)
                })
              : []

            const fontSize = fontSizes?.length ? Math.max(...fontSizes) : 0
            const lineHeights = lineHeightMatches?.length
              ? lineHeightMatches.map((match: any) => {
                  return parseFloat(match.match(/[\d.]+/)[0])
                })
              : []
            const lineHeight = lineHeights?.length
              ? Math.max(...lineHeights)
              : 0
            if (el?.tags?.custom?.shape_type === 'childtitle') {
              childTitle.push(fontSize)
              childTitleLineHeight.push(lineHeight)
            } else if (el?.tags?.custom?.shape_type === 'childcontent') {
              childContent.push(fontSize)
              childContentLineHeight.push(lineHeight)
            }
          }
        })

        const childTitleSize =
          childTitle?.length && new Set(childTitle).size > 1
            ? Math.min(...childTitle)
            : 0
        const childContentSzie =
          childContent?.length && new Set(childContent).size > 1
            ? Math.min(...childContent)
            : 0
        if (
          (childTitleSize || childContentSzie) &&
          item?.tags?.custom?.page_type === 'multcontent'
        ) {
          textElement.forEach((el: any) => {
            let fontSize: any = 0
            let lineHeight: any = 0
            if (el?.tags?.custom?.shape_type === 'childtitle') {
              fontSize = childTitleSize
              lineHeight = childTitleLineHeight?.length
                ? Math.min(...childTitleLineHeight)
                : 0
            } else if (el?.tags?.custom?.shape_type === 'childcontent') {
              fontSize = childContentSzie
              lineHeight = childContentLineHeight?.length
                ? Math.min(...childContentLineHeight)
                : 0
              if (childTitleSize < childContentSzie && childTitleSize > 0) {
                fontSize = childTitleSize - 2
                lineHeight = childTitleLineHeight?.length
                  ? Math.min(...childTitleLineHeight)
                  : 0
              }
            }
            if (fontSize) {
              const content = el.type === 'text' ? el.content : el.text.content
              let str = content.replace(
                /font-size:\s*(\d+)px/g,
                `font-size:${fontSize}px`
              )

              if (lineHeight) {
                str = str.replace(
                  /line-height:\s*([\d.]+);/g,
                  `line-height:${lineHeight};`
                )
              }

              if (el.type === 'text') {
                el.content = str
              } else {
                el.text.content = str
              }
            }
          })
        }
      })
      // 将章apter的文字字体大小设置统一大小
      const chapterList = resizeList.filter((item: any) => {
        return item?.tags?.custom?.page_type === 'chapter'
      })
      if (chapterList?.length > 1) {
        const chatpterTitleFontSize: any = []
        const chatpterNumFontSizeList: any = []
        const chatpterLineHeight: any = []
        chapterList.forEach((item: any) => {
          item.elements.forEach((el: any) => {
            if (el?.text?.text) {
              const content = el.type === 'text' ? el.content : el.text.content
              const fontSizeMatches: any = content
                ? content.match(/font-size:\s*(\d+)px/g)
                : []
              const lineHeightMatches: any = content
                ? content.match(/line-height\s*:\s*([\d.]+);/g)
                : []
              // 2. 提取所有数值并转换为数字
              if (fontSizeMatches?.length) {
                const fontSizes = fontSizeMatches.map((match: any) => {
                  return parseInt(match.match(/\d+/)[0], 10)
                })
                if (el?.tags?.custom?.shape_type === 'title') {
                  chatpterTitleFontSize.push(Math.max(...fontSizes))
                } else if (el?.tags?.custom?.shape_type === 'num') {
                  chatpterNumFontSizeList.push(Math.max(...fontSizes))
                }
              }

              if (lineHeightMatches?.length) {
                const lineHeights = lineHeightMatches?.length
                  ? lineHeightMatches.map((match: any) => {
                      return parseFloat(match.match(/[\d.]+/)[0])
                    })
                  : []
                const lineHeight = lineHeights?.length
                  ? Math.max(...lineHeights)
                  : 0
                if (el?.tags?.custom?.shape_type === 'title') {
                  chatpterLineHeight.push(lineHeight)
                }
              }
            }
          })
        })

        const chatperFontSize =
          chatpterTitleFontSize?.length &&
          new Set(chatpterTitleFontSize).size > 1
            ? Math.min(...chatpterTitleFontSize)
            : ''
        const chatpterNumFontSize =
          chatpterNumFontSizeList?.length &&
          new Set(chatpterNumFontSizeList).size > 1
            ? Math.min(...chatpterNumFontSizeList)
            : ''
        const chapterkeyList = ['title', 'num']
        chapterList.forEach((item: any) => {
          item.elements.forEach((el: any) => {
            if (
              el?.text?.text &&
              chapterkeyList.includes(el?.tags?.custom?.shape_type)
            ) {
              let fontSize: any = 0
              let lineHeight: any = 0
              if (el?.tags?.custom?.shape_type === 'title') {
                fontSize = chatperFontSize
                lineHeight = chatpterLineHeight?.length
                  ? Math.min(...chatpterLineHeight)
                  : 0
              } else if (el?.tags?.custom?.shape_type === 'num') {
                fontSize = chatpterNumFontSize
              }
              if (fontSize) {
                const content =
                  el.type === 'text' ? el.content : el.text.content
                let str = content.replace(
                  /font-size:\s*(\d+)px/g,
                  `font-size:${fontSize}px`
                )
                if (lineHeight) {
                  str = str.replace(
                    /line-height:\s*([\d.]+);/g,
                    `line-height:${lineHeight};`
                  )
                }
                if (el.type === 'text') {
                  el.content = str
                } else {
                  el.text.content = str
                }
              }
            }
          })
        })
      }
    })
  }
  const resectGroupElement = (list) => {
    const groupIdList: any = {}

    list.forEach((item: any) => {
      if (groupIdList[item.groupId]) {
        groupIdList[item.groupId].push(item)
      } else {
        groupIdList[item.groupId] = [item]
      }
    })

    for (const key in groupIdList) {
      if (Object.prototype.hasOwnProperty.call(groupIdList, key)) {
        const element = groupIdList[key]
        // 旋转角度
        let angle = null
        const rotateData = element.find((item: any) => item.groupRotate)
        if (rotateData) {
          angle = rotateData.groupRotate
        }
        // 计算出弧度
        const theta = (angle * Math.PI) / 180
        // cos与sin弧度
        const cosTheta = Math.cos(theta)
        const sinTheta = Math.sin(theta)
        const center = getRotatedBoundingBoxCenter(element)

        element.forEach((item: any) => {
          const shapeCenter = {
            x: item.left + item.width / 2,
            y: item.top + item.height / 2,
          }

          const newX =
            (shapeCenter.x - center.x) * cosTheta -
            (shapeCenter.y - center.y) * sinTheta +
            center.x
          const newY =
            (shapeCenter.x - center.x) * sinTheta -
            (shapeCenter.y - center.y) * cosTheta +
            center.x

          item.left = Math.trunc(newX - item.width / 2)
          item.top = Math.trunc(newY - item.height / 2)
        })
      }
    }

    return list
  }

  const getRotatedBoundingBoxCenter = (shapes: any) => {
    const totalCenter = { x: 0, y: 0 }
    let count = 0
    const centerList: any = []

    shapes.forEach((shape: any) => {
      centerList.push({
        x: shape.left + shape.width / 2,
        y: shape.top + shape.height / 2,
      })
      const center = {
        x: shape.left + shape.width / 2,
        y: shape.top + shape.height / 2,
      }
      totalCenter.x += center.x
      totalCenter.y += center.y
      count++
    })

    const x =
      Math.min(...centerList.map((obj: any) => obj.x)) +
      Math.max(...centerList.map((obj: any) => obj.x)) -
      Math.min(...centerList.map((obj: any) => obj.x)) / 2
    const y =
      Math.min(...centerList.map((obj: any) => obj.y)) +
      Math.max(...centerList.map((obj: any) => obj.y)) -
      Math.min(...centerList.map((obj: any) => obj.y)) / 2

    return {
      x: totalCenter.x / count,
      y: totalCenter.y / count,
    }
  }

  const returnSvgPath = (svgPath: string) => {
    const svgString = svgPath
    const parser = new DOMParser()
    const svgDoc = parser.parseFromString(svgString, 'image/svg+xml')
    const paths = svgDoc.querySelectorAll('path')
    const dAttributes = Array.from(paths).map((path) =>
      path.getAttribute('d')?.trim()
    )
    const attrArry: any = []
    paths.forEach((path) => {
      // 获取所有属性的名称
      const attributeNames = path.getAttributeNames()
      const obj: any = {}
      const noAttr = [
        'd',
        'width',
        'height',
        'x',
        'y',
        'vewBox',
        'class',
        'stroke',
        'filter',
        'stroke-miterlimit',
        'vector-effect',
        'stroke-linecap',
        'key',
      ]
      // 遍历属性名称并获取属性值
      for (let i = 0; i < attributeNames.length; i++) {
        const attrName = attributeNames[i]
        const attrValue = path.getAttribute(attrName)
        if (!noAttr.includes(attrName) && attrValue) {
          obj[attrName] = attrValue
        }
      }

      if (JSON.stringify(obj) !== '{}') {
        attrArry.push(obj)
      }
    })

    return { dAttributes, attrArry }
  }
  const setImgContent = (item: any, isFirst?: boolean) => {
    if (item.src && item.src.indexOf('http://file.static.yoojober.cn') > -1) {
      item.src = item.src.replace(
        'http://file.static.yoojober.cn',
        'https://file.static.yoojober.cn'
      )
    }

    if (
      item.src &&
      item.src.indexOf('https://yoo-web-public-bj.bj.bcebos.com') > -1
    ) {
      item.src = item.src.replace(
        'https://yoo-web-public-bj.bj.bcebos.com',
        'https://yoo-web-public-bj.cdn.bcebos.com'
      )
    }

    if (item.svgPath) {
      if (!item.clip) {
        item.clip = {
          range: [
            [0, 0],
            [100, 100],
          ],
        }
      }
      const svgPath = item.svgPath
      const { dAttributes, attrArry } = returnSvgPath(svgPath)
      if (attrArry?.length > 0 && !item.attrArry?.length) {
        item.attrArry = attrArry
      }

      const leng = dAttributes.length
      if (leng === 1) {
        item.clip.path = dAttributes[0]
      } else if (leng > 1) {
        item.clip.path = dAttributes
      }

      const originWidth = item.width || 1
      const originHeight = item.height || 1
      const { maxX, maxY } = getSvgPathRange(dAttributes[0])

      if (!item.clip.viewBox) {
        item.clip.viewBox = [maxX || originWidth, maxY || originHeight]
        item.clip.viewBox = [item.width * ratio, item.height * ratio]
      }

      if (isFirst && item?.clip?.shape) {
        delete item.clip.shape
      }
    }
    item.type = 'image'
    item.fixedRatio = true
  }
  const setOnlyImgContent = (item: any, isFirst?: boolean) => {
    if (
      item.fillPicture?.src &&
      item.fillPicture.src.indexOf('http://file.static.yoojober.cn') > -1
    ) {
      item.fillPicture.src = item.fillPicture.src.replace(
        'http://file.static.yoojober.cn',
        'https://file.static.yoojober.cn'
      )
    }

    if (
      item.fillPicture?.src &&
      item.fillPicture.src.indexOf('https://yoo-web-public-bj.bj.bcebos.com') >
        -1
    ) {
      item.fillPicture.src = item.fillPicture.src.replace(
        'https://yoo-web-public-bj.bj.bcebos.com',
        'https://yoo-web-public-bj.cdn.bcebos.com'
      )
    }

    if (item.svgPath) {
      if (!item.clip) {
        item.clip = {
          range: [
            [0, 0],
            [100, 100],
          ],
        }
      }
      const svgPath = item.svgPath
      const { dAttributes, attrArry } = returnSvgPath(svgPath)
      if (attrArry?.length > 0) {
        item.attrArry = attrArry
      }

      const leng = dAttributes.length
      if (leng === 1) {
        item.clip.path = dAttributes[0]
      } else if (leng > 1) {
        item.clip.path = dAttributes
      }

      const originWidth = item.width || 1
      const originHeight = item.height || 1
      const { maxX, maxY } = getSvgPathRange(dAttributes[0])

      if (!item.clip.viewBox) {
        item.clip.viewBox = [maxX || originWidth, maxY || originHeight]
        item.clip.viewBox = [item.width * ratio, item.height * ratio]
      }

      if (isFirst && item?.clip?.shape) {
        delete item.clip.shape
      }
    }

    item.fixedRatio = true
  }

  const setTextContent = (
    item: any,
    type?: any,
    isFirst?: boolean,
    styleKey?: string
  ) => {
    if (isFirst) {
      const w = item.width
      const h = item.height
      item.width = item.width + 10
      item.left = item.left - 5
      if (w === h) {
        item.height = item.width
        item.top = item.top - 5
      }
    }

    let defaultFontName = '微软雅黑'

    if (typeof item.text === 'string' || !item.text) {
      item.content = `<p>${item.text ? item.text : ''}</p>`
      item.defaultFontName = defaultFontName
      return
    }

    if (item.text.marginLeft) {
      item.text.marginLeft = 0
    }
    if (item.text.marginTop) {
      item.text.marginTop = 0
    }
    if (item.text.marginRight) {
      item.text.marginRight = 0
    }
    if (item.text.marginBottom) {
      item.text.marginBottom = 0
    }

    if (!item.text.paragraphs) return
    if (type === 'text' || !type) {
      item.content = `<p>${item.text.text}</p>`

      if (item.text.verticalAlign) {
        item.verticalAlign = item.text.verticalAlign
      }
    }
    if (item.text.paragraphs?.length) {
      const lineHeight = Math.max(
        ...item.text.paragraphs.map((obj: any) => obj.lineHeight)
      )
      const wordSpace = Math.max(
        ...item.text.paragraphs.map((obj: any) => obj.wordSpace)
      )
      const paragraphSpace = Math.max(
        ...item.text.paragraphs.map((obj: any) => obj.paragraphSpace)
      )

      const newLineHeight = lineHeight || 1
      const newWordSpace = wordSpace

      if (type === 'shape') {
        item.text.lineHeight = newLineHeight
        item.text.wordSpace = newWordSpace
      } else {
        item.lineHeight = newLineHeight
        item.wordSpace = newWordSpace
      }
    }
    const paragraphs = item.text.paragraphs
    let defaultColor = {
      type: 'themeColor', // 类型：themeColor、rgb
      value: 'text1', // 颜色值，如果是themeColor，则为id；否则为十六进制色值
      transparent: 1, // 不透明度0~1
    }
    let runsleng = 1
    let p = ''

    const plength = paragraphs?.length
    paragraphs.forEach((element: any) => {
      let str = ''
      runsleng = element.runs?.length

      if (runsleng > 0) {
        element.runs.forEach((el: any, index: number) => {
          let text = el.text

          if (el.fontColor && index === 0) {
            defaultColor = el.fontColor
          }
          defaultFontName = el.fontName || '微软雅黑'

          if (el.underline) {
            text = `<span style="text-decoration: underline;">${text}</span>`
          }
          if (el.delline) {
            text = `<span style="text-decoration-line: line-through;">${text}</span>`
          }
          if (el.sup) {
            text = `<sup >${text}</sup>`
          }
          if (el.sub) {
            text = `<sub>${text}</sub>`
          }
          if (el.fontBackColor) {
            const fontBackColor: any = initColor(el.fontBackColor)
            text = `<span style="background-color: ${fontBackColor}">${text}</sub>`
          }

          if (el.fontColor && (runsleng > 1 || plength > 1)) {
            const fontColor: any = initColor(el.fontColor)
            text = `<span style="color: ${fontColor}">${text}</sub>`
          }

          if (el.code) {
            text = `<code >${text}</code>`
          }
          if (el.fontName) {
            text = `<span style="font-family: ${el.fontName}">${text}</span>`
          }
          if (el.fontSize) {
            text = `<span style="font-size: ${el.fontSize}px">${text}</span>`
          }
          if (el.bold) {
            text = `<strong>${text}</strong>`
          }
          if (el.italic) {
            text = `<em>${text}</em>`
          }

          str += text
        })
      }
      let style = ''
      if (element.align) {
        style = `text-align: ${element.align};`
      }

      if (element.lineHeight) {
        const lineHeight = element.lineHeight || 1
        style += `line-height: ${lineHeight};`
      }

      if (element.paragraphSpace) {
        const paragraphSpace = element.paragraphSpace
        style += `margin-top: ${paragraphSpace}px;`
      }

      if (element.paragraphSpaceAfter) {
        const paragraphSpaceAfter = element.paragraphSpaceAfter
        style += `margin-bottom: ${paragraphSpaceAfter}px;`
      }

      let row = `<p style="${style}">${str}</p>`
      if (item.text.bulletStyle) {
        row = `<li>${row}</li>`
      }
      p = p + row
    })

    if (item.text.bulletStyle) {
      p = `<ul style="list-style-type: ${item.text.bulletStyle}">${p}</ul>`
    }

    if (type === 'shape') {
      item.text.content = p
    } else {
      item.content = p
    }

    if (item?.text?.autoSize) {
      item.autoSize = item?.text?.autoSize
    }
    if (defaultColor) {
      if (type === 'shape') {
        item.text.defaultColor = defaultColor
      } else {
        item.defaultColor = defaultColor
      }
    }

    if (type === 'shape' && item.text.verticalAlign) {
      item.text.align = item.text.verticalAlign
    }

    if (defaultFontName) {
      if (type === 'shape') {
        item.text.defaultFontName = defaultFontName
      } else {
        item.defaultFontName = defaultFontName
      }
    }

    if (
      item.type === 'text' &&
      item.shadow &&
      item?.fill?.type === 'noFill' &&
      isFirst
    ) {
      delete item.shadow
    }
  }

  const setTableContent = (item: any) => {
    if (item.data) {
      item.data.forEach((element: any) => {
        if (element?.length) {
          element.forEach((el: any) => {
            setTextContent(el)
            if (el.content) {
              el.text = el.content
            }
          })
        }
      })
    }
  }

  const setChartContent = (item: any) => {
    if (!item.outline) {
      item.outline = {}
    }
    if (!item.outline?.color) {
      item.outline.color = {
        type: 'themeColor',
        value: 'accent1',
        transparent: 1,
      }

      if (item.outline?.gradient?.colors?.length === 0) {
        item.outline.style = 'none'
      } else {
        item.outline.color = item.outline?.gradient?.colors[0]
      }
    }
  }

  const setShapeContent = (item: any, isFirst?: boolean, style?: string) => {
    item.fixedRatio = false
    if (!item.fill) {
      item.fill = {
        type: 'noFill', // 类型：themeColor、rgb
      }
    }
    item.pathFormula = ''

    if (item.fillPicture) {
      if (
        item.fillPicture.src &&
        item.fillPicture.src.indexOf('http://file.static.yoojober.cn') > -1
      ) {
        item.fillPicture.src = item.fillPicture.src.replace(
          'http://file.static.yoojober.cn',
          'https://file.static.yoojober.cn'
        )
      }
    }

    if (item.fillPicture) {
      const clipRange = item.fillPicture.shapeClip?.range

      item.fillPicture.cropLeft = 0
      item.fillPicture.cropTop = 0

      if (clipRange?.length) {
        const x = clipRange[0][0]
        const y = clipRange[0][1]
        const imgW = clipRange[1][0]
        const imgH = clipRange[1][1]
        const imgCX = imgW / 2
        const imgCY = imgH / 2

        const offsetX: any = item.width / 2 + x - imgCX
        const offsetY: any = item.height / 2 + y - imgCY

        item.fillPicture.cropLeft = parseInt(offsetX) / ratio
        item.fillPicture.cropTop = parseInt(offsetY) / ratio
        item.fillPicture.imgW = Math.trunc(imgW / ratio)
        item.fillPicture.imgH = Math.trunc(imgH / ratio)
      } else {
        if (item.imgFillType === 'tile') {
          item.fillPicture.imgW = Math.trunc(item.fillPicture.widthPixel)
          item.fillPicture.imgH = Math.trunc(item.fillPicture.heightPixel)
        }

        item.fillPicture.cropLeft = 0
        item.fillPicture.cropTop = 0
      }
    }

    const h = item.height ? parseInt(item.height.toFixed(2)) : item.height
    const w = item.width ? parseInt(item.width.toFixed(2)) : item.width

    if ((!w || !h) && item.outline) {
      if (!w) {
        item.width = 1
      }
      if (!h) {
        item.height = 1
      }
    }
    const svgPath = item.svgPath
    const { dAttributes, attrArry } = returnSvgPath(svgPath)
    if (attrArry?.length > 0) {
      item.attrArry = attrArry
    }
    const leng = dAttributes.length
    if (leng === 1) {
      item.path = dAttributes[0]
    } else if (leng > 1) {
      item.path = dAttributes
    }
    //
    const specialType = ['Arc']
    if (
      specialType.includes(item.shapePresetType) &&
      typeof item.path === 'string'
    ) {
      item.fill = {
        type: 'noFill',
      }
      const temp = item.path.split('M')
      let str = ''
      temp.forEach((el: any) => {
        if (el && el.indexOf('L') === -1) {
          str += 'M' + el
        }
      })
      item.path = str
    }
    // 视口
    if (!item.viewBox) {
      const originWidth = item.width || 1
      const originHeight = item.height || 1
      const { maxX, maxY } = getSvgPathRange(dAttributes[0])
      item.viewBox = [maxX || originWidth, maxY || originHeight]
    }
    // 控制点设置
    if (item.pathFormula) {
      item.viewBox = [item.width, item.height]
      const pathFormula = SHAPE_PATH_FORMULAS[item.pathFormula]
      if ('editable' in pathFormula && pathFormula.editable) {
        item.path = pathFormula.formula(
          item.width,
          item.height,
          pathFormula.defaultValue
        )
        item.keypoints = pathFormula.defaultValue
      } else item.path = pathFormula.formula(item.width, item.height)
    }

    // 文本内容
    if (item.text?.text) {
      setTextContent(item, 'shape', isFirst, style)
    }
  }

  const setLine = (data: any) => {
    let start: [number, number] = [0, 0]
    let end: [number, number] = [0, 0]

    if (!data.isFlipV && !data.isFlipH) {
      // 右下
      start = [0, 0]
      end = [data.width, data.height]
    } else if (data.isFlipV && data.isFlipH) {
      // 左上
      start = [data.width, data.height]
      end = [0, 0]
    } else if (data.isFlipV && !data.isFlipH) {
      // 右上
      start = [0, data.height]
      end = [data.width, 0]
    } else {
      // 左下
      start = [data.width, 0]
      end = [0, data.height]
    }

    if (!data.start) {
      data.start = start
    }

    if (!data.end) {
      data.end = end
    }

    if (!data.style) {
      data.style = 'solid'
    }

    if (!data.color) {
      data.color = {
        type: 'themeColor', // 类型：themeColor、rgb
        value: 'accent1', // 颜色值，如果是themeColor，则为id；否则为十六进制色值
        transparent: 1, // 不透明度0~1
      }
    }

    if (!data.points) {
      data.points = ['', '']
    }
  }

  // 模版内容初始化结构的
  const initThemeModelSlids = (list: any, isFirst = false) => {
    isElementWidthReplace = true
    if (Array.isArray(list)) {
      list.forEach((item: any) => {
        const elements = item.elements
        if (elements?.length) {
          elements.forEach((el: any) => {
            handleInitElement(el, isFirst, item?.style)
          })
        }
        item.background = item.background || {
          type: 'solid',
          color: {
            type: 'themeColor', // 类型：themeColor、rgb
            value: 'bg1', // 颜色值，如果是themeColor，则为id；否则为十六进制色值
            transparent: 1, // 不透明度0~1
          },
        }
      })
    } else {
      const elements = list.elements
      if (elements?.length) {
        elements.forEach((el: any) => {
          handleInitElement(el, isFirst, list?.style)
        })
      }
      list.background = list.background || {
        type: 'solid',
        color: {
          type: 'themeColor', // 类型：themeColor、rgb
          value: 'bg1', // 颜色值，如果是themeColor，则为id；否则为十六进制色值
          transparent: 1, // 不透明度0~1
        },
      }
    }

    return list
  }

  return {
    oldDataJosn,
    initJsonData,
    slideDataInit,
    initSlids,
    getPPTImage,
    jsonDataInit,
    jsonDataInitFile,
    closeJsonLoading,
    initThemeModelSlids,
    setTextContent,
    setImgContent,
    setOnlyImgContent,
    setShapeContent,
    fontSizeResize,
    returnSvgPath,
    initOrgainData,
    privateInitSlide,
    initSingleElement,

    pptJsonList,
    pptJsonIndex,
    lineHeightNoReplace,
  }
}
