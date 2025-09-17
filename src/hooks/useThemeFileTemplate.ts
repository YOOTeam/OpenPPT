import tinycolor from 'tinycolor2'
import { nextTick, ref } from 'vue'
import useInitSlides from '@/hooks/useInitSlides'
import useExport from '@/hooks/useExport'
import { storeToRefs } from 'pinia'
import { fetchUrl, convertToNumber } from '@/utils/common'
import { useSlidesStore, useMainStore } from '@/store'
import { nanoid } from 'nanoid'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import message from '@/utils/message'
import useCommonApi from '@/hooks/useCommonApi'
import { onUploads } from '@/utils/upload'
import useSvgStyle from '@/hooks/useSvgStyle'
import {
  instructionToImage,
  imageToImage,
  translateText,
  getTextIcon,
  getOnePageTemplat,
  getOnePageDetail,
} from '@/api/careate'
import moment from 'moment'
import { getImageSize } from '@/utils/image'
import useColor from '@/hooks/useColor'
import { useI18n } from 'vue-i18n'
export default () => {
  const { t } = useI18n()
  const {
    initThemeModelSlids,
    setTextContent,
    setImgContent,
    setOnlyImgContent,
  } = useInitSlides()
  const { returnNewShape } = useSvgStyle()

  const lang = localStorage.getItem('lang') || '中文'
  const { slideTextContentReplace, slideTextContentToData, htmlToJsonData } =
    useExport()
  const { getTextKeyWord, getTextToImg } = useCommonApi()
  const { addHistorySnapshot } = useHistorySnapshot()
  const { initColor } = useColor()
  const slidesStore = useSlidesStore()
  const mainStore = useMainStore()
  const { useInfo, getPPTStyle, presentation, getPPTLanguage } =
    storeToRefs(mainStore)

  const openDrawing = ref(false) // 是否开启时时绘制
  const openResetColor = ref(false) // 是否开启文本颜色校正 用于AI配色 原本模版是浅色系 当前色系是深色系时要使用
  const { slides, themeColorList, resourcesData, title, slideIndex } =
    storeToRefs(slidesStore)

  const beatufiySlideList = ref([])

  let fontStyleData: any = null // 字体
  let otherDatas: any = null // 描述 翻译 等集合
  /**
   * 全文美化 应用模版
   * @param data json数据 包含 背景色 主题色 风格 色系 主题模版数组
   * @param allDeepTheme 视觉模型数据
   */
  const applyThemeFull = async (
    data: any,
    allDeepTheme?: any,
    openColorSingle?: boolean
  ) => {
    if (slides.value?.length === 0) {
      message.info(t('layoutPool.addSlide'))
      return
    }
    let content: any = ''
    try {
      content = await fetchUrl(data.json)
    } catch (error) {
      console.error('Error fetching data:', error)
    }
    if (!content) return ''

    const jsonData = JSON.parse(content)

    mainStore.setPresentationItem({
      width: jsonData.presentation.width,
      height: jsonData.presentation.height,
      name: title.value,
      docTheme: jsonData.presentation.docTheme,
    })
    slidesStore.setThemeColorList(data.themeColorData)
    const w = presentation.value.width
    const h = presentation.value.height

    slidesStore.setViewportSize(w)
    slidesStore.setViewportRatio(h / w)
    fontStyleData = data.fontStyleData
    if (!openColorSingle) {
      slidesStore.updateResourcesData({ main_color: data.page_color })
    }

    // 模版数据
    const slidesList = initThemeModelSlids(jsonData.slides)
    if (allDeepTheme) {
      // 视觉替换
      handleFullThemeView(slidesList, jsonData, allDeepTheme)
    } else {
      // 默认tag替换
      handleFullThemeReplace(slidesList, jsonData)
    }
  }
  const delay = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
  /**
   * 全文美化 tag替换
   * @param slidesList 模版数据数组
   * @param jsonData 模版数据
   */
  const handleFullThemeReplace = async (newSildesList: any, themeData: any) => {
    const oldSlides = JSON.parse(JSON.stringify(slides.value))
    const newSlides = await Promise.all(
      oldSlides.map(async (item: any) => {
        describeList.value = []
        translateList.value = []
        const flage = item?.tags?.custom?.page_type
        switch (flage) {
          case 'cover':
          case 'catalog':
          case 'catlog':
          case 'chatper':
          case 'chapter':
          case 'end':
            item = await handleRichPages(
              item,
              newSildesList,
              themeData.fontStyleData,
              null
            )
            break
          case 'multcontent':
          case 'content':
            MultcontentPage(item, newSildesList)
            break
          default:
            break
        }

        return item
      })
    )
    slidesStore.setSlides(newSlides)
    message.success(t('layoutPool.applaySuccess'))
    addHistorySnapshot()
    mainStore.updateViewTemplate({ show: false, data: null })
    mainStore.setIsViewHoverBg('')
    for (let index = 0; index < newSlides.length; index++) {
      slidesStore.updateSlideIndex(index)
      if (index > 0) {
        await delay(50) // 100秒
      }
    }
    slidesStore.updateSlideIndex(0)
  }

  const MultcontentPage = (data: any, newSlide: any) => {
    // 将模版数据里面的对应模版类型过滤 封面页 章节页 内容 目录 结束
    const fileterTagSlide = newSlide.find(
      (item: any) =>
        item.tags.custom.page_type === 'multcontent' ||
        item.tags.custom.page_type === 'background' ||
        item.tags.custom.page_type === 'content'
    )
    data.elements = data.elements.filter((item: any) => {
      return item?.tags?.custom?.shape_type !== 'bg'
    })

    data.elements.forEach((item: any) => {
      if (item?.text?.text) {
        setTextContent(item, item.type)
      }
    })

    data.elements.forEach((item: any) => {
      if (fontStyleData && item?.text?.text) {
        slideTextContentToData(item, item.type)
        item.text.paragraphs.forEach((p: any) => {
          p.runs.forEach((r: any) => {
            if (item?.tags?.custom?.shape_type === 'title') {
              r.fontName = fontStyleData.titleFontStyle
            } else {
              r.fontName = fontStyleData.subTitleFontStyle
            }

            r.fontName = fontStyleData.titleFontStyle
            if (isBoldFont.includes(fontStyleData.titleFontStyle)) {
              r.bold = false
            }
          })
        })
        setTextContent(item, item.type)
      }
    })

    if (!fileterTagSlide) return
    // 新的模版元素list
    const elementList = JSON.parse(JSON.stringify(fileterTagSlide.elements))
    // 旧的模版元素list
    const oldElement = data.elements
    const bgElement = elementList.filter((item: any) => {
      return item.tags.custom.shape_type === 'bg'
    })

    bgElement.forEach((item: any) => {
      item.id = nanoid(10)
    })

    data.background = fileterTagSlide.background
    data.elements = [...bgElement, ...oldElement]
  }

  /**
   * 全文美化 视觉替换
   * @param slidesList 模版数据数组
   * @param jsonData 模版数据
   * @param allDeepTheme 是否全部替换
   */
  const handleFullThemeView = async (
    slidesList: any,
    jsonData: any,
    allDeepTheme: any
  ) => {}
  // 视觉模型 内容模版对象 缓存
  const allContentThemeList: any = ref({})
  /**
   * 美化 上传美化  全局 视觉美化
   * @param oldSlide 旧的章节 对象
   * @param newSlides 数组
   * @param viewData 每张章节的 视觉对象
   * @param sytleData  风格数据 宽度 高度 字体 颜色
   */
  const beautifyStyle = ref('')
  const beautifyThemeApply = async (
    oldSlide: any,
    newSlides: any,
    viewData: any,
    sytleData?: any
  ) => {
    isBeautifyOneType.value = false
    fontStyleData = sytleData.font
    beautifyStyle.value = sytleData.style
    otherDatas = returnOhterData('', oldSlide?.elements, viewData)
    // 需要判断一下是否有视觉模型 数据 没有 的并且判断 是否有没有tags 的数据 如果都没有 就返回旧的数据
    if (!oldSlide || (!viewData && hasNoTagsElement(oldSlide))) {
      return (oldSlide.isShow = true)
    }
    let flage = ''
    let slideData: any = JSON.parse(JSON.stringify(oldSlide))
    const odlData: any = JSON.parse(JSON.stringify(oldSlide))
    imageLinkList.value = []
    if (viewData) {
      // 视觉模型
      switch (viewData?.pageType) {
        case '封面页':
          flage = 'cover'
          break
        case '目录页':
          flage = 'catalog'
          break
        case '章节页':
          flage = 'chapter'
          break
        case '内容页':
          if (viewData?.groupContent) {
            flage = 'multcontent'
          } else {
            flage = 'content'
          }
          break
        case '结束页':
          flage = 'end'
          break
        default:
          break
      }
      viewData.slideW = sytleData.width
      viewData.slideH = sytleData.height
      handleViewImgData(odlData, viewData)
    } else {
      flage = slideData?.tags?.custom?.page_type
    }
    switch (flage) {
      case 'cover':
      case 'catalog':
      case 'catlog':
      case 'chatper':
      case 'chapter':
      case 'end':
        if (viewData) {
          slideData = await handleViewSpecialPage(
            slideData,
            newSlides,
            flage,
            viewData
          )
        } else {
          slideData = await updataSpecialPage(slideData, newSlides, flage)
        }

        break
      case 'multcontent':
      case 'content':
        //  这返回的是新的模版数据
        slideData = await AllMultcontentPage(slideData, viewData, sytleData)
        break
      default:
        break
    }

    if (slideData) {
      oldSlide.background = slideData.background
      oldSlide.elements = slideData.elements
      oldSlide.tags = slideData.tags
      if (slideData?.chapterNum) {
        oldSlide.chapterNum = slideData.chapterNum
      }
    }

    // 内容页二次填充
    if (flage === 'multcontent' || flage === 'content') {
      imageLinkList.value = []
      iconLinkList.value = []
      // 根据视觉模型的 位置信息找到原章节匹配的图片 表格 图标等数据

      if (viewData) {
        // 走视觉模型
        slideData = await handleContentPageView(
          odlData,
          slideData,
          flage,
          viewData
        )
      } else {
        // tag 匹配
        slideData = await updataContentPage(odlData, slideData, flage)
      }
      if (slideData) {
        oldSlide.background = slideData.background
        oldSlide.elements = slideData.elements
        oldSlide.tags = slideData.tags
      }
    }
    oldSlide.isShow = true
  }

  // 美化视觉 时 内容页面 需要二次创作
  const AllMultcontentPage = async (
    oldSlide: any,
    viewData?: any,
    sytleData?: any,
    apiListNum?: any
  ) => {
    // 过滤掉原章节数据的bg元素/装饰元素
    oldSlide.elements = oldSlide.elements.filter((item: any) => {
      return item?.tags?.custom?.shape_type !== 'bg'
    })

    let groupList = []
    let contentList = []
    let imgList: any = []
    let specialList = []
    let params: any = null
    if (viewData) {
      if (!viewData?.contentTexts && viewData?.groupContent) {
        if (viewData?.otherTexts) {
          viewData.contentTexts = viewData?.otherTexts
        }
      }

      if (viewData?.groupContent) {
        groupList = viewData.groupContent[0]?.items
      }

      if (viewData?.contentTexts) {
        contentList = viewData.contentTexts
      }

      if (viewData?.images) {
        imgList = viewData?.images.filter(
          (item: any) => item.type === 'YOO_CHATSHAPE_IMAGE'
        )
        specialList = viewData?.images.filter(
          (item: any) =>
            item.type === 'YOO_CHATSHAPE_CHART' ||
            item.type === 'YOO_CHATSHAPE_TABLE'
        )
      }
      // 根据新的解析内容 调取新的内容模版
      params = {
        type: '图文型',
        textNum: contentList?.length,
        imgNum: imgList?.length || 0,
        itemNum: 0,
        speitalElement: specialList?.length || 0,
      }
      params.keyword = viewData?.title ? '有标题' : '无标题'
      if (groupList?.length) {
        const hasTitleLeng = groupList.some(
          (item: any) => item?.title?.length > 30
        )
        if (hasTitleLeng) {
          params = {
            type: '图文型',
            textNum: 1,
            imgNum: imgList?.length || 0,
            itemNum: 0,
            speitalElement: specialList?.length || 0,
          }
        } else {
          params = {
            type: '图示型',
            textNum: contentList?.length > 1 ? 1 : contentList?.length,
            imgNum: 0,
            itemNum: groupList?.length || 0,
            speitalElement: specialList?.length || 0,
          }
        }
      }

      if (params.speitalElement) {
        params.textNum = contentList?.length > 1 ? 1 : contentList?.length
      }
    } else {
      const keyData: any = handleReturnSlideInfo(oldSlide)
      params = {
        type: keyData.slideType,
        style: keyData.pptStyle,
        textNum: keyData.pageKey.textNum,
        imgNum: keyData.pageKey.imgNum,
        itemNum: keyData.pageKey.itemNum,
        speitalElement: keyData.pageKey.speitalElement,
        keyword: keyData?.slideTitle ? '有标题' : '无标题',
      }
    }

    // 获取模版
    let resultList = []
    // 全局里去存储这种类型的模版 后面不用多次请求接口获取模版
    if (
      !allContentThemeList.value[
        `text${params?.textNum}img${params?.imgNum}item${params?.itemNum}other${params?.speitalElement}`
      ]
    ) {
      // 全局没有这个类型的模版
      resultList = await siglePageModle(params, apiListNum)
      allContentThemeList.value[
        `text${params?.textNum}img${params?.imgNum}item${params?.itemNum}other${params?.speitalElement}`
      ] = resultList
    } else {
      // 全局有这个类型的模版
      resultList =
        allContentThemeList.value[
          `text${params?.textNum}img${params?.imgNum}item${params?.itemNum}other${params?.speitalElement}`
        ]
    }

    if (resultList?.length === 0) {
      delete allContentThemeList.value[
        `text${params?.textNum}img${params?.imgNum}item${params?.itemNum}other${params?.speitalElement}`
      ]

      resultList = await siglePageModle(params)
      allContentThemeList.value[
        `text${params?.textNum}img${params?.imgNum}item${params?.itemNum}other${params?.speitalElement}`
      ] = resultList
    }
    // resultList 在模版了面随机去一个模版数据
    const randomIndex = Math.floor(Math.random() * resultList.length) // 获取随机索引
    const data = resultList[randomIndex]
      ? JSON.parse(JSON.stringify(resultList[randomIndex]))
      : null
    if (resultList[randomIndex]) {
      resultList.splice(randomIndex, 1)
    }

    if (!data) {
      return elementAddThemeColor(oldSlide, sytleData.color)
    }
    // 这是获取的新的模版数据

    return elementAddThemeColor(data, sytleData.color)
  }
  const getOnePageDetails = async (id: any, apiListNum?: any) => {
    const params: any = {
      limit: apiListNum ? apiListNum : 10,
      id: id,
    }
    params.language = '中文'
    if (isEnglishValue()) {
      params.language = '英文'
    }
    const res: any = await getOnePageDetail(params)
    if (res.code !== 200) return null
    return res.data
  }
  // 全文美化 时 内容页需要请求模版接口
  const siglePageModle = async (data: any, apiListNum?: any) => {
    let pageList: any = []
    const params: any = {
      type: data.type,
      page_count: data.pageNum,
      limit: 1,
      style: getPPTStyle.value,
      type_count: data.itemNum || 0,
      picture_count: data.itemNum > 0 ? 0 : data.imgNum || 0,
      content_count: data.textNum || 0,
      chart_count: data.speitalElement || 0,
      keyword: data.keyword || '有标题',
    }

    if (params.type === '图文型' && params.chart_count === 0) {
      params.content_count = 1
    }

    params.language = '中文'

    const res: any = await getOnePageTemplat(params)
    if (res.code === 200 && res.data?.length) {
      const themeModleId = res.data.map((item: any) => {
        return item.id
      })

      const themDataInfo: any = await getOnePageDetails(
        themeModleId.join(','),
        apiListNum
      )
      if (themDataInfo.list) {
        let data = await Promise.all(
          themDataInfo.list.map(async (item: any) => {
            let content: any = await fetchUrl(item.url)
            if (!content) return ''

            const jsonData = JSON.parse(content)
            return {
              ...jsonData,
              jsonDataId: item.mId,
              style: item.style,
              oldId: jsonData.id,
            }
          })
        )
        data = data?.length ? initThemeModelSlids(data) : []
        pageList = [...[], ...data]
      }
    }

    return pageList
  }
  /**
   * 美化 上传美化  单页二次美化 视觉美化
   * @param oldSlide
   * @param newSlide
   * @param viewData
   * @param sytleData  风格数据 宽度 高度 字体 颜色
   */
  const beautifySingTheme = async (
    oldSlide: any,
    newSlide: any,
    viewData: any,
    sytleData?: any
  ) => {
    //  这返回的是新的模版数据
    let slideData: any = await AllMultcontentPage(oldSlide, viewData, sytleData)
    const odlData: any = JSON.parse(JSON.stringify(oldSlide))
    let flage = ''
    if (viewData) {
      // 视觉模型
      switch (viewData?.pageType) {
        case '内容页':
          if (viewData?.groupContent) {
            flage = 'multcontent'
          } else {
            flage = 'content'
          }
          break
        default:
          break
      }
    } else {
      flage = slideData?.tags?.custom?.page_type
    }
    if (slideData) {
      oldSlide.background = slideData.background
      oldSlide.elements = slideData.elements
      oldSlide.tags = slideData.tags
    }

    // 内容页二次填充
    imageLinkList.value = []
    iconLinkList.value = []
    // 根据视觉模型的 位置信息找到原章节匹配的图片 表格 图标等数据
    if (viewData) {
      viewData.slideW = sytleData.width
      viewData.slideH = sytleData.height
      handleViewImgData(odlData, viewData)
    }

    if (viewData) {
      // 走视觉模型
      slideData = await handleContentPageView(
        odlData,
        slideData,
        flage,
        viewData
      )
    } else {
      // tag 匹配
      slideData = await updataContentPage(odlData, slideData, flage)
    }
    if (slideData) {
      oldSlide.background = slideData.background
      oldSlide.elements = slideData.elements
      oldSlide.tags = slideData.tags
      if (slideData?.chapterNum) {
        oldSlide.chapterNum = slideData.chapterNum
      }
    }
    await delay(100)
    oldSlide.isShow = true
  }

  const isBeautifyOneType = ref(false)
  /**
   * 美化数据填充
   * @param oldSlide 原章节数据
   * @param newSlide 新的模版数据
   * @param fontStyle 风格字体效果
   * @param viewApiData 视觉模型数据
   * @param otherData 其他数据 描述 翻译
   */
  const handleRichPages = async (
    oldSlide: any,
    newSlide: any,
    fontStyle?: any,
    viewApiDatas?: any,
    otherData?: any
  ) => {
    isBeautifyOneType.value = true
    fontStyleData = fontStyle
    otherDatas = otherData
    if (!oldSlide && !viewApiDatas) return
    const oldSildeId = oldSlide?.id
    let slideData: any = oldSlide ? JSON.parse(JSON.stringify(oldSlide)) : null
    const newSlides: any = JSON.parse(JSON.stringify(newSlide))
    let flage = slideData?.tags?.custom?.page_type

    const viewApiData = viewApiDatas
      ? JSON.parse(JSON.stringify(viewApiDatas))
      : null
    if (viewApiData) {
      switch (viewApiData?.pageType) {
        case '封面页':
          flage = 'cover'
          break
        case '目录页':
          flage = 'catalog'
          break
        case '章节页':
          flage = 'chapter'
          break
        case '内容页':
          if (viewApiData?.groupContent) {
            flage = 'multcontent'
          } else {
            flage = 'content'
          }
          break
        case '结束页':
          flage = 'end'
          break
        default:
          break
      }
    }

    switch (flage) {
      case 'cover':
      case 'catalog':
      case 'catlog':
      case 'chatper':
      case 'chapter':
      case 'end':
        if (viewApiData) {
          slideData = await handleViewSpecialPage(
            slideData,
            newSlides,
            flage,
            viewApiData
          )
        } else {
          slideData = updataSpecialPage(slideData, newSlides, flage)
        }
        break
      case 'multcontent':
      case 'content':
        if (viewApiData) {
          slideData = await handleContentPageView(
            slideData,
            newSlides,
            flage,
            viewApiData
          )
        } else {
          slideData = await updataContentPage(slideData, newSlides, flage)
        }
        break
      default:
        break
    }
    if (slideData && oldSildeId) {
      slideData.id = oldSildeId
    }

    return slideData
  }

  const imageLinkList = ref<any>([]) // 全局的图片
  const iconLinkList = ref<any>([]) // 全局的icon
  /**
   * 单页模版数据填充 内容美化
   * @param oldSlide 原章节数据
   * @param newSlide 模版数据
   * @param flage 原模型页面类型
   * @returns
   */

  const updataContentPage = async (
    oldSlide: any,
    newSlide: any,
    flage: string
  ) => {
    const contentType = ['multcontent', 'background', 'content']
    const fileterTagSlide = Array.isArray(newSlide)
      ? newSlide.find((item: any) =>
          contentType.includes(item.tags.custom.page_type)
        )
      : newSlide
    oldSlide.elements = oldSlide.elements.filter((item: any) => {
      return item?.tags?.custom?.shape_type !== 'bg'
    })
    if (!fileterTagSlide) return

    // 新的模版元素list
    let elementList = JSON.parse(JSON.stringify(fileterTagSlide.elements))
    // 旧的模版元素list
    let oldElement = oldSlide.elements.filter((item: any) => {
      return item.tags
    })

    // 用户在自己在旧的数据里添加的新元素
    const newAddElement = oldSlide.elements.filter((item: any) => {
      return !item.tags
    })

    // 原数据的内容 图文 图示转化
    oldElement = handleresetElement(fileterTagSlide, oldElement, flage)
    const chartKey = ['chart', 'table']
    // 图表 或者 表格
    const hansSpeialElement = oldElement.filter((el: any) => {
      return chartKey.includes(el.type)
    })
    // 图片
    let imgElement = oldElement.filter((item: any) => {
      return (
        (item.tags.custom.shape_type === 'image' ||
          item.tags.custom.shape_type === 'childimage' ||
          item.tags.custom.shape_type === 'wordcloud') &&
        (item.fillPicture || item.src)
      )
    })
    if (imgElement?.length) {
      imgElement = imgElement.sort(
        (a: any, b: any) =>
          a.tags?.custom?.content_index - b.tags?.custom?.content_index
      )
    }

    // icon
    let iconElement = oldElement.filter((item: any) => {
      return item.tags.custom.shape_type === 'icon'
    })
    if (iconElement?.length) {
      iconElement = iconElement.sort(
        (a: any, b: any) =>
          a.tags?.custom?.content_index - b.tags?.custom?.content_index
      )
    }

    // 关键词
    const keywordElemet = keyWordList(oldElement)
    // 处理模版组索引错误问题
    elementList.forEach((item: any) => {
      if (item.tags.custom.shape_type === 'childtitle') {
        const temp = item.name.split('-')
        const num = temp[0].slice(3, temp[0].length)
        if (num) {
          item.tags.custom.group_index = num
        }
      }
    })

    elementList.forEach((item: any, index: number) => {
      // 这里重制一下元素的id 不然会导致后置美化查询元素的时候 查到相同元素
      item.id = nanoid(10)
      const sameTextTag = oldElement.filter((el: any) => {
        return (
          el.tags.custom.shape_type === item.tags.custom.shape_type &&
          el?.text?.text
        )
      })

      // 图片替换
      if (
        item.tags.custom.shape_type === 'wordcloud' ||
        item.tags.custom.shape_type === 'image' ||
        item.tags.custom.shape_type === 'childimage'
      ) {
        if (imgElement?.length) {
          const sameImg = imgElement.shift()

          // 将图形类图片 都转化成image类型
          if (sameImg.type === 'shape') {
            item.src = sameImg.fillPicture.src
          } else {
            item.src = sameImg.src
          }
        }
        item.imgResect = true
      }

      // 图表表格
      if (
        item.tags.custom.shape_type === 'table' ||
        item.tags.custom.shape_type === 'chart'
      ) {
        if (hansSpeialElement?.length) {
          // 有图表/表格
          const datas = hansSpeialElement.shift()
          datas.top = item.top
          datas.left = item.left
          datas.width = item.width
          datas.height = item.height
          datas.rotate = 0
          datas.tags = item.tags
          const themeColor = item.templateThemeColors
          if (datas.type === 'table') {
            if (datas.data?.length) {
              datas.data.forEach((el: any, index: number) => {
                if (el?.length) {
                  el.forEach((eles: any) => {
                    if (themeColor && eles.style.color) {
                      eles.style.color.templateThemeColors = JSON.parse(
                        JSON.stringify(themeColor)
                      )
                    }
                    eles.style.fontsize = index > 0 ? '14px' : '16px'
                    eles.style.bold = index > 0 ? false : true
                    delete eles.style.backcolor
                  })
                }
              })
              const oneHeight: any = item.height / datas.data.length
              datas.cellMinHeight = parseInt(oneHeight)
            }
            datas.theme = {
              color: {
                type: 'themeColor', // 类型：themeColor、rgb
                value: 'accent1', // 颜色值，如果是themeColor，则为id；否则为十六进制色值
                transparent: 1,
              },
              rowHeader: false,
              rowFooter: false,
              colHeader: false,
              colFooter: false,
            }
            if (themeColor) {
              datas.theme.color.templateThemeColors = JSON.parse(
                JSON.stringify(themeColor)
              )
              datas.outline.color.templateThemeColors = JSON.parse(
                JSON.stringify(themeColor)
              )
            }
            datas.tableStyle = 'threeTable'
            datas.tags.custom.shape_type = 'table'
          } else if (datas.type === 'chart') {
            if (datas.themeColors?.length) {
              datas.themeColors.forEach((color: any) => {
                color.templateThemeColors = themeColor
              })
            }

            if (datas.textColor) {
              datas.textColor.templateThemeColors = themeColor
            }
          }
          elementList[index] = JSON.parse(JSON.stringify(datas))
        } else {
          // 没有 转换成图片
          item.imgResect = true
          item.name = '图片'
          item.tags = {
            custom: {
              shape_type: 'image',
            },
            normal: [
              {
                key: 'YOO_CHATSHAPE_TYPE',
                value: 'YOO_CHATSHAPE_IMAGE',
              },
            ],
          }
          item.src = ''
        }
      }

      // 原章节文本内容做替换
      let oldDatas = null
      let isDelete = false
      if (sameTextTag?.length) {
        oldDatas = sameTextTag.find(
          (e: any) =>
            item.tags.custom.group_index === e.tags.custom.group_index &&
            item.tags.custom.shape_type === e.tags.custom.shape_type
        )
        if (!oldDatas) {
          isDelete = true
        }
      }
      // 关键词
      if (
        keywordElemet?.length &&
        item.tags.custom.shape_type === 'keyword' &&
        item?.text
      ) {
        oldDatas = keywordElemet.find((el: any) => {
          return (
            el.tags.custom.content_index === item.tags.custom.content_index &&
            el.tags.custom.group_index === item.tags.custom.group_index
          )
        })
        if (!oldDatas) {
          if (item.name.indexOf('翻译') > -1) {
            item.iskeyword = 'translate'
          }

          if (item.name.indexOf('简述') > -1) {
            item.iskeyword = `describe`
          }

          if (item.name.indexOf('子标题') > -1) {
            item.iskeyword = 'childtitle'
          }
        }
      }

      if ((item.text?.text && !sameTextTag?.length) || isDelete) {
        const deletType = [
          'title',
          'subtitle',
          'content',
          'childtitle',
          'childsubtitle',
          'childcontent',
          'detial',
        ]
        if (deletType.includes(item.tags.custom.shape_type)) {
          item.isDelete = true
        }
      }
      if (oldDatas?.text && item?.text) {
        const sourceTags = oldDatas?.tags?.normal?.find(
          (ele: any) => ele.key === 'TAG_CITE_ID'
        )
        if (sourceTags) {
          item.tags.normal.push(sourceTags)
        }
        const pageType = oldDatas.isNewSetType ? oldDatas.isNewSetType : flage
        slideTextContentReplace(oldDatas, item, pageType)
      }

      if (item?.text?.text) {
        setTextContent(item, item.type)
      }
    })
    elementList = elementList.filter((item: any) => !item.isDelete)

    // 全文美化才走这个 单页美化 不走 防止 多用多次问题
    if (!isBeautifyOneType.value) {
      await handleSetElementImg(elementList)
    }

    oldSlide.background = fileterTagSlide.background
    oldSlide.elements = [...elementList, ...newAddElement]
    oldSlide.tags = fileterTagSlide.tags

    return oldSlide
  }

  const handleSameTags = (list: any, item: any, itemGroup?: any) => {
    let oldDatas: any = null
    for (let index = 0; index < list.length; index++) {
      const el = list[index]
      if (el.groupId) {
        // 如果有组 是否等于当前顺序
        if (el.tags.custom.group_index === item.tags.custom.group_index) {
          oldDatas = el
          break
        }
        // 旧的资源没有 group_index 新的资源有 group_index 判断group_index = 索引
        else if (
          !el.tags.custom.group_index &&
          item.tags.custom.group_index &&
          parseInt(item.tags.custom.group_index) === index + 1
        ) {
          oldDatas = el
          break
        }
        // 旧资源 group_index 新资源没有group_index 有 groupId
        else if (
          el.tags.custom.group_index &&
          !item.tags.custom.group_index &&
          parseInt(el.tags.custom.group_index) === index + 1
        ) {
          oldDatas = el
        }
      } else {
        if (el.tags.custom.group_index === item.tags.custom.group_index) {
          oldDatas = el
          break
        } // 第一种情况 旧的数据 没有group_index  比较旧的资源 content_index 新的 group_index 是否相等
        else if (
          el?.tags?.custom?.content_index === item?.tags?.custom?.group_index
        ) {
          oldDatas = el
          break
        }
        // 第二种情况 资源数据 没有group_index 比较旧的资源 group_index 新的 content_index 是否相等
        else if (
          el?.tags?.custom?.group_index === item?.tags?.custom?.content_index
        ) {
          oldDatas = el
          break
        }
        // 第三种情况 两个都没有group_index 比较旧的资源 content_index 新的content_index 是否相等
        else if (
          el?.tags?.custom?.content_index ===
            item?.tags?.custom?.content_index &&
          !el?.tags?.custom?.group_index &&
          !item?.tags?.custom?.group_index
        ) {
          oldDatas = el
          break
        }
      }
    }

    return oldDatas
  }

  const setElementGroup = (arr: any) => {
    arr.forEach((el: any) => {
      if (
        el.tags.custom.shape_type === 'catalog' &&
        !el.tags.custom.group_index &&
        el.tags.custom.content_index
      ) {
        el.groupId = nanoid(5)
        el.tags.custom.group_index = el.tags.custom.content_index + ''
      }
    })
  }

  const setSpecialChapterStyle = (arr: any) => {
    arr.forEach((el: any) => {
      if (
        el?.tags?.custom?.shape_type === 'item' ||
        el?.tags?.custom?.shape_type === 'catalog' ||
        el?.tags?.custom?.diagram_shape_type === 'title'
      ) {
        if (el.fill) {
          el.fill.value = 'accent1'
        }
        if (el?.text?.paragraphs) {
          if (el?.text?.paragraphs[0].runs?.length) {
            el.text.paragraphs[0].runs.forEach((element: any) => {
              element.fontColor.value = 'text2'
              if (el?.fill?.type === 'noFill') {
                element.fontColor.value = 'accent1'
              }
              element.fontColor.type = 'themeColor'
            })
          }
        }
      } else if (el?.tags?.custom?.shape_type === 'num') {
        if (el?.text?.paragraphs) {
          el.text.paragraphs[0].runs.forEach((element: any) => {
            element.fontColor.type = 'themeColor'
            element.fontColor.value =
              el?.fill?.value !== 'accent1' || el?.fill?.type === 'noFill'
                ? 'accent1'
                : 'text2'
          })
        }
      } else {
        if (el.fill) {
          el.fill.type = 'themeColor'
          el.fill.value = 'accent1'
        }

        if (el.color) {
          el.color.type = 'themeColor'
          el.color.value = 'accent1'
        }
      }

      if (el.text?.text) {
        setTextContent(el, el.type)
      }
    })
  }

  /**
   * 单页美化 特殊页面 封面 目录 章节 封底
   * @param oldSlide 原页面数据(拷贝的新的数据)
   * @param newSlide 新的模版数据 这个需要判断一下 全文替换时是多个模版 需要过滤对应模版 单页时传入单页对应模版
   * @param flage 页面类型
   */
  const describeList: any = ref([]) // 描述列表
  const translateList: any = ref([]) // 翻译列表
  const updataSpecialPage = async (
    oldSlide: any,
    newSlide: any,
    flage: string
  ) => {
    if (flage === 'chatper') {
      flage = 'chapter'
    }

    const oldSlideList = beatufiySlideList.value?.length
      ? beatufiySlideList.value
      : slides.value

    try {
      const fileterTagSlide = Array.isArray(newSlide)
        ? filterArr(newSlide, flage)
        : newSlide

      if (!fileterTagSlide) return

      // 用于章节的标题判断
      const hasCatalog = oldSlide?.elements?.find((el: any) => {
        return el?.tags?.custom?.shape_type === 'catalog'
      })

      // 这个是处理 目录类型的数据没有 group_index groupId 的匹配错误问题
      if (fileterTagSlide?.tags?.custom?.page_type === 'catalog') {
        setElementGroup(fileterTagSlide.elements)
      }
      if (hasCatalog && oldSlide?.elements?.length) {
        setElementGroup(oldSlide.elements)
      }
      // 新的模版元素list
      let newElementList = JSON.parse(JSON.stringify(fileterTagSlide.elements))
      // 旧的模版元素list
      const oldElement = oldSlide.elements
      // 用户在自己在旧的数据里添加的新元素
      const userAddElement = oldElement.filter((item: any) => {
        return !item?.tags
      })
      // 旧的数据
      const oldElementTag = oldElement.filter((item: any) => {
        return item.tags
      })

      // 公司
      const logoTag = ['logo', 'company']
      const logoList = oldElementTag.filter((el: any) => {
        return logoTag.includes(el.tags.custom.shape_type)
      })
      // 没有公司名称时删除模版数据的公司内容
      if (logoList?.length === 0) {
        newElementList = newElementList.filter((item: any) => {
          return !logoTag.includes(item.tags.custom.shape_type)
        })
      }

      // 内容字体跟随 随机字体
      setDataFontName(userAddElement, newElementList)

      // 目录要去除比原本数据多的目录组
      if (
        flage === 'catalog' ||
        (flage === 'chapter' &&
          fileterTagSlide?.tags?.custom?.page_type === 'catalog')
      ) {
        const olgCatalogLeng = oldElementTag.filter((el: any) => {
          return (
            el.tags.custom.shape_type === 'catalog' ||
            el.tags.custom.shape_type === 'item'
          )
        }).length

        const groupIdList: any = []
        if (olgCatalogLeng > 0) {
          newElementList.forEach((item: any) => {
            if (item.tags.custom.group_index > olgCatalogLeng) {
              if (!groupIdList.includes(item.groupId)) {
                groupIdList.push(item.groupId)
              }
            }
          })
        }

        newElementList = newElementList.filter((item: any) => {
          return !groupIdList.includes(item.groupId)
        })
      }

      // 查找相同数据 填充内容
      newElementList.forEach((item: any) => {
        // 这里重制一下元素的id 不然会导致后置美化查询元素的时候 查到相同元素
        item.id = nanoid(10)
        const colorList = item?.defaultColor?.templateThemeColors
        let sameTag = oldElementTag.filter((el: any) => {
          return (
            el.tags.custom.shape_type === item.tags.custom.shape_type &&
            el?.text?.text
          )
        })
        let oldDatas: any = null
        if (
          fileterTagSlide?.tags?.custom?.page_type === 'catalog' &&
          flage === 'chapter'
        ) {
          sameTag = []
        }

        // 过滤出来旧的数据 与 模版数据中tags 一样的数据
        if (sameTag?.length) {
          // 如果 相同数据大于1时要比较一下元素的所以 确保找出来一个
          if (sameTag.length === 1) {
            oldDatas = sameTag[0]
          } else {
            // 多个相同的元素
            // 另外一个 实现的方法 旧数据是目录格式 匹配的也是目录格式数据 有多个相同数据
            oldDatas = handleSameTags(sameTag, item)
          }
        } else if (item?.text?.text) {
          // 这里面都是新数据 和旧数据不相同的 元素 个别需要 单已处理
          // 如果没有相同的数据判断一下数据是否时含有文本类型 将其删除掉
          if (logoList?.length) {
            if (
              logoList?.length === 1 &&
              logoTag.includes(item.tags.custom.shape_type)
            ) {
              const logoItem = logoList[0]
              if (logoItem.type === 'image') {
                item.src = logoItem.src
                item.isImage = true
              } else {
                oldDatas = logoItem
              }
            }
          }
          // 排查不相同的tag 异常tag 兼容
          if (item.tags.custom.shape_type === 'num') {
            sameTag.forEach((el: any, index: number) => {
              if (el.tags.custom.group_index === item.tags.custom.group_index) {
                oldDatas = el
                sameTag.splice(index, 1)
              }
            })
          }
          // 处理 除了目录页面的标题
          else if (
            item.tags.custom.shape_type === 'title' &&
            item.text &&
            flage !== 'catalog' &&
            flage !== 'chapter'
          ) {
            replaceOneLineText('', item)
          }
          // 没有副标题时
          else if (
            item.tags.custom.shape_type === 'subtitle' &&
            flage !== 'catalog'
          ) {
            const text = otherDatas?.translatelist?.length
              ? otherDatas?.translatelist[0]?.text
              : ''
            if (text && item?.text) {
              viewMoldeTextReplace(item, text, colorList)
              setTextContent(item, item.type)
            } else {
              if (window._PROCESS_TRANSLATE) {
                item.isTranslate = true
              } else {
                item.isDelete = true
              }
            }
          }
          // 特殊处理 封面 封底没有作者名称 没有时间时 特别注意一下 封面有用户名称 封底没有用户名称时用封面的 用户名称 时间相同处理
          else if (
            item.tags.custom.shape_type === 'author' ||
            item.tags.custom.shape_type === 'date'
          ) {
            let text = ''

            // 封面没有作者 和 时间
            if (item.tags.custom.shape_type === 'author') {
              text = useInfo?.value?.nickname
            } else {
              text = moment(Date.now()).format('YYYY.MM.DD')
            }
            if (flage === 'end') {
              const cover: any = oldSlideList.find((el: any) => {
                return el?.tags?.custom?.page_type === 'cover'
              })

              if (cover) {
                const currentData = cover.elements.find((el: any) => {
                  return (
                    el.tags.custom.shape_type === item.tags.custom.shape_type
                  )
                })
                if (currentData?.text?.text) {
                  text =
                    currentData.type === 'shape'
                      ? retunHtmlText(currentData.text?.content)
                      : retunHtmlText(currentData?.content)
                }
              }
            }

            if (text && item?.text) {
              viewMoldeTextReplace(item, text, colorList)
              setTextContent(item, item.type)
            }
          } else if (
            (item.tags.custom.shape_type === 'catalog' ||
              item.tags.custom.shape_type === 'item') &&
            flage === 'catalog'
          ) {
            const sameTitle = oldElementTag.filter(
              (el: any) =>
                el.tags.custom.shape_type === 'catalog' ||
                el.tags.custom.shape_type === 'item'
            )
            const itemGroup = newElementList.filter(
              (el: any) =>
                el.tags.custom.shape_type === 'catalog' ||
                el.tags.custom.shape_type === 'item'
            )
            oldDatas = handleSameTags(sameTitle, item, itemGroup)
          } else if (
            item?.tags?.custom?.shape_type === 'detail' ||
            item?.tags?.custom?.shape_type === 'english'
          ) {
            const sameSubtitle = oldElementTag.filter(
              (el: any) =>
                el.tags.custom.shape_type === 'detail' ||
                el.tags.custom.shape_type === 'english'
            )

            const itemGroup = newElementList.filter(
              (el: any) =>
                el.tags.custom.shape_type === 'detail' ||
                el.tags.custom.shape_type === 'english'
            )

            oldDatas = handleSameTags(sameSubtitle, item, itemGroup)
            if (!oldDatas) {
              const index = item.tags.custom.group_index
              const text = otherDatas?.describelist?.length
                ? otherDatas?.describelist[index - 1]?.text
                : ''
              if (text && item?.text) {
                viewMoldeTextReplace(item, text, colorList)
                setTextContent(item, item.type)
              } else {
                if (window._PROCESS_CONTENT) {
                  item.isDescribe = true
                } else {
                  item.isDelete = true
                }
              }
            }
          } else if (
            item?.tags?.custom?.shape_type === 'thesisinfo' ||
            item?.tags?.custom?.shape_type === 'advisor'
          ) {
            item.isDelete = true
          } else {
            if (
              flage === 'chapter' &&
              item?.tags?.custom?.shape_type !== 'decoration'
            ) {
              if (fileterTagSlide.tags?.custom?.page_type === 'catalog') {
                // 原数据普通章节 目录类型模版
                const currentNum = oldElementTag.find((el: any) => {
                  return el.tags.custom.shape_type === 'num'
                })
                const numText =
                  currentNum?.type === 'shape'
                    ? retunHtmlText(currentNum.text?.content)
                    : retunHtmlText(currentNum?.content)
                if (numText) {
                  oldSlide.chapterNum = convertToNumber(numText)
                }
                // 匹配新的数据是目录类型章节
                const catlogPage: any = oldSlideList.find((el: any) => {
                  return el?.tags?.custom?.page_type === 'catalog'
                })
                if (catlogPage) {
                  const catalogList = catlogPage?.elements?.filter(
                    (el: any) => {
                      return (
                        el.tags.custom.shape_type === 'catalog' ||
                        el.tags.custom.shape_type === 'item'
                      )
                    }
                  )

                  const index =
                    item?.tags?.custom?.group_index ||
                    item?.tags?.custom?.content_index
                  if (
                    item.tags.custom?.group_index > catalogList.length ||
                    item.tags.custom?.content_index > catalogList.length
                  ) {
                    item.isDelete = true
                    const sameGroup = newElementList.filter((el: any) => {
                      return el.groupId === item.groupId && item.groupId
                    })
                    if (sameGroup?.length) {
                      sameGroup.forEach((el: any) => {
                        el.isDelete = true
                      })
                    }
                  }

                  oldDatas = catalogList.find((el: any) => {
                    return (
                      el.tags.custom.group_index == index ||
                      el.tags.custom.content_index == index
                    )
                  })
                } else {
                  const chapterList = oldSlideList.filter((el: any) => {
                    return el.tags.custom.shape_type === 'chatper'
                  })

                  if (chapterList?.length) {
                  }
                }
              } else {
                //  匹配普通章节模版
                if (oldSlide?.chapterNum) {
                  const olgCatalog = oldElementTag.filter((el: any) => {
                    return (
                      el.tags.custom.shape_type === 'catalog' ||
                      el.tags.custom.shape_type === 'item'
                    )
                  })

                  oldDatas = olgCatalog.find((el: any) => {
                    return (
                      el?.tags?.custom?.group_index == oldSlide?.chapterNum ||
                      el?.tags?.custom?.content_index == oldSlide?.chapterNum
                    )
                  })
                }
              }
            }
          }
        } else {
          // 这里不是文本类型的数据
          // 背景图片需要替换的
          // logo是图片类型
          if (
            item.tags.custom.shape_type === 'logo' &&
            item.type === 'image' &&
            logoList?.length
          ) {
            const logoItem = logoList[0]
            if (logoItem.type === 'image') {
              item.src = logoItem.src
              item.isImage = true
            } else if (logoItem.type === 'text') {
              const text = retunHtmlText(item.content)
              imgToText(item, text, colorList)
            }
          } else if (
            item?.tags?.custom?.shape_type === 'school_bg' ||
            item.tags?.normal.some(
              (key: any) => key.value === 'YOO_CHATSHAPE_SCHOOL_BG'
            )
          ) {
            const sameOldTag = oldElementTag.find((el: any) => {
              return (
                el.tags.custom.shape_type === 'school_bg' ||
                el.tags?.normal.some(
                  (key: any) => key.value === 'YOO_CHATSHAPE_SCHOOL_BG'
                )
              )
            })
            if (!isBeautifyOneType.value) {
              if (schoolBgList.value.length) {
                item.src = schoolBgList.value[0]
                item.isImage = true
              } else {
                if (sameOldTag) {
                  item.src = sameOldTag.src
                  item.isImage = true
                  schoolBgList.value.push(item.src)
                } else {
                  item.isSchoolBg = true
                }
              }
            } else {
              if (sameOldTag) {
                item.src = sameOldTag.src
                item.isImage = true
              } else {
                item.isSchoolBg = true
              }
            }
          }
        }

        item.id = nanoid(10)
        if (item?.tags?.custom?.shape_type === 'num') {
          if (item?.text?.text === '壹') {
            const numList = [
              '壹',
              '贰',
              '叁',
              '肆',
              '伍',
              '陆',
              '柒',
              '捌',
              '玖',
            ]
            const index = item.tags.custom.group_index
            replaceOneLineText(numList[index - 1], item, flage)
          }
        }

        if (oldDatas && oldDatas?.text) {
          // 目录页面的 标题 和 序号 取用模版数据
          if (
            (item?.tags?.custom?.shape_type === 'num' ||
              item?.tags?.custom?.shape_type === 'title') &&
            flage === 'catalog'
          ) {
            // 目录的需要不需要替换
          } else if (
            (item?.tags?.custom?.shape_type === 'num' ||
              item?.tags?.custom?.shape_type === 'title') &&
            flage === 'chapter' &&
            fileterTagSlide.tags?.custom?.page_type === 'catalog'
          ) {
          } else if (
            hasCatalog &&
            flage === 'chapter' &&
            item?.tags?.custom?.shape_type === 'title' &&
            fileterTagSlide.tags?.custom?.page_type === 'chapter' &&
            oldSlide?.chapterNum
          ) {
            // 如果是原章节是目录类型的数据 但是配的是普通的模版 需要找到对应的 目录标题
            oldDatas = oldElementTag.find((oldItem: any) => {
              return (
                (oldItem.tags?.custom?.shape_type === 'catalog' ||
                  oldItem.tags?.custom?.shape_type === 'item') &&
                oldItem.tags?.custom?.group_index == oldSlide?.chapterNum
              )
            })
            if (oldDatas) {
              const text =
                oldDatas.type === 'shape'
                  ? retunHtmlText(oldDatas.text?.content)
                  : retunHtmlText(oldDatas?.content)
              viewMoldeTextReplace(item, text, colorList)
              setTextContent(item, item.type)
            }
          }
          // 其他相同的旧数据 去除文本数据 填充到新的模版数据
          else {
            const sourceTags = oldDatas?.tags?.normal?.find(
              (ele: any) => ele.key === 'TAG_CITE_ID'
            )
            if (sourceTags) {
              item.tags.normal.push(sourceTags)
            }

            const text =
              oldDatas.type === 'shape'
                ? retunHtmlText(oldDatas.text?.content)
                : retunHtmlText(oldDatas?.content)
            viewMoldeTextReplace(item, text, colorList)
            setTextContent(item, item.type)
          }
        }
      })

      if (flage === 'chapter') {
        if (
          oldSlide.chapterNum &&
          fileterTagSlide?.tags?.custom?.page_type === 'chapter'
        ) {
          const num = newElementList.find((el: any) => {
            return el?.tags?.custom?.shape_type === 'num' && el?.text?.text
          })
          if (num) {
            const numbers =
              oldSlide.chapterNum > 9
                ? oldSlide.chapterNum
                : `0${oldSlide.chapterNum}`
            replaceOneLineText(numbers, num)
          }
        } else if (
          oldSlide.chapterNum &&
          fileterTagSlide?.tags?.custom?.page_type === 'catalog'
        ) {
          let sameElement: any = null

          newElementList.forEach((el: any) => {
            if (
              el?.text?.text &&
              el?.tags?.custom?.shape_type !== 'decoration'
            ) {
              if (
                el?.tags?.custom?.group_index == oldSlide.chapterNum ||
                (!el?.tags?.custom?.group_index &&
                  el?.tags?.custom?.content_index == oldSlide.chapterNum)
              ) {
                sameElement = el
              }
            }
          })

          if (sameElement) {
            // 处理高亮
            const sameGroup = newElementList.filter((el: any) => {
              return (
                (el.groupId === sameElement.groupId && sameElement.groupId) ||
                sameElement.id === el.id
              )
            })

            if (sameGroup?.length) {
              // 设置高亮颜色
              setSpecialChapterStyle(sameGroup)
            }
          }
        }
        fileterTagSlide.tags.custom.page_type = 'chapter'
      }

      newElementList = newElementList.filter((item: any) => !item.isDelete)
      if (
        JSON.stringify(fileterTagSlide.background) !== '{}' &&
        fileterTagSlide.background !== null
      ) {
        oldSlide.background = fileterTagSlide.background
      } else {
        oldSlide.background = {
          type: 'solid',
          color: { type: 'themeColor', value: 'bg1', transparent: '1' },
        }
      }

      if (!isBeautifyOneType.value) {
        await handleSetElementAgainst(newElementList, flage)
      }
      oldSlide.elements = [...newElementList, ...userAddElement]
      oldSlide.tags = fileterTagSlide.tags

      return oldSlide
    } catch (error) {
      return oldSlide
    }
  }

  const imgToText = (item: any, text: any, colorList: any) => {
    item.type = 'text'
    delete item.src
    delete item.shapePresetType
    item.text = {
      text: '',
      verticalAlign: 'center',
      autoSize: 'textFitShape',
      paragraphs: [
        {
          align: 'left',
          lineHeight: 0,
          paragraphSpace: 0,
          paragraphSpaceAfter: 0,
          marginLeft: 0,
          marginRight: 0,
          indent: 0,
          runs: [
            {
              text: '2023.01.01',
              start: 0,
              len: 10,
              fontName: '微软雅黑',
              fontSize: 14,
              bold: false,
              italic: false,
              underline: false,
              delline: false,
              wordSpace: 0,
              fontColor: {
                type: 'themeColor',
                value: 'text1',
                transparent: '1',
              },
            },
          ],
        },
      ],
    }
    viewMoldeTextReplace(item, text, colorList)
    setTextContent(item, item.type)
  }
  // 单页内容视觉模型美化 特殊页面 封面 章节 目录 结束
  const handleViewSpecialPage = async (
    oldSlide: any,
    newSlides: any,
    type: string,
    viewApiData: any
  ) => {
    const oldSlideList = beatufiySlideList.value?.length
      ? beatufiySlideList.value
      : slides.value
    // newSlides 所有章节内容
    // 将模版数据里面的对应模版类型过滤 封面页 章节页 内容 目录 结束
    const fileterTagSlide = Array.isArray(newSlides)
      ? filterArr(newSlides, type)
      : newSlides

    if (!fileterTagSlide) return
    // 新的模版元素list
    let newElementList = JSON.parse(JSON.stringify(fileterTagSlide.elements))
    // 内容字体跟随 随机字体
    setDataFontName([], newElementList)
    let catalogCount = 0
    // 副标题
    let subTitle = ''
    // 章节序号
    if (viewApiData?.number) {
      viewApiData.num = viewApiData.number
    }

    if (viewApiData?.logogImgList) {
      const logoImg = viewApiData?.logogImgList[0]
      if (logoImg && (logoImg.src || logoImg?.fillPicture?.src)) {
        viewApiData.logoText = logoImg.src || logoImg?.fillPicture?.src
      }
    }
    const falgeKey = ['cover', 'end', 'chatper']
    if (falgeKey.includes(type)) {
      let titleFrom = 'title'
      // 标题
      if (!viewApiData?.title) {
        if (viewApiData?.thanks) {
          viewApiData.title = viewApiData.thanks
        } else if (viewApiData?.subTitle) {
          viewApiData.title = viewApiData.subTitle
          titleFrom = 'subTitle'
        } else if (viewApiData?.titleEngilish) {
          viewApiData.title = viewApiData.titleEngilish
          titleFrom = 'titleEngilish'
        }
      }
      // 副标题
      if (viewApiData?.subTitle && !viewApiData?.titleEngilish) {
        subTitle = viewApiData?.subTitle.join('|')
      } else if (viewApiData?.subTitle && viewApiData?.titleEngilish) {
        subTitle = viewApiData?.subTitle.join('|')
        if (titleFrom !== 'subTitle') {
          subTitle += viewApiData?.titleEngilish
        }
      } else if (!viewApiData?.subTitle && viewApiData?.titleEngilish) {
        if (titleFrom !== 'titleIsEngilsh') {
          subTitle = viewApiData?.titleEngilish
        }
      } else if (viewApiData?.titleDetail) {
        subTitle = viewApiData?.titleDetail
      } else if (viewApiData?.contentTexts) {
        subTitle = viewApiData?.contentTexts.join('|')
      } else if (viewApiData?.otherTexts) {
        subTitle = viewApiData?.otherTexts.join('|')
      }

      if (viewApiData?.dateTime) {
        viewApiData.date = viewApiData.dateTime
      }
    } else {
      // 目录项
      if (viewApiData?.groupCatlog) {
        catalogCount = viewApiData.groupCatlog.length
      }
    }

    // logo
    if (viewApiData?.company) {
      viewApiData.logo = viewApiData?.company
    } else if (viewApiData?.logoText) {
      viewApiData.logo = viewApiData?.logoText
    }
    // 封面 和结束没有用户名 或者 日期时 初始化一下
    if (type === 'cover' || type === 'end') {
      if (type === 'end') {
        const cover: any = oldSlideList.find((el: any) => {
          return el?.tags?.custom?.page_type === 'cover'
        })

        if (cover) {
          const dateData = cover.elements.find((el: any) => {
            return el.tags.custom.shape_type === 'date'
          })
          if (dateData?.text?.text && !viewApiData.dateTime) {
            viewApiData.dateTime =
              dateData.type === 'shape'
                ? retunHtmlText(dateData.text?.content)
                : retunHtmlText(dateData?.content)
          }

          const authorData = cover.elements.find((el: any) => {
            return el.tags.custom.shape_type === 'author'
          })
          if (authorData?.text?.text && !viewApiData.author) {
            viewApiData.author =
              authorData.type === 'shape'
                ? retunHtmlText(authorData.text?.content)
                : retunHtmlText(authorData?.content)
          }
        }
      }

      if (!viewApiData.dateTime) {
        viewApiData.date = moment(Date.now()).format('YYYY.MM.DD')
      }

      if (!viewApiData.author) {
        viewApiData.author = useInfo?.value?.nickname
      }
    }

    if (type === 'catalog' && catalogCount > 0) {
      const groupIdList: any = []
      newElementList.forEach((item: any) => {
        if (item.tags.custom.group_index > catalogCount) {
          if (!groupIdList.includes(item.groupId)) {
            groupIdList.push(item.groupId)
          }
        }
      })
      newElementList = newElementList.filter((item: any) => {
        return !groupIdList.includes(item.groupId)
      })
    }

    if (!viewApiData.logo) {
      const logoTag = ['logo', 'company']
      newElementList = newElementList.filter((el: any) => {
        return !logoTag.includes(el.tags.custom.shape_type)
      })
    }

    if (type === 'chapter' && !viewApiData.number) {
      newElementList = newElementList.filter((el: any) => {
        return el.tags.custom.shape_type !== 'num'
      })
    }
    // 针对匹配的章节页是目录类型的效果
    let noRelace = false
    if (
      type === 'chapter' &&
      fileterTagSlide?.tags?.custom?.page_type === 'catalog'
    ) {
      noRelace = true
      setElementGroup(fileterTagSlide.elements)
      // 看全局数据 又没有目录页面 如果有就用目录页面数据进行复制
      const catalogSlide: any = oldSlideList.find(
        (ele: any) => ele.tags?.custom?.page_type === 'catalog'
      )

      if (catalogSlide) {
        const catalogList = catalogSlide?.elements?.filter((el: any) => {
          return (
            el.tags.custom.shape_type === 'catalog' ||
            el.tags.custom.shape_type === 'item'
          )
        })
        const newCatalogList = newElementList.filter((el: any) => {
          return (
            el.tags.custom.shape_type === 'catalog' ||
            el.tags.custom.shape_type === 'item'
          )
        })
        if (viewApiData?.number) {
          oldSlide.chapterNum = convertToNumber(viewApiData?.number)
        }

        newCatalogList.forEach((newItem: any) => {
          const colorList = newItem?.defaultColor?.templateThemeColors
          const index =
            newItem?.tags?.custom?.group_index ||
            newItem?.tags?.custom?.content_index
          // 多余的删除
          if (
            newItem.tags.custom?.group_index > catalogList.length ||
            newItem.tags.custom?.content_index > catalogList.length
          ) {
            const sameGroup = newElementList.filter((el: any) => {
              return el.groupId === newItem.groupId && newItem.groupId
            })
            if (sameGroup?.length) {
              sameGroup.forEach((el: any) => {
                el.isDelete = true
              })
            }
          }

          const oldDatas = catalogList.find((el: any) => {
            return (
              el.tags.custom.group_index == index ||
              el.tags.custom.content_index == index
            )
          })

          if (index == oldSlide.chapterNum) {
            setSpecialChapterStyle([newItem])
          }

          if (oldDatas) {
            const text =
              oldDatas.type === 'shape'
                ? retunHtmlText(oldDatas.text?.content)
                : retunHtmlText(oldDatas?.content)
            viewMoldeTextReplace(newItem, text, colorList)
            setTextContent(newItem, newItem.type)
          }
        })
      } else {
        // 没有识别到目录页面
      }

      fileterTagSlide.tags.custom.page_type = 'chapter'
    }

    newElementList.forEach((item: any) => {
      const keyData = item?.tags?.normal?.find(
        (el: any) => el.key === 'YOO_CHATSHAPE_TYPE'
      )
      let keyType = keyData?.value
        ? keyData?.value.replace('YOO_CHATSHAPE_', '').toLowerCase()
        : ''

      if (!keyType) {
        keyType = item?.tags?.custom?.shape_type
      }

      const group_index = item.tags?.custom?.group_index // 组顺序
      const content_index = item.tags?.custom?.content_index // 组内的第一几个 没有组时 就是内容顺序
      const colorList = item?.defaultColor?.templateThemeColors

      // 封面页 章节页 目录页 contentTexts/subTitle/titleEnglish/catlogEnglish/titleDetail 都作为副标题
      if (noRelace && (keyType === 'title' || keyType === 'num')) {
        return
      }
      if (viewApiData[keyType]) {
        if (item.text && typeof viewApiData[keyType] === 'string') {
          if (keyType === 'logo' && viewApiData[keyType].indexOf('http') > -1) {
            item.src = viewApiData?.logo
            item.isImage = true
          } else {
            viewMoldeTextReplace(item, viewApiData[keyType], colorList)
            setTextContent(item, item.type)
          }
        } else if (item.type === 'image' && keyType === 'logo') {
          if (viewApiData[keyType].indexOf('http') > -1) {
            item.src = viewApiData?.logo
            item.isImage = true
          } else {
            //
            imgToText(item, viewApiData[keyType], colorList)
          }
        } else if (Array.isArray(viewApiData[keyType])) {
        }
      } else {
        // 模版里 没有数据类型
        if (keyType === 'company') {
          if (viewApiData.logo.indexOf('http') > -1) {
            item.src = viewApiData?.logo
            item.isImage = true
          } else {
            viewMoldeTextReplace(item, viewApiData.logo, colorList)
            setTextContent(item, item.type)
          }
        }

        if (
          (keyType === 'content' || keyType === 'subtitle') &&
          type !== 'catalog'
        ) {
          if (subTitle) {
            viewMoldeTextReplace(item, subTitle, colorList)
            setTextContent(item, item.type)
          } else {
            if (viewApiData.title && window._PROCESS_TRANSLATE) {
              item.isTranslate = true
            } else {
              item.isDelete = true
            }
          }
        }

        // 目录
        if (type === 'catalog' && viewApiData.groupCatlog) {
          let catalogIndex = group_index
          if (!group_index) {
            catalogIndex = content_index
          }

          if (
            viewApiData.groupCatlog[catalogIndex - 1] &&
            item?.tags?.custom?.shape_type
          ) {
            const catalogData = viewApiData.groupCatlog[catalogIndex - 1]
            let content: any = ''
            if (
              item.tags.custom.shape_type === 'catalog' ||
              item.tags.custom.shape_type === 'item'
            ) {
              content = catalogData.catlogItem
            } else if (
              item.tags.custom.shape_type === 'detail' ||
              item.tags.custom.shape_type === 'english'
            ) {
              content = catalogData.catlogDetail
              if (!content) {
                item.isDescribe = true
              }
            }

            if (content) {
              viewMoldeTextReplace(item, content, colorList)
              setTextContent(item, item.type)
            }
          }
        } else if (type === 'end') {
          if (
            viewApiData.otherText?.length &&
            item.text &&
            item.tags?.custom?.shape_type === 'subtitle'
          ) {
            viewMoldeTextReplace(item, viewApiData.otherText[0], colorList)
            setTextContent(item, item.type)
          }
        }

        // 背景
        if (keyType === 'school_bg' && viewApiData.schoolBg) {
          item.src = viewApiData.schoolBg
          item.isImage = true
        }
      }
      if (item.name.indexOf('翻译') > -1) {
        if (window._PROCESS_TRANSLATE) {
          item.isTranslate = true
        } else {
          item.isDelete = true
        }
      }
    })

    newElementList = newElementList.filter((item: any) => !item.isDelete)
    // 这里重制一下元素的id 不然会导致后置美化查询元素的时候 查到相同元素
    newElementList.forEach((item: any) => {
      item.id = nanoid(10)
    })

    if (!oldSlide) {
      oldSlide = JSON.parse(JSON.stringify(fileterTagSlide))
    }

    if (
      JSON.stringify(fileterTagSlide.background) !== '{}' &&
      fileterTagSlide.background !== null
    ) {
      oldSlide.background = fileterTagSlide?.background
    } else {
      oldSlide.background = {
        type: 'solid',
        color: { type: 'themeColor', value: 'bg1', transparent: '1' },
      }
    }
    if (!isBeautifyOneType.value) {
      await handleSetElementAgainst(newElementList, type)
    }

    oldSlide.elements = newElementList
    oldSlide.tags = fileterTagSlide.tags

    return oldSlide
  }

  const isEnglishValue = () => {
    let isUseDescribe = false
    if (
      getPPTLanguage.value === 'en-US' ||
      (!getPPTLanguage.value && lang === 'en-US')
    ) {
      isUseDescribe = true
    }
    return isUseDescribe
  }

  // 单页特殊页面 视觉美化
  // 单页 视觉模型 内容页
  const handleContentPageView = async (
    data: any,
    newSlide: any,
    flage: string,
    viewApiData: any
  ) => {
    // flage 原数据页面类型
    // 将模版数据里面的对应模版类型过滤 封面页 章节页 内容 目录 结束
    const contentType = ['multcontent', 'background', 'content']
    const fileterTagSlide = Array.isArray(newSlide)
      ? newSlide.find((item: any) =>
          contentType.includes(item.tags.custom.page_type)
        )
      : newSlide
    data.elements = data.elements.filter((item: any) => {
      return item?.tags?.custom?.shape_type !== 'bg'
    })

    if (!fileterTagSlide) {
      data.elements = []
      return
    }
    // 新模版类型
    const pageType = fileterTagSlide.tags.custom.page_type

    // 新的模版元素list
    let elementList = JSON.parse(JSON.stringify(fileterTagSlide.elements))

    const imgKey = ['childimage', 'image', 'wordcloud']
    // 视觉模型 图示项
    let groupList: any = []
    // 视觉模型 内容想
    let contentList: any = []
    // 视觉模型 图片
    // 视觉模型 特殊类型 如 视频 音频 图标 表格 这些都是通过 视觉模型的images数据的位置信息匹配
    const specialList = viewApiData?.specialElement?.length
      ? JSON.parse(JSON.stringify(viewApiData?.specialElement))
      : []

    const imgElementList = specialList.filter(
      (item: any) =>
        (item.type === 'image' || item.type === 'shape') &&
        item?.tags?.custom?.shape_type !== 'logo'
    )
    let logoImgList = []
    if (viewApiData?.logoImgList?.length) {
      logoImgList = viewApiData?.logoImgList[0]
    }

    const key = ['image', 'wordcloud', 'childimage']
    // 将原本数据的图片数据提取出来 解决视觉模型查找数据错误问题
    let imgSrcList = data.elements.map((item: any) => {
      let imgSrc = ''
      if (item.type === 'image') {
        imgSrc = item?.src
      } else if (item.type === 'shape' && item?.fillPicture?.src) {
        imgSrc = item?.fillPicture?.src
      }
      if (item?.tags?.custom?.shape_type) {
        if (!key.includes(item.tags.custom.shape_type)) {
          imgSrc = ''
        }
      }
      return imgSrc
    })

    imgSrcList = imgSrcList.filter((item: any) => item)

    // 标题
    let titleIsEngilsh = false
    if (!viewApiData?.title) {
      if (viewApiData?.titleEngilish) {
        viewApiData.title = viewApiData?.titleEngilish
        titleIsEngilsh = true
      }
    }
    // 副标题
    let subTitle = ''
    if (viewApiData?.subTitle && !viewApiData?.titleEngilish) {
      subTitle = viewApiData?.subTitle.join('|')
    } else if (viewApiData?.subTitle && viewApiData?.titleEngilish) {
      subTitle = viewApiData?.subTitle.join('|')
      if (!titleIsEngilsh) {
        subTitle += viewApiData?.titleEngilish
      }
    } else if (
      !viewApiData?.subTitle &&
      viewApiData?.titleEngilish &&
      !titleIsEngilsh
    ) {
      subTitle = viewApiData?.titleEngilish
    } else if (viewApiData?.titleDetail) {
      subTitle = viewApiData?.titleDetail
    }

    // logo
    if (viewApiData?.company) {
      viewApiData.logo = viewApiData?.company
    } else if (viewApiData?.logoText) {
      viewApiData.logo = viewApiData?.logoText
    }

    // 内容
    if (viewApiData?.groupContent) {
      groupList = viewApiData.groupContent[0]?.items
    }
    if (viewApiData?.contentTexts) {
      contentList = viewApiData.contentTexts
    }

    elementList.forEach((item: any, index: number) => {
      // 这里重制一下元素的id 不然会导致后置美化查询元素的时候 查到相同元素
      item.id = nanoid(10)

      const keyData = item?.tags?.normal?.find(
        (el: any) => el.key === 'YOO_CHATSHAPE_TYPE'
      )
      const keyType = keyData?.value
        ? keyData?.value.replace('YOO_CHATSHAPE_', '').toLowerCase()
        : ''
      const group_index = item.tags?.custom?.group_index // 组顺序
      const content_index = item.tags?.custom?.content_index // 组内的第一几个 没有组时 就是内容顺序

      const colorList =
        data.type === 'shape'
          ? data.text?.defaultColor?.templateThemeColors
          : data?.defaultColor?.templateThemeColors

      // 文本替换
      if (item.text) {
        if (viewApiData[keyType]) {
          if (typeof viewApiData[keyType] === 'string') {
            viewMoldeTextReplace(item, viewApiData[keyType], colorList)
            setTextContent(item, item.type)
          }
        } else {
          // 模版有副标题 判断原数据有没有副标题subTitle/titleEngilish/titleDetail
          if (keyType === 'subtitle') {
            if (subTitle) {
              viewMoldeTextReplace(item, subTitle, colorList)
              setTextContent(item, item.type)
            } else {
              item.isDelete = true
            }
          } else if (keyType === 'title' && !viewApiData?.title) {
            item.isDelete = true
          } else if (keyType === 'logo' || keyType === 'company') {
            if (viewApiData?.logo) {
              if (viewApiData?.logo.indexOf('http') > -1) {
                item.src = viewApiData?.logo
                item.isImage = true
              } else {
                viewMoldeTextReplace(item, viewApiData.logo, colorList)
                setTextContent(item, item.type)
              }
            } else {
              // elementList.splice(index, 1)
              item.isDelete = true
            }
          }
          // 判断模版是 复杂类型 还是 简单类型
          // 1.复杂类型 判断视觉模型数据有没有图示组 没有就看内容数据能否转为图示项
          // 2.简单类型 先填充内容数据 没有内容数据 有图示数据时 转化图示数据

          if (pageType === 'multcontent') {
            // 图示类型
            // 复杂类型
            if (groupList?.length) {
              const groupItem = groupList[group_index - 1]
              if (keyType === 'childtitle') {
                if (groupItem?.title) {
                  viewMoldeTextReplace(item, groupItem.title, colorList)
                  setTextContent(item, item.type)
                } else {
                  item.isDelete = true
                }
              } else if (keyType === 'childcontent') {
                if (groupItem?.text) {
                  viewMoldeTextReplace(item, groupItem.text, colorList)
                  setTextContent(item, item.type)
                } else if (groupItem?.subTitle) {
                  viewMoldeTextReplace(item, groupItem.subTitle, colorList)
                  setTextContent(item, item.type)
                } else {
                  item.isDelete = true
                }
              }
            }
            if (contentList?.length) {
              const content = contentList.join('|')
              const pList = content.split('|')
              pList.forEach((el: any, index: number) => {
                if (!groupList?.length) {
                  if (index % 2 === 0) {
                    // 标题行
                    const groupIndex = index / 2 + 1 + ''
                    if (
                      groupIndex === group_index &&
                      keyType === 'childtitle'
                    ) {
                      viewMoldeTextReplace(item, el, colorList)
                      setTextContent(item, item.type)
                    }
                  } else {
                    // 内容行
                    const groupIndex = (index - 1) / 2 + 1 + ''
                    if (
                      groupIndex === group_index &&
                      keyType === 'childcontent'
                    ) {
                      viewMoldeTextReplace(item, el, colorList)
                      setTextContent(item, item.type)
                    }
                  }
                  if (item.text.text.indexOf(el) > -1) {
                    // 匹配到内容

                    const index = item.text.text.indexOf(el)
                    const temp = item.text.paragraphs[0]
                    const tempRuns = temp.runs[0]
                    tempRuns.text = item.text.text.slice(0, index)
                  }
                } else {
                  if (keyType === 'content') {
                    viewMoldeTextReplace(item, el, colorList)
                    setTextContent(item, item.type)
                  }
                }
              })
            }
          } else if (pageType === 'content' && keyType === 'content') {
            // 简单类型
            if (contentList?.length && !groupList?.length) {
              // 目前没有两段文本的 如果contentList是多个都合并成一段
              const content = contentList.join('|')
              if (content) {
                viewMoldeTextReplace(item, content, colorList, true)
                setTextContent(item, item.type)
              }
            } else if (groupList?.length && !contentList?.length) {
              // 图示型 转化为内容
              let content = ''
              // 新需求 要求空白的实例数据少填充点
              if (viewApiData?.isEmptyData && groupList?.length > 2) {
                groupList = groupList.slice(0, 2)
              }
              groupList.forEach((el: any) => {
                if (el.title) {
                  content += el.title + '|'
                }
                if (el.text) {
                  content += el.text + '|'
                }
              })
              if (content.slice(-1) === '|') {
                content = content.slice(0, -1)
              }
              if (content) {
                viewMoldeTextReplace(item, content, colorList)
                setTextContent(item, item.type)
              }
            } else if (groupList?.length && contentList?.length) {
              let content = ''
              groupList.forEach((el: any) => {
                if (el.title) {
                  content += el.title + '|'
                }
                if (el.text) {
                  content += el.text + '|'
                }
              })
              contentList.forEach((el: any) => {
                content += el + '|'
              })
              if (content.slice(-1) === '|') {
                content = content.slice(0, -1)
              }
              if (content) {
                viewMoldeTextReplace(item, content, colorList)
                setTextContent(item, item.type)
              }
            } else {
              // 上面两个都是空那就删除这个
              item.isDelete = true
            }
          }
        }
      }

      if (item.text) {
        setTextContent(item, item.type)
      }

      // 图片
      // 图表/表格
      // 图片替换
      if (imgKey.includes(item.tags?.custom?.shape_type)) {
        if (imgElementList?.length) {
          const sameData = imgElementList.shift()
          if (sameData.type === 'image' || sameData.type === 'shape') {
            if (sameData.type === 'shape') {
              item.src = sameData?.fillPicture?.src
            } else {
              item.src = sameData.src
            }
            if (sameData?.tags?.custom?.shape_type) {
              if (!key.includes(sameData.tags.custom.shape_type)) {
                item.src = ''
              }
            }
            if (!item.src && imgSrcList?.length) {
              item.src = imgSrcList.shift()
            }
            item.imgResect = true
          }
        } else {
          item.tags.custom.shape_type = 'image'
          item.imgResect = true
        }
      }

      // 模版是图表类型 可以替换原文的图表或者表格内容
      if (
        item.tags?.custom?.shape_type === 'chart' ||
        item.tags?.custom?.shape_type === 'table'
      ) {
        const sameData = specialList.shift()
        if (sameData?.type === 'table' || sameData?.type === 'chart') {
          sameData.top = item.top
          sameData.left = item.left
          sameData.width = item.width
          sameData.height = item.height
          sameData.rotate = 0
          sameData.tags = item.tags
          const themeColor = item.templateThemeColors
          if (sameData.type === 'table') {
            if (sameData.data?.length) {
              sameData.data.forEach((el: any, index: number) => {
                if (el?.length) {
                  el.forEach((eles: any) => {
                    if (themeColor && eles.style.color) {
                      eles.style.color.templateThemeColors = JSON.parse(
                        JSON.stringify(themeColor)
                      )
                    }
                    eles.style.fontsize = index > 0 ? '14px' : '16px'
                    eles.style.bold = index > 0 ? false : true
                    delete eles.style.backcolor
                  })
                }
              })
              const oneHeight: any = item.height / sameData.data.length
              sameData.cellMinHeight = parseInt(oneHeight)
            }
            sameData.theme = {
              color: {
                type: 'themeColor', // 类型：themeColor、rgb
                value: 'accent1', // 颜色值，如果是themeColor，则为id；否则为十六进制色值
                transparent: 1,
              },
              rowHeader: false,
              rowFooter: false,
              colHeader: false,
              colFooter: false,
            }
            if (themeColor) {
              sameData.theme.color.templateThemeColors = JSON.parse(
                JSON.stringify(themeColor)
              )
              sameData.outline.color.templateThemeColors = JSON.parse(
                JSON.stringify(themeColor)
              )
            }
            sameData.tableStyle = 'threeTable'
            sameData.tags.custom.shape_type = 'table'
          } else if (sameData.type === 'chart') {
            if (sameData.themeColors) {
              if (sameData.themeColors?.length) {
                sameData.themeColors.forEach((color: any) => {
                  color.templateThemeColors = themeColor
                })
              }
            }

            if (sameData.textColor) {
              sameData.textColor.templateThemeColors = themeColor
            }
          }
          elementList[index] = JSON.parse(JSON.stringify(sameData))
        } else {
          item.imgResect = true
          item.name = '图片'
          item.tags = {
            custom: {
              shape_type: 'image',
            },
            normal: [
              {
                key: 'YOO_CHATSHAPE_TYPE',
                value: 'YOO_CHATSHAPE_IMAGE',
              },
            ],
          }

          if (sameData?.type === 'image') {
            item.src = sameData?.src
          } else if (sameData?.type === 'shape' && sameData?.fillPicture?.src) {
            item.src = sameData?.fillPicture?.src
          } else {
            item.src = ''
          }
        }
      }
    })

    elementList = elementList.filter((item: any) => {
      return !item.isDelete
    })

    if (!isBeautifyOneType.value) {
      await handleSetElementImg(elementList)
    }
    data.background = fileterTagSlide.background
    data.elements = elementList
    data.tags = fileterTagSlide.tags
    return data
  }

  // 根据视觉模型的 位置信息找到原章节匹配的图片 表格 图标等数据
  const handleViewImgData = (currentSlide: any, viewData: any) => {
    if (!currentSlide) return
    const silde = JSON.parse(JSON.stringify(currentSlide))
    const element = silde.elements
    const viewImage = viewData?.images || []
    if (viewImage?.length === 0 || element?.length === 0) return
    const imgList = []
    const chartList = []
    const tableList = []
    const logogList: any = []
    const specialList: any = []
    const orginSideW = viewData?.slideW || presentation.value?.width || 960
    const orginSideH = viewData?.slideH || presentation.value?.height || 540
    function calculateOverlapArea(rect1: any, rect2: any) {
      // rect1 是原数据
      // rect2 是视觉模型解析出来的位置信息
      const left = Math.max(rect1.left, rect2.left)
      const top = Math.max(rect1.top, rect2.top)
      const right = Math.min(rect1.left + rect1.width, rect2.left + rect2.width)
      const bottom = Math.min(
        rect1.top + rect1.height,
        rect2.top + rect2.height
      )
      if (left < right && top < bottom) {
        specialList.push(rect1)
        if (rect1.type === 'table' && rect2.type === 'YOO_CHATSHAPE_TABLE') {
          tableList.push(rect1)
        } else if (
          rect1.type === 'chart' &&
          rect2.type === 'YOO_CHATSHAPE_CHART'
        ) {
          chartList.push(rect1)
        } else {
          if (rect2.type === 'YOO_CHATSHAPE_LOGO') {
            if (rect1.src || rect1.fillPicture?.src) {
              logogList.push(rect1)
            }
          } else {
            imgList.push(rect1)
          }
        }
      }
    }

    for (const rect1 of element) {
      for (const rect2 of viewImage) {
        const keyList = ['left', 'top', 'width', 'height']
        keyList.forEach((key: any, index: number) => {
          rect2[key] = rect2.rect[index]
        })

        // 后台给的x,y是中心点，html 是根据盒子的左上角坐标，所以要减去盒子的宽高/2
        rect2.left =
          (orginSideH / rect2.origShape[0]) * (rect2.left - rect2.width / 2)
        rect2.top =
          (orginSideW / rect2.origShape[1]) * (rect2.top - rect2.height / 2)

        rect2.width = (orginSideH / rect2.origShape[0]) * rect2.width
        rect2.height = (orginSideH / rect2.origShape[0]) * rect2.height
        calculateOverlapArea(rect1, rect2)
      }
    }

    const uniqueArr = specialList.filter(
      (item: any, index: number, self: any) =>
        index === self.findIndex((t: any) => t.id === item.id)
    )

    const templist = uniqueArr.filter((item: any) => {
      return item.type !== 'text'
    })

    if (logogList?.length) {
      viewData.logogImgList = logogList
    }

    viewData.specialElement = templist

    // 图层在在最上面的优先
    viewData.specialElement = viewData.specialElement.reverse()
  }

  // 返回当前章节页面数据的 翻译 简述 数据 tags 数据
  const returnOhterData = (
    slideTage: any,
    slideElements: any,
    viewData?: any
  ) => {
    if (viewData) {
      return {
        describelist: viewData?.describelist,
        translatelist: viewData?.translatelist,
        tags: viewData?.tags,
      }
    }
    // 第一个当页面 的 简述 翻译 独立出来
    const elementsList = JSON.parse(JSON.stringify(slideElements))
    let titleList: any = elementsList.filter(
      (item: any) =>
        item?.tags?.custom?.shape_type === 'title' && item?.text?.text
    )
    titleList = titleList.map((item: any) => {
      const dom =
        item.type === 'shape'
          ? retunHtmlText(item.text?.content)
          : retunHtmlText(item.content)
      return {
        text: dom,
        index: item?.tags?.custom?.group_index,
      }
    })

    // 简述
    let describelist: any = elementsList.filter((item: any) => {
      return (
        (item?.name?.indexOf('简述') > -1 ||
          item?.tags?.custom?.shape_type === 'detial') &&
        item?.text?.text
      )
    })

    // 翻译
    let translatelist = elementsList.filter(
      (item: any) =>
        (item?.name.indexOf('翻译') > -1 ||
          item?.tags?.custom?.text_type === 'english' ||
          item?.tags?.custom?.shape_type === 'subtitle') &&
        item?.text?.text
    )

    if (describelist?.length) {
      // 获取dom 元素 和 tags的索引
      describelist = describelist.map((item: any) => {
        const dom =
          item.type === 'shape'
            ? retunHtmlText(item.text.content)
            : retunHtmlText(item.content)
        return {
          text: dom,
          index: item?.tags?.custom?.group_index,
        }
      })
    }

    if (translatelist?.length) {
      translatelist = translatelist.map((item: any) => {
        const dom =
          item.type === 'shape'
            ? retunHtmlText(item.text.content)
            : retunHtmlText(item.content)
        return {
          text: dom,
          index: item?.tags?.custom?.group_index,
        }
      })
    }

    return {
      describelist,
      translatelist,
      titleList,
    }
  }

  // 返回单行的文本数据类型
  const retunHtmlText = (str: any) => {
    if (!str) return ''
    const parser = new DOMParser()
    const doc = parser.parseFromString(str, 'text/html')
    const domObj: any = doc.body.childNodes
    let resule = ''
    for (let index = 0; index < domObj.length; index++) {
      if (domObj[index].textContent) {
        resule += domObj[index].textContent
      } else if (domObj[index].nodeType === 3) {
        resule += domObj[index]
      }
    }
    return resule
  }

  // 单行文本替换
  const replaceOneLineText = (str: any, item: any, pageType?: string) => {
    // 标题 必填项，无则留白
    item.text.text = str
    const paragraphs = item.text.paragraphs?.length
      ? item.text.paragraphs[0]
      : null
    if (paragraphs) {
      const runsItem = paragraphs.runs[0]
      runsItem.text = str
      runsItem.len = str?.length
      if (defaultColorTheme() && runsItem.fontColor.value === 'bg2') {
        runsItem.fontColor.value = 'text1'
      }
      paragraphs.runs = [runsItem]
      item.text.paragraphs = [paragraphs]
      setTextContent(item, item.type)
    }
  }

  const defaultColorTheme = () => {
    const colorList = themeColorList?.value
    const defaultColor = {
      text1: '#000000',
      bg1: '#FFFFFF',
      text2: '#44546A',
      bg2: '#E7E6E6',
      accent1: '#4472C4',
      accent2: '#ED7D31',
      accent3: '#A5A5A5',
      accent4: '#FFC000',
      accent5: '#5B9BD5',
      accent6: '#70AD47',
      hyperLink: '#0563C1',
      followedHyperlink: '#954F72',
    }

    const default2 = {
      text1: '#000000',
      bg1: '#FFFFFF',
      text2: '#1F497D',
      bg2: '#EEECE1',
      accent1: '#4F81BD',
      accent2: '#C0504D',
      accent3: '#9BBB59',
      accent4: '#8064A2',
      accent5: '#4BACC6',
      accent6: '#F79646',
      hyperLink: '#0000FF',
      followedHyperlink: '#800080',
    }
    if (
      JSON.stringify(colorList) === JSON.stringify(defaultColor) ||
      JSON.stringify(colorList) === JSON.stringify(default2)
    ) {
      return true
    }
    return false
  }

  // 视觉文本替换
  const viewMoldeTextReplace = (
    item: any,
    text: string,
    colorList?: any,
    isContent?: boolean
  ) => {
    if (item?.text?.paragraphs?.length === 0 || !item.text) return
    const arr = item?.text?.paragraphs.find((item: any) => item?.runs?.length)
    if (!arr) {
      return
    }

    const content = text
    const paragraphs = []
    item.text.text = content
    if (content.indexOf('|') > -1) {
      const pList = content.split('|')
      for (let index = 0; index < pList.length; index++) {
        const element = pList[index]
        if (!arr.runs[0]) {
          paragraphs.push([])
          return
        }
        const textStyle = JSON.parse(JSON.stringify(arr.runs[0]))

        const num = index + 1
        if (
          num % 2 > 0 &&
          element.length < pList[index + 1]?.length &&
          isContent &&
          pList[index + 1]?.length < 20
        ) {
          // 是奇数行 并且字数小于偶数行
          textStyle.fontSize = textStyle.fontSize + 2
          textStyle.bold = true
          textStyle.fontColor = {
            type: 'themeColor',
            value: 'accent1',
            transparent: '1',
            brightness: '-30',
          }
        }
        if (textStyle.fontColor && colorList) {
          textStyle.fontColor.templateThemeColors = colorList
        }
        if (defaultColorTheme() && textStyle?.fontColor?.value === 'bg2') {
          textStyle.fontColor.value = 'text1'
        }
        textStyle.text = element
        textStyle.length = element.length
        const runsArr = JSON.parse(JSON.stringify(arr))
        runsArr.runs = [textStyle]
        paragraphs.push(runsArr)
      }
    } else {
      if (arr?.runs?.length) {
        arr.runs = [arr.runs[0]]
        const runs = arr.runs[0]
        runs.text = content
        if (runs.fontColor && colorList) {
          runs.fontColor.templateThemeColors = colorList
        }
        if (defaultColorTheme() && runs?.fontColor?.value === 'bg2') {
          runs.fontColor.value = 'text1'
        }
        runs.len = content.length
        paragraphs.push(arr)
      }
    }
    item.text.paragraphs = paragraphs
  }

  /**
   * 根据id查询需要替换的元素
   * @param slides - 幻灯片数组
   * @param id - 需要匹配的元素ID
   * @returns 匹配到的元素，如果未找到则返回 undefined
   */
  const findElementById = (id: any) => {
    for (const slide of slides.value) {
      for (const element of slide.elements) {
        if (element.id === id) {
          return element
        }
      }
    }
    return undefined
  }
  // iconLinkList 模版内容二次创作 图片 图标 关键词等
  const handleSetElementImg = async (list: any) => {
    const imgLeng = list.filter((item: any) => {
      return item.imgResect
    }).length
    const iconLeng = list.filter((item: any) => {
      return item.iconResect
    }).length

    let imgIndex = 0
    let iconIndex = 0

    list = await Promise.all(
      list.map(async (item: any) => {
        if (item.imgResect) {
          if (!item.src) {
            // 如果总的图片个数小于 当前模版图片数量时 请求接口
            if (imageLinkList.value?.length < imgLeng) {
              const { text, content }: any = filleImageUrlToElement(item, list)
              if (text || content) {
                const t = text || content
                const imgRes = await getImageApi(t, content, content)
                imageLinkList.value = [...imageLinkList.value, ...imgRes]
              } else {
                delete item.imgResect
              }
            }

            if (imageLinkList.value?.length) {
              item.src = imageLinkList.value[imgIndex]
              imgIndex++
            }
          }
          if (item.src) {
            item = await replaceImg(item, item.src)
          } else {
            delete item.imgResect
          }
        }

        if (item.iconResect) {
          if (!item.src || item.src.indexOf('<svg') === -1) {
            if (iconLinkList.value?.length < iconLeng) {
              const { text, content }: any = filleImageUrlToElement(item, list)
              if (text) {
                const keyword = content ? content : text
                const iconRes = await getIconApi(keyword, true)
                if (iconRes?.length) {
                  iconLinkList.value = [...iconLinkList.value, ...iconRes]
                } else {
                  delete item.iconResect
                }
              } else {
                delete item.iconResect
              }
            }
            if (iconLinkList.value?.length) {
              item.src = iconLinkList.value[iconIndex]
              iconIndex++
            }
          }
          if (item.src) {
            try {
              await replaceIcon(item, item.src)
            } catch (error) {
              delete item.iconResect
            }
          }
        }

        if (item?.iskeyword) {
          let resule = ''
          const { text, content }: any = filleImageUrlToElement(item, list)
          if (item.iskeyword === 'childtitle') {
            // 根据标题生成关键词
            resule = await getTextApi(text, 'keyword')
            if (resule?.length && item?.text) {
              const index = Math.floor(Math.random() * resule.length)
              const text = resule[index]
              viewMoldeTextReplace(item, text)
              setTextContent(item, item.type)
            }
          } else if (item.iskeyword === 'describe') {
            // 根据标题生成 简述 内容
            // 当前的tag是 根据group_index 找标题 或者大标题
            resule = await getTextApi(text, 'describe')
            if (resule && item?.text) {
              viewMoldeTextReplace(item, resule)
              setTextContent(item, item.type)
            }
          } else if (item.iskeyword === 'translate') {
            resule = await getTextApi(text, 'translate')
            if (resule && item?.text) {
              viewMoldeTextReplace(item, resule)
              setTextContent(item, item.type)
            }
          }
          delete item.iskeyword
        }
        return item
      })
    )
  }

  // 全文美化的绘制图片
  const handleDrawingImage = async (list: any, imageList: any) => {
    const imgLeng = list.filter((item: any) => {
      return item.imgResect
    }).length

    let imgIndex = 0
    list = await Promise.all(
      list.map(async (item: any) => {
        if (item.imgResect) {
          if (!item.src) {
            // 如果总的图片个数小于 当前模版图片数量时 请求接口
            if (imageList?.length < imgLeng) {
              const { text, content }: any = filleImageUrlToElement(item, list)
              if (text) {
                const imgRes = await getImageApi(text, content, content)
                imageList = [...imageList, ...imgRes]
              } else {
                delete item.imgResect
              }
            }

            if (imageList?.length) {
              item.src = imageList[imgIndex]
              imgIndex++
            }
          }
          if (item.src) {
            try {
              item = await replaceImg(item, item.src)
            } catch (error) {}
          } else {
            delete item.imgResect
          }
        }
        return item
      })
    )
  }

  // 模版内容二次创作
  const handleSetElementAgainst = async (list: any, flage?: any) => {
    const titleData = list.find((item: any) => {
      return item.tags?.custom?.shape_type === 'title'
    })
    const specialPage = ['cover', 'chapter', 'end']
    const catalogTitle = list.filter((item: any) => {
      return (
        item?.tags?.custom?.shape_type === 'item' ||
        item?.tags?.custom?.shape_type === 'catalog'
      )
    })
    list = await Promise.all(
      list.map(async (item: any) => {
        // 翻译
        if (item.isTranslate) {
          if (specialPage.includes(flage)) {
            let content = ''
            let ApiType = 'translate'
            if (!translateList.value?.length) {
              // 是否用翻译
              if (isEnglishValue()) {
                // 走描述
                ApiType = 'describe'
              }
              const text =
                titleData?.type === 'shape'
                  ? retunHtmlText(titleData?.text?.content)
                  : retunHtmlText(titleData?.content)
              content = text
                ? await getTextApi(
                    text,
                    ApiType,
                    ApiType === 'describe' ? 25 : 16
                  )
                : ''
              if (content) {
                translateList.value = [content]
              }
            } else if (translateList.value?.length) {
              content = translateList.value[0]
            }
            if (content && item?.text) {
              viewMoldeTextReplace(item, content)
              setTextContent(item, item.type)
            }
          }
        }
        // 简述
        if (item.isDescribe) {
          if (flage === 'catalog') {
            let resule = ''
            if (!describeList.value?.length) {
              const title = catalogTitle.find(
                (el: any) =>
                  el.tags?.custom?.group_index ===
                  item.tags?.custom?.group_index
              )
              const text =
                title?.type === 'shape'
                  ? retunHtmlText(title?.text?.content)
                  : retunHtmlText(title?.content)
              resule = await getTextApi(text, 'describe')

              if (resule) {
                describeList.value.push({
                  text: resule,
                  index: title?.tags?.custom?.group_index,
                })
              }
            } else if (describeList.value?.length) {
              const title = describeList.value.find(
                (el: any) => el.index === item.tags?.custom?.group_index
              )
              if (title) {
                resule = title.text
              }
            }

            if (resule && item?.text) {
              viewMoldeTextReplace(item, resule)
              setTextContent(item, item.type)
            }
          }
        }

        if (item.isImage) {
          if (item.src) {
            const isNoCover =
              item.tags?.custom?.shape_type === 'logo' ? true : false
            item = await replaceImg(item, item.src, isNoCover)
          }
        }

        if (item.isSchoolBg) {
          item = await replaceSchoolBg(item)
        }
        return item
      })
    )
  }

  const schoolBgList: any = ref([])

  const replaceSchoolBg = async (item: any, text?: any, limit?: any) => {
    if (schoolBgList.value.length) {
      item.src = schoolBgList.value[0]
      item = await replaceImg(item, item.src)
    }
    delete item.isSchoolBg
  }

  // 替换图片地址
  const replaceImg = async (item: any, imgUrl: any, isNoCover?: boolean) => {
    item.src = imgUrl
    item.type = 'image'
    delete item.fill
    delete item.imgResect
    delete item.cellMinHeight
    delete item?.text
    delete item?.content
    delete item?.defaultColor
    delete item?.defaultFontName
    delete item?.lineHeight
    delete item?.autoSize
    delete item?.fillPicture

    if (
      item?.tags?.custom?.shape_type === 'logo' ||
      item?.tags?.custom?.shape_type === 'company'
    ) {
      item.flipH = false
      item.flipV = false
    }
    setImgContent(item)
    try {
      const imgWH: any = await getImageSize(imgUrl)
      if (isNoCover) {
        delete item.svgPath
        delete item.path
        const result = fitImageToBox(
          imgWH.width,
          imgWH.height,
          item.width,
          item.height
        )
        if (result?.width) {
          item.width = result.width
        }

        if (result?.height) {
          item.height = result.height
        }
      } else {
        const newSize = {
          width: imgWH.width,
          height: imgWH.height,
        }
        const newImgSize = imgFitSize(item, newSize)
        const x = (newImgSize.width - item.width) / 2 / newImgSize.width
        const y = (newImgSize.height - item.height) / 2 / newImgSize.height
        const x2 = 1 - x
        const y2 = 1 - y
        if (!item.clip) {
          item.clip = {
            range: [
              [0, 0],
              [100, 100],
            ],
          }
        }
        item.clip.range = [
          [x * 100, y * 100],
          [x2 * 100, y2 * 100],
        ]
      }

      return item
    } catch (error) {
      return item
    }
  }
  // 仅替换图片地址，其余不改动，目前只针对图片填充的形状元素
  const replaceOnlyImg = async (
    item: any,
    imgUrl: any,
    isNoCover?: boolean
  ) => {
    if (item.fillPicture?.src) {
      item.fillPicture.src = imgUrl
    }
    if (
      item?.tags?.custom?.shape_type === 'logo' ||
      item?.tags?.custom?.shape_type === 'company'
    ) {
      item.flipH = false
      item.flipV = false
    }
    setOnlyImgContent(item)
    try {
      const imgWH: any = await getImageSize(imgUrl)
      if (isNoCover) {
        delete item.svgPath
        delete item.path
        const result = fitImageToBox(
          imgWH.width,
          imgWH.height,
          item.width,
          item.height
        )
        if (result?.width) {
          item.width = result.width
        }

        if (result?.height) {
          item.height = result.height
        }
      } else {
        const newSize = {
          width: imgWH.width,
          height: imgWH.height,
        }
        const newImgSize = imgFitSize(item, newSize)
        const x = (newImgSize.width - item.width) / 2 / newImgSize.width
        const y = (newImgSize.height - item.height) / 2 / newImgSize.height
        const x2 = 1 - x
        const y2 = 1 - y
        if (!item.clip) {
          item.clip = {
            range: [
              [0, 0],
              [100, 100],
            ],
          }
        }
        item.clip.range = [
          [x * 100, y * 100],
          [x2 * 100, y2 * 100],
        ]
      }

      return item
    } catch (error) {
      return item
    }
  }
  function fitImageToBox(
    imgWidth: number,
    imgHeight: number,
    boxWidth: number,
    boxHeight: number
  ) {
    const imgRatio = imgWidth / imgHeight
    const boxRatio = boxWidth / boxHeight

    let newWidth: any, newHeight: any

    if (imgRatio > boxRatio) {
      // 图片比盒子更宽 → 按宽度缩放
      newWidth = boxWidth
      newHeight = boxWidth / imgRatio
    } else {
      // 图片比盒子更高 → 按高度缩放
      newHeight = boxHeight
      newWidth = boxHeight * imgRatio
    }

    return { width: parseInt(newWidth), height: parseInt(newHeight) }
  }

  const replaceIcon = async (item: any, imgUrl: any) => {
    try {
      // 先判断一下 imgUrl 是svg 还是url
      // 如果是svg 就不用转化地址
      let isHasSvg = false
      let svgHtml: any = ''
      if (imgUrl.includes('<svg')) {
        svgHtml = imgUrl
        isHasSvg = true
        svgHtml = svgHtml.replace(/\\"/g, '"').replace(/\\n/g, '\n')
      } else {
        svgHtml = await fetchUrl(imgUrl)
      }
      if (!svgHtml) return
      const oldSvg = svgHtml
      const color = item.fill ? initColor(item.fill) : ''

      const shape = returnNewShape(svgHtml, color, true)
      delete item.iconResect
      delete item.imgResect
      delete item.cellMinHeight
      delete item.src

      item.attrArry = shape.attrArry
      item.path = shape.path
      item.svgPath = imgUrl
      if (isHasSvg && item.viewBox) {
        item.viewBox = item.viewBox
        item.attrArry.forEach((attr: any) => {
          if (attr.fill && attr.fill !== 'none') {
            attr.fill = color
          }
          if (attr.stroke && attr.stroke !== 'none') {
            attr.stroke = color
          }
        })
      } else {
        item.viewBox = shape.viewBox || item.viewBox
      }

      if (item.type !== 'shape') {
        item.type = 'shape'
        if (
          !item.attrArry?.length &&
          !item.fill &&
          !item.fillPicture &&
          !item.gradient
        ) {
          // 如果这些填充都没有的情况 就给一个填充色
          item.fill = {
            transparent: 1,
            type: 'themeColor',
            value: 'accent1',
            brightness: 60,
          }
        }
      }

      if (item?.tags?.custom) {
        item.tags.custom.createSvg = oldSvg
      }
    } catch (error) {}
  }
  /**
   * 将 Blob 转换为 File 对象
   * @param {Blob} blob - 要转换的 Blob 对象
   * @param {string} fileName - 文件名（含扩展名，如 "image.png"）
   * @param {Object} [options] - 可选参数（如 MIME 类型）
   * @returns {File} - 返回 File 对象
   */
  function blobToFile(blob: any, fileName: string, options = {}) {
    // 添加默认的 type 属性（从 Blob 继承）
    const fileOptions = {
      type: blob.type,
      ...options,
    }
    return new File([blob], fileName, fileOptions)
  }
  const scaleSvgToImage = async (svgStr: string, scale = 2) => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    container.innerHTML = svgStr

    const svg: any = container.querySelector('svg')

    const originalWidth = parseInt(svg.getAttribute('width'))
    const originalHeight = parseInt(svg.getAttribute('height'))
    svg.setAttribute('width', originalWidth * scale)
    svg.setAttribute('height', originalHeight * scale)

    // Prepare for conversion
    const serializer = new XMLSerializer()
    const svgBlob = new Blob([serializer.serializeToString(svg)], {
      type: 'image/svg+xml;charset=utf-8',
    })
    const svgUrl = URL.createObjectURL(svgBlob)

    // Create canvas for rendering
    const canvas = document.createElement('canvas')
    canvas.width = originalWidth * scale
    canvas.height = originalHeight * scale
    const ctx: any = canvas.getContext('2d')

    // Load the SVG image
    const img = new Image()
    img.src = svgUrl

    // Wait for image to load
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
    })

    // Draw to canvas
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    // 4. 转换为 Blob
    const mimeType = `image/png`
    const blob = await new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), mimeType)
    })

    // 5. 清理临时 URL
    URL.revokeObjectURL(svgUrl)
    document.body.removeChild(container)

    return blob
  }

  const imgFitSize = (box: any, image: any) => {
    const h: any = (box.width / image.width) * image.height
    const w: any = (box.height / image.height) * image.width
    let size: any = {
      width: box.width,
      height: parseInt(h),
    }

    if (size.height >= box.height) return size

    size = {
      width: parseInt(w),
      height: box.height,
    }
    return size
  }
  // 内容 图文 图示转化
  const handleresetElement = (
    fileterTagSlide: any,
    oldElement: any,
    flage: string
  ) => {
    // 28.2.3 优化图文型生成策略
    if (fileterTagSlide.tags.custom.page_type !== flage) {
      if (
        flage === 'multcontent' &&
        fileterTagSlide.tags.custom.page_type === 'content'
      ) {
        // 原数据是图示类型，模版是内容类型，将图示的数据拼接成新的文档内容
        const textData = oldElement.filter(
          (item: any) =>
            (item?.tags?.custom?.shape_type === 'childtitle' ||
              item?.tags?.custom?.shape_type === 'childcontent' ||
              item?.tags?.custom?.shape_type === 'content') &&
            item.text
        )
        let p = ''
        let str = ''

        // textData 排序按照 标题内容
        const sortedArray = reorderArray(textData)
        sortedArray.forEach((item: any) => {
          const content =
            item.type === 'shape' ? item.text.content : item.content
          const textProps = htmlToJsonData(content)
          p += `<p>${textProps.text}</p>`
          str += textProps.text
        })

        const data = {
          id: nanoid(10),
          type: 'text',
          text: {
            text: str,
          },
          isNewSetType: 'content',
          tags: {
            normal: [
              {
                key: 'YOO_CHATSHAPE_TYPE',
                value: 'YOO_CHATSHAPE_CONTENT',
              },
            ],
            custom: {
              shape_type: 'content',
              is_keyword: false,
            },
          },
          content: p,
        }
        oldElement = oldElement.filter((item: any) => {
          return item?.tags?.custom?.shape_type !== 'content'
        })
        oldElement.push(data)
      } else if (
        flage === 'content' &&
        fileterTagSlide.tags.custom.page_type === 'multcontent'
      ) {
        const textData = oldElement.find(
          (item: any) =>
            item?.tags?.custom?.shape_type === 'content' && item.text
        )

        const content =
          textData.type === 'shape' ? textData.text?.content : textData.content
        const textProps = htmlToJsonData(content)
        const paragraphs = textProps.paragraphs.filter(
          (item: any) => item.runs?.length > 0
        )

        const newList: any = []
        paragraphs.forEach((item: any, index: number) => {
          const data = {
            id: nanoid(10),
            type: 'text',
            text: {
              text: '',
            },
            isNewSetType: 'multcontent',
            tags: {
              normal: [
                {
                  key: 'YOO_CHATSHAPE_TYPE',
                  value: 'YOO_CHATSHAPE_CONTENT',
                },
              ],
              custom: {
                group_index: '',
                shape_type: 'content',
                is_keyword: false,
              },
            },
            content: '',
          }
          const strList = item.runs.map((item: any) => item.text)

          const str = strList.join('')
          data.text.text = str
          data.content = `<p>${str}</p>`
          if (index % 2 === 0) {
            data.tags.custom.shape_type = 'childtitle'
            data.tags.custom.group_index = index / 2 + 1 + ''
          } else {
            data.tags.custom.shape_type = 'childcontent'
            data.tags.custom.group_index = (index - 1) / 2 + 1 + ''
          }
          newList.push(data)
        })
        oldElement = [...oldElement, ...newList]
      }
    }

    return oldElement
  }

  const returnLanguage = () => {
    let lang = '中午'

    if (
      getPPTLanguage.value === 'en-US' ||
      (!getPPTLanguage.value && lang === 'en-US')
    ) {
      lang = '英文'
    }
    return lang
  }
  // 文本扩写，翻译，抽取关键词
  const getTextApi = async (text: string, type: string, countNum?: number) => {
    if (!text) return ''
    let result: any = ''
    let langword = returnLanguage()

    if (type === 'translate') {
      if (!window._PROCESS_TRANSLATE) {
        return ''
      }
      const res: any = await translateText({ text: text, to: 'en' })
      result = res.data
    } else if (type === 'keyword') {
      const params = {
        type: 'ThemeKeywords',
        params: {
          theme: text,
          num: countNum || 16,
          langword,
        },
        stream: false,
        version: '2',
      }
      const res: any = await getTextKeyWord(params)
      if (res.code === 200) {
        result = res.data.result
        if (result.indexOf(',') > -1) {
          result = result.split(',')
        } else if (result.indexOf('，') > -1) {
          result = result.split('，')
        }
      }
    } else if (type === 'describe') {
      const params = {
        type: 'ThemeSentence',
        params: {
          theme: text,
          count: countNum || 16,
          language: langword,
        },
        stream: false,
        version: '2',
      }
      const res: any = await getTextKeyWord(params)
      if (res.code === 200) {
        result = res.data.result
      }
    }

    return result
  }

  const filleImageUrlToElement = (item: any, list: any) => {
    let text = '',
      content = ''
    const group_index = item.tags?.custom?.group_index
    // 如果有group_index 是图示 用子标题子内容
    if (group_index) {
      let textData: any = list.find((el: any) => {
        return (
          el.tags.custom?.group_index === group_index &&
          el.tags.custom?.shape_type === 'childtitle'
        )
      })
      const childData: any = list.find((el: any) => {
        return (
          el.tags.custom?.group_index === group_index &&
          el.tags.custom?.shape_type === 'childcontent'
        )
      })
      if (!textData && childData) {
        textData = childData
      }
      if (!textData) {
        textData = list.find((el: any) => {
          return el.tags.custom?.shape_type === 'title'
        })
      }

      text = textData
        ? textData.type === 'shape'
          ? retunHtmlText(textData?.text?.content)
          : retunHtmlText(textData?.content)
        : ''
      content = childData
        ? childData.type === 'shape'
          ? retunHtmlText(childData?.text?.content)
          : retunHtmlText(childData?.content)
        : ''
    }
    // 没有group_index 是图文 用标题 和内容
    else {
      const textData = list.find((el: any) => {
        return el.tags?.custom?.shape_type === 'title'
      })
      const contentData: any = list.find((el: any) => {
        return el.tags?.custom?.shape_type === 'content'
      })
      text =
        textData?.type === 'shape'
          ? retunHtmlText(textData?.text?.content)
          : retunHtmlText(textData?.content)
      content =
        contentData?.type === 'shape'
          ? retunHtmlText(contentData?.text?.content)
          : retunHtmlText(contentData?.content)
    }
    return { text, content }
  }
  const filleImageUrlToElementToContent = (item: any, list: any) => {
    // 打印函数入口参数

    let text = '',
      content = ''

    const groupId = item.groupId
    const group_index = item.tags?.custom?.group_index
    // 如果有groupID 是组合 获取是否为相同组合获取标题或子标题和内容或子内容
    if (groupId) {
      let textData: any = list.find((el: any) => {
        return (
          el.groupId === groupId &&
          (el.tags?.custom?.shape_type === 'title' ||
            el.tags?.custom?.shape_type === 'childtitle')
        )
      })

      const childData: any = list.find((el: any) => {
        return (
          el.groupId === groupId &&
          (el.tags.custom?.shape_type === 'childcontent' ||
            el.tags.custom?.shape_type === 'content')
        )
      })

      if (!textData && childData) {
        textData = childData
      }
      if (!textData) {
        textData = list.find((el: any) => {
          return el.tags.custom?.shape_type === 'title'
        })
      }

      text = textData
        ? textData.type === 'shape'
          ? retunHtmlText(textData?.text?.content || textData?.text?.text)
          : retunHtmlText(textData?.content)
        : ''
      content = childData
        ? childData.type === 'shape'
          ? retunHtmlText(childData?.text?.content || childData?.text?.text)
          : retunHtmlText(childData?.content)
        : ''
    }

    // 如果有group_index 是图示 用子标题子内容
    else if (group_index) {
      let textData: any = list.find((el: any) => {
        return (
          el.tags.custom?.group_index === group_index &&
          el.tags.custom?.shape_type === 'childtitle'
        )
      })

      const childData: any = list.find((el: any) => {
        return (
          el.tags.custom?.group_index === group_index &&
          el.tags.custom?.shape_type === 'childcontent'
        )
      })

      if (!textData && childData) {
        textData = childData
      }
      if (!textData) {
        textData = list.find((el: any) => {
          return el.tags.custom?.shape_type === 'title'
        })
      }

      text = textData
        ? textData.type === 'shape'
          ? retunHtmlText(textData?.text?.content || textData?.text?.text)
          : retunHtmlText(textData?.content)
        : ''
      content = childData
        ? childData.type === 'shape'
          ? retunHtmlText(childData?.text?.content || childData?.text?.text)
          : retunHtmlText(childData?.content)
        : ''
    }
    // 没有group_index也没有goupid 是图文 用标题 和内容
    else {
      const textData = list.find((el: any) => {
        return el.tags?.custom?.shape_type === 'title'
      })

      const contentData: any =
        list.find((el: any) => el.tags?.custom?.shape_type === 'content') || {}

      // 查找所有childcontent类型的元素并合并内容
      const childContentElements = list.filter(
        (el: any) => el.tags?.custom?.shape_type === 'childcontent'
      )

      if (childContentElements.length) {
        contentData.content = [
          ...childContentElements.map(
            (el: any) => el.text?.content || el.text?.text
          ),
        ]
          .filter(Boolean)
          .join('\n')
      }

      text =
        textData?.type === 'shape'
          ? retunHtmlText(textData?.text?.content || textData?.text?.text)
          : retunHtmlText(textData?.content)
      content =
        contentData?.type === 'shape'
          ? retunHtmlText(contentData?.text?.content || contentData?.text?.text)
          : retunHtmlText(contentData?.content)
    }

    // 打印最终返回结果

    return { text, content }
  }

  const requestID = nanoid(10)
  /**
   * 生成图片
   * @param text 文本
   * @param color 颜色
   * @param pptStyle 风格
   * @param catalog 副文本
   * @param second_catalog 章节文本
   * @param limit 图片个数
   * @param w 图片宽度
   * @param h 图片高度
   * @returns 返沪数组图片
   * @param apiType 接口类型
   */
  const getImageApi = async (
    text: string,
    catalog?: string,
    second_catalog?: string,
    apiType?: string,
    pptStyle?: string,
    request_id?: string,
    limit?: number,
    color?: string,
    w?: any,
    h?: any
  ) => {
    const defaultColor = initColor({
      type: 'themeColor', // 类型：themeColor、rgb
      value: 'accent1', // 颜色值，如果是themeColor，则为id；否则为十六进制色值
      transparent: 1, // 不透明度0~1
    })
    let imgList = []
    if (apiType === 'documentToImage') {
      const data = {
        content: text,
        num: limit || 1,
        width: w || 768,
        height: h || 768,
        is_cache: openDrawing.value ? 'False' : 'OnlyCache',
      }
      const imgRes: any = await instructionToImage(data)
      if (imgRes?.data?.img_path) {
        imgList = imgRes.data.img_path
        imgList = imgList.map((item: any) => {
          if (item.indexOf('https://yoo-web-public-bj.bj.bcebos.com') > -1) {
            item = item.replace(
              'https://yoo-web-public-bj.bj.bcebos.com',
              'https://yoo-web-public-bj.cdn.bcebos.com'
            )
          }
          return item
        })
      }
    }
    if (apiType === 'imageToImage') {
      const data = {
        url: text,
      }
      const imgRes: any = await imageToImage(data)
      if (imgRes?.data?.img_path) {
        imgList = imgRes.data.img_path
        imgList = imgList.map((item: any) => {
          if (item.indexOf('https://yoo-web-public-bj.bj.bcebos.com') > -1) {
            item = item.replace(
              'https://yoo-web-public-bj.bj.bcebos.com',
              'https://yoo-web-public-bj.cdn.bcebos.com'
            )
          }
          return item
        })
      }
    }
    if (apiType !== 'imageToImage' && apiType !== 'documentToImage') {
      if (apiType === 'textToImage') {
        openDrawing.value = true
      }
      const data = {
        params: {
          title: text,
          catalog: catalog || text,
          second_catalog: second_catalog || text,
        },
        num: limit || 1,
        width: w || 768,
        height: h || 768,
        resource_style: pptStyle || getPPTStyle.value,
        color: color || defaultColor,
        is_cache: openDrawing.value ? 'False' : 'OnlyCache',
        request_id: request_id || requestID,
      }
      if (openDrawing.value === false) {
        return
      }
      const imgRes: any = await getTextToImg(data)
      if (imgRes?.data?.img_path) {
        imgList = imgRes.data.img_path
        imgList = imgList.map((item: any) => {
          if (item.indexOf('https://yoo-web-public-bj.bj.bcebos.com') > -1) {
            item = item.replace(
              'https://yoo-web-public-bj.bj.bcebos.com',
              'https://yoo-web-public-bj.cdn.bcebos.com'
            )
          }
          return item
        })
      }
    }

    return imgList
  }
  // icon
  const getIconApi = async (
    text: string,
    getOne?: boolean,
    limit?: string,
    type?: string
  ) => {
    const data = {
      type: type || 'singleColor',
      limit: limit || 5,
      keyword: text,
    }
    if (!window._PROCESS_IMAGE) {
      return []
    }
    const res: any = await getTextIcon(data)
    let imgList = []
    if (res.code === 200) {
      imgList = res.data.map((item: any) => item.svg)
      if (getOne) {
        const indexIcon = Math.floor(Math.random() * imgList.length)
        imgList = [imgList[indexIcon]]
      }
    }

    return imgList
  }

  const keyWordList = (list: any) => {
    const arr = list.filter((item: any) => {
      return item.tags.custom.shape_type === 'keyword' && item?.text
    })

    arr.forEach((item: any, index: number) => {
      const temp = item.name.split('-')
      const num =
        item.name.indexOf('关键词') > -1 ? temp[0].slice(3, temp[0].length) : ''
      item.tags.custom.keyType = num ? `key-${num}` : `key-${index + 1}`
      item.tags.custom.content_index = num
        ? typeof num === 'string'
          ? parseInt(num)
          : num
        : ''
      if (item.name.indexOf('翻译') > -1) {
        if (num) {
          item.tags.custom.keyType = `translate`
        }
      }

      if (item.name.indexOf('简述') > -1) {
        if (num) {
          item.tags.custom.keyType = `describe`
        }
      }

      if (item.name.indexOf('子标题') > -1) {
        if (num) {
          const child = temp[1].slice(3, temp[1].length)
          item.tags.custom.keyType = `childTitle`
          item.tags.custom.group_index = child
        }
      }
    })

    return arr
  }

  // 不需要加粗的字体
  const isBoldFont = [
    'PangmenZhengdaoTitleStyle',
    'OptimalTitleCircle',
    'FontSpecialStyle',
    'StationCoolCangYuyangTi-W05',
    'ZiSystemXiMaiTi',
    'AskAboutTheStudyRoom',
    'YoushiBangBangBody',
    'STXingkai',
    'CharacterFanghuaStyle',
  ]
  // 设置字体
  const setDataFontName = (userAddElement: any, newElementList: any) => {
    if (userAddElement?.length) {
      userAddElement.forEach((item: any) => {
        if (fontStyleData && item.text) {
          if (item.defaultFontName) {
            item.defaultFontName = fontStyleData.subTitleFontStyle
          }
          if (item.text.paragraphs) {
            item.text.paragraphs.forEach((p: any) => {
              p.runs.forEach((r: any) => {
                r.fontName = fontStyleData.subTitleFontStyle
                if (isBoldFont.includes(fontStyleData.subTitleFontStyle)) {
                  r.bold = false
                }
              })
            })
          }
        }
      })
    }

    if (newElementList?.length) {
      newElementList.forEach((item: any) => {
        // 内容字体跟随 随机字体
        if (fontStyleData && item.text) {
          const isTitleTag = ['title', 'subtitle']
          item.text.paragraphs.forEach((p: any) => {
            p.runs.forEach((r: any) => {
              if (isTitleTag.includes(item.tags.custom.shape_type)) {
                r.fontName = fontStyleData.titleFontStyle
                if (isBoldFont.includes(fontStyleData.titleFontStyle)) {
                  r.bold = false
                }
              } else {
                r.fontName = fontStyleData.subTitleFontStyle
                if (isBoldFont.includes(fontStyleData.subTitleFontStyle)) {
                  r.bold = false
                }
              }
            })
          })
        }
      })
    }
  }

  function reorderArray(arr: any) {
    const titles = arr.filter(
      (item: any) => item?.tags?.custom?.shape_type === 'childtitle'
    )
    const children = arr.filter(
      (item: any) =>
        item?.tags?.custom?.shape_type === 'childcontent' ||
        item?.tags?.custom?.shape_type === 'content'
    )

    const result: any = []
    const maxLength = Math.max(titles.length, children.length)

    for (let i = 0; i < maxLength; i++) {
      if (i < titles.length) {
        result.push(titles[i])
      }
      if (i < children.length) {
        result.push(children[i])
      }
    }
    return result
  }
  const filterArr = (arr: any, type: any) => {
    let key = []
    if (type === 'chatper') {
      key = ['chatper', 'chapter']
    } else if (type === 'catalog') {
      key = ['catalog', 'catlog']
    } else {
      key = [type]
    }

    let result: any = arr.find((item: any) =>
      key.includes(item.tags.custom.page_type)
    )

    return result
  }

  // 风格字体
  const returnFontStyleData = (style: string) => {
    let titleList: any = [],
      subTitleList: any = []
    switch (style) {
      case '中国风':
        titleList = [
          'LiSu',
          'KaiTi',
          'STKaiti',
          'CharacterFanghuaStyle',
          'HuangLingdongQiJiReproduction',
        ]
        subTitleList = ['KaiTi', 'FangSong']
        break
      case '商务风':
        titleList = [
          'Microsoft Yahei',
          'PangmenZhengdaoTitleStyle',
          'MakerStickersDiamondBody',
          'MiSans-Bold',
          'OptimalTitleCircle',
        ]
        subTitleList = ['Microsoft Yahei', 'YouYuan']
        break

      case '科技风':
        titleList = [
          'Microsoft Yahei',
          'JiangchengRhythmBlack',
          'FontSpecialStyle',
          'MakerStickersDiamondBody',
          'PangmenZhengdaoTitleStyle',
        ]
        subTitleList = ['Microsoft Yahei', 'YouYuan']
        break

      case '极简风':
        titleList = [
          'Microsoft Yahei',
          'JiangchengRhythmBlack',
          'StationCoolCangYuyangTi-W05',
          'YouYuan',
        ]

        subTitleList = ['Microsoft Yahei', 'YouYuan']
        break

      case '小清新':
        titleList = [
          'Microsoft Yahei',
          'StandCoolHappyBody',
          'ZiSystemXiMaiTi',
          'AskAboutTheStudyRoom',
        ]
        subTitleList = ['Microsoft Yahei', 'YouYuan']
        break
      case '可爱卡通':
        titleList = [
          'SmallCheeseBody',
          'YoushiBangBangBody',
          'StandCoolHappyBody',
          'XiaWuManHei',
        ]
        subTitleList = ['Microsoft Yahei', 'YouYuan']
        break
      case '党政':
        titleList = ['KaiTi', 'Songti SC', 'FangSong', 'STXingkai']
        subTitleList = ['KaiTi', 'Songti SC', 'FangSong']
        break

      default:
        break
    }

    if (
      getPPTLanguage.value === 'en-US' ||
      (!getPPTLanguage.value && lang === 'en-US')
    ) {
      titleList = titleList.filter(
        (item: string) => item !== 'StationCoolCangYuyangTi-W05'
      )
    }
    const randomIndex = Math.floor(Math.random() * titleList.length) // 获取随机索引
    const element = titleList[randomIndex] // 获取随机元素
    return {
      titleFontStyle: element,
      subTitleFontStyle:
        subTitleList[Math.floor(Math.random() * subTitleList.length)],
    }
  }

  // 模版颜色
  const elementAddThemeColor = (
    coverSlide: any,
    colorData: any,
    isFirst = false
  ) => {
    const colorsData = JSON.parse(JSON.stringify(colorData))
    if (coverSlide.background?.color) {
      coverSlide.background.color.templateThemeColors = colorsData
    }
    if (coverSlide.background?.gradient) {
      coverSlide.background.gradient.colors.forEach((el: any) => {
        if (el.color.type === 'themeColor') {
          el.color.templateThemeColors = colorsData
        }
      })
    }
    coverSlide.elements.forEach((coverItem: any) => {
      if (
        coverItem.tags?.custom?.shape_type === 'table' ||
        coverItem.tags?.custom?.shape_type === 'chart'
      ) {
        coverItem.templateThemeColors = colorsData
      }
      // 重置颜色
      for (const key in coverItem) {
        const element = coverItem[key]
        if (typeof element === 'object' && !Array.isArray(element)) {
          if (element?.type === 'themeColor') {
            element.templateThemeColors = colorsData
          }

          if (element?.paragraphs?.length && element.text) {
            element.paragraphs = element.paragraphs.map((item: any) => {
              if (item.runs?.length) {
                item.runs = item.runs.map((runsItem: any) => {
                  if (runsItem.fontColor) {
                    runsItem.fontColor.templateThemeColors = colorsData
                  }

                  return runsItem
                })
              }
              return item
            })
          }
          // 边框 阴影的渐变
          if (element?.gradient) {
            element.gradient.colors.forEach((el: any) => {
              if (el.color.type === 'themeColor') {
                el.color.templateThemeColors = colorsData
              }
            })
          }

          // 边框 阴影 的纯色
          if (element?.color) {
            if (element.color.type === 'themeColor') {
              element.color.templateThemeColors = colorsData
            }
          }

          if (key === 'gradient') {
            element.colors.forEach((el: any) => {
              if (el.color.type === 'themeColor') {
                el.color.templateThemeColors = colorsData
              }
            })
          }
        }
        if (key === 'themeColors') {
          element.forEach((item: any) => {
            item.templateThemeColors = colorsData
          })
        }
      }
    })

    return initThemeModelSlids(coverSlide, isFirst)
  }

  const deletThemeColorList = (slide: any) => {
    if (slide.background?.color?.templateThemeColors) {
      delete slide.background.color.templateThemeColors
    }
    if (slide.background?.gradient) {
      slide.background.gradient.colors.forEach((el: any) => {
        if (el?.color?.templateThemeColors) {
          delete el?.color?.templateThemeColors
        }
      })
    }
    slide.elements.forEach((item: any) => {
      if (item.templateThemeColors) {
        delete item.templateThemeColors
      }
      for (const key in item) {
        const element = item[key]
        if (typeof element === 'object' && !Array.isArray(element)) {
          if (element?.templateThemeColors) {
            delete element.templateThemeColors
          }

          if (element?.paragraphs?.length && element.text) {
            element.paragraphs = element.paragraphs.map((item: any) => {
              if (item.runs?.length) {
                item.runs = item.runs.map((runsItem: any) => {
                  if (runsItem?.fontColor?.templateThemeColors) {
                    delete runsItem.fontColor.templateThemeColors
                  }
                  return runsItem
                })
              }
              return item
            })
          }
          // 边框 阴影的渐变
          if (element?.gradient) {
            element.gradient.colors.forEach((el: any) => {
              if (el?.color?.templateThemeColors) {
                delete el?.color?.templateThemeColors
              }
            })
          }

          // 边框 阴影 的纯色
          if (element?.color) {
            if (element?.color?.templateThemeColors) {
              delete element.color.templateThemeColors
            }
          }

          if (key === 'gradient') {
            element.colors.forEach((el: any) => {
              if (el?.color?.templateThemeColors) {
                delete el.color.templateThemeColors
              }
            })
          }
        } else if (Array.isArray(element) && element?.length) {
          element.forEach((el: any) => {
            if (el?.style?.color?.templateThemeColors) {
              delete el.style.color.templateThemeColors
            }
            if (el?.templateThemeColors) {
              delete el?.templateThemeColors
            }
          })
        }
      }
    })

    delete slide?.isShow
    delete slide?.isSetData
    return slide
  }

  // 判断是否有没有标签的元素 方便开启视觉模型
  const hasNoTagsElement = (slide: any) => {
    let resule = false
    if (!slide.tags || !slide?.tags?.custom?.page_type) {
      resule = true
      return resule
    }

    if (slide.elements?.length) {
      resule = slide.elements.some((item: any) => {
        if (
          !item?.tags?.custom ||
          (!item?.tags?.normal?.length && item.text?.text)
        ) {
          return true
        }
      })
    }

    return resule
  }

  // 获取当前章节页面信息 获取页面的 风格数据 主题颜色 页面类型 如果是内容页面的话 处理获取模版数据的参数
  const handleReturnSlideInfo = (slide: any) => {
    // 获取页面类型
    // 获取页面标题
    // 获取ppt风格
    // 获取ppt风格
    let slideType = ''
    const slideTage = slide?.tags?.custom?.page_type
    const slideTitle: any = slide?.elements?.find(
      (ele: any) => ele?.tags?.custom?.shape_type === 'title'
    )
    const pptStyle = getPPTStyle.value
    const pptColor = resourcesData.value?.color_style
    switch (slideTage) {
      case 'cover':
        slideType = '封面'
        break
      case 'catlog':
      case 'catalog':
        slideType = '目录'
        break
      case 'chatper':
      case 'chapter':
        slideType = '章节'
        break
      case 'end':
        slideType = '结束'
        break
      case 'multcontent':
        slideType = '图示型'
        break
      case 'content':
        slideType = '图文型'
        break
      default:
        break
    }
    let pageKey: any = {
      itemNum: 0,
      imgNum: 0,
      textNum: 0,
      speitalElement: 0,
      keyword: '有标题',
    }

    // 如果是内容页面 需要处理一下 获取模版的参数
    if (slideTage === 'content' || slideTage === 'multcontent') {
      const data = returnSingleApiKey(slide, slideTage, slideType)
      pageKey = data.pageKey
      slideType = data.slideType
    }

    return {
      slideType,
      slideTitle: slideTitle?.text?.text || '',
      pptStyle,
      pptColor,
      pageKey,
      slideTage,
    }
  }

  // 返回内容模版参数
  const returnSingleApiKey = (slide: any, type: string, slideType: string) => {
    const elements = JSON.parse(JSON.stringify(slide.elements))
    // 判断是否有关键词
    const hansKeyWord = elements.some(
      (item: any) => item?.tags?.custom?.shape_type === 'keyword'
    )

    const hasTitle = elements.find(
      (item: any) => item?.tags?.custom?.shape_type === 'title'
    )

    const pageKey: any = {}

    if (!hasTitle) {
      pageKey.keyword = '无标题'
    }
    if (hansKeyWord) {
      slideType = '关键词型'
    }
    // 文本内容个数
    const contentList = elements.filter(
      (item: any) => item?.tags?.custom?.shape_type === 'content'
    )
    pageKey.textNum = contentList.length
    if (type === 'multcontent') {
      // 图示组
      const groupKey = [
        'childtitle',
        'childcontent',
        'childimage',
        'childsubtitle',
      ]
      let group = elements.map((el: any) => {
        let index = el?.tags?.custom?.group_index
        if (!groupKey.includes(el?.tags?.custom?.shape_type)) {
          index = ''
        }
        return index ? parseInt(index) : ''
      })
      group = new Set(group.filter((item: any) => item !== 0 && item !== ''))
      pageKey.itemNum = group.size
      pageKey.imgNum = 0
    }

    // 获取图表和表格的个数
    const key = ['chart', 'table']
    let tableAndChart = elements.filter((item: any) =>
      key.includes(item?.tags?.custom?.shape_type)
    )

    if (tableAndChart?.length === 0) {
      tableAndChart = elements.filter((item: any) => key.includes(item?.type))
    }
    pageKey.speitalElement = tableAndChart?.length

    // 获取图片个数
    const imgKey = ['image', 'wordcloud']
    const imgList = elements.filter((item: any) =>
      imgKey.includes(item?.tags?.custom?.shape_type)
    )
    pageKey.imgNum = imgList.length
    if (slideType === '图示型') {
      pageKey.imgNum = 0
    }

    if (slideType === '关键词型' && pageKey.itemNum === 1) {
      pageKey.itemNum = 0
      pageKey.textNum = 1
    }
    return { pageKey, slideType }
  }
  return {
    hasNoTagsElement,
    handleRichPages,
    returnOhterData,
    returnFontStyleData,
    updataSpecialPage,
    getIconApi,
    getImageApi,
    getTextApi,
    filleImageUrlToElement,
    filleImageUrlToElementToContent,
    replaceOneLineText,
    elementAddThemeColor,
    deletThemeColorList,
    applyThemeFull,
    handleViewImgData,
    beautifyThemeApply,
    beautifySingTheme,
    handleReturnSlideInfo,
    returnSingleApiKey,
    slideTextContentToData,
    handleSetElementAgainst,
    handleSetElementImg,
    handleDrawingImage,
    retunHtmlText,
    replaceImg,
    replaceOnlyImg,
    defaultColorTheme,
    replaceIcon,
    viewMoldeTextReplace,
    isEnglishValue,
    openDrawing,
    openResetColor,
    imageLinkList,
    iconLinkList,
    translateList,
    describeList,
    schoolBgList,
    beatufiySlideList,
  }
}
