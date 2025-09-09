import { ref, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { fetchUrl } from '@/utils/common'
import { cancelRequestsRequests, returnCancel } from '@/utils/HttpRequest'
import { nanoid } from 'nanoid'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import message from '@/utils/message'
import { useSlidesStore, useMainStore } from '@/store'
import { datas } from '@/mocks/addPage'
import useThemeFileTemplate from '@/hooks/useThemeFileTemplate'
import {
  getOnePageTemplat,
  getTemplatBackGround,
  getTemplatColors,
  getFullPageTemplat,
  getFullPageTemplatScroll,
  viewThemeModle,
  getOnePageDetail,
  getNewPageTemplat,
  canceltask,
  selectPage,
} from '@/api/careate'
import useCommonApi from './useCommonApi'
import moment from 'moment'
import useInitSlides from '@/hooks/useInitSlides'
import useSaveJSON from '@/hooks/useSaveJSON'
import { emptyList } from '@/mocks/empty'
import { useI18n } from 'vue-i18n'

export default () => {
  const { t } = useI18n()

  const {
    handleRichPages,
    handleSetElementAgainst,
    handleSetElementImg,
    returnOhterData,
    returnFontStyleData,
    updataSpecialPage,
    replaceOneLineText,
    elementAddThemeColor,
    deletThemeColorList,
    handleViewImgData,
    hasNoTagsElement,
    handleReturnSlideInfo,
    applyThemeFull,
    slideTextContentToData,
    retunHtmlText,
    isEnglishValue,
    imageLinkList,
    iconLinkList,
    translateList,
    describeList,
    openDrawing,
  } = useThemeFileTemplate()
  const { initThemeModelSlids, fontSizeResize, setTextContent } =
    useInitSlides()
  const { returnImgUrl } = useSaveJSON()
  const slidesStore = useSlidesStore()
  const mainStore = useMainStore()

  let imgFileType = 'screenshotTmp'

  const lang = localStorage.getItem('lang')

  const {
    slides,
    currentSlide,
    slideIndex,
    themeColorList,
    resourcesData,
    title,
  } = storeToRefs(slidesStore)
  const {
    getPPTStyle,
    useInfo,
    toolbarData,
    sceneData,
    activeElementIdList,
    getPPTLanguage,
    userToken,
  } = storeToRefs(mainStore)
  const { addHistorySnapshot } = useHistorySnapshot()

  // 单页美化
  // 美化全文
  // 颜色
  const chatAiData: any = ref({}) // 移动端
  const singleThemePages: any = ref({
    list: [],
    limit: 6,
    showError: false,
    showLoding: false,
    showNoData: false,
    isEmpty: false,
  })
  // 移动端的单页显示
  const singleNextOne = ref(false)

  const singleKeyData: any = ref({})

  // 全文美化
  const fullThemePages: any = ref({
    pageNum: 1,
    list: [],
    limit: 8,
    showError: false,
    showLoding: false,
    showNoData: false,
  })

  const openSingleViewModle = ref(false) // 开启单页 的深度排版
  const openFullViewModle = ref(false) // 开启全文 的深度排版
  const openColorSingle = ref(true) // 开启全文  颜色单一显示
  const viewRefresh = ref(false) // 视觉模型接口 数据缓存 是否强制刷新
  // 全文 视觉对象
  const allDeepViewData: any = ref(null)
  // 单页美化数据 视觉对象
  const singleDeepData: any = ref(null)
  const cansoleid = ref(nanoid())

  // 单页美化初始化
  const singleInit = (pageLime?: any) => {
    singleThemePages.value = {
      list: [],
      limit: 6,
      showError: false,
      showLoding: true,
      showNoData: false,
      isEmpty: false,
    }
    translateList.value = []
    describeList.value = []
    singleDeepData.value
    if (pageLime) {
      singleThemePages.value.limit = pageLime
    }
    // 没有数据显示空数据
    if (currentSlide.value.elements.length === 0) {
      singleThemePages.value.isEmpty = true
      isEmptyInit()
      // 普通模版
      singleThemePages.value.limit = 2

      getDefualtOneThemeModel()
      return
    }
    // 处理接口查询数据
    singleKeyData.value = handleReturnSlideInfo(currentSlide.value)

    if (hasNoTagsElement(currentSlide.value)) {
      // 说明有没有标签的元素 默认就开启 视觉模型
      openSingleViewModle.value = true
      getViewThemeData().then(() => {
        otherData.value = returnOhterData(
          singleKeyData.value.slideTage,
          currentSlide.value.elements,
          singleDeepData.value
        )

        getDefualtOneThemeModel()
      })
    } else {
      // 判断是否需要 请求视觉模型 当前页面有一个数据自定义数据 都要默认走 数据模型 前提是开启了 视觉模型 的开关
      // 普通模版显示
      otherData.value = returnOhterData(
        singleKeyData.value.slideTage,
        currentSlide.value.elements,
        singleDeepData.value
      )
      getDefualtOneThemeModel()
    }
  }

  // 切换开启 单页视觉模型
  const handleToggleSingView = () => {
    openSingleViewModle.value = !openSingleViewModle.value
    singleThemePages.value.list = []
    singleThemePages.value.showError = false
    singleThemePages.value.showLoding = true
    singleThemePages.value.showNoData = false
    singleDeepData.value = null

    translateList.value = []
    describeList.value = []
    singleKeyData.value = handleReturnSlideInfo(currentSlide.value)
    // 如果是开启的状态 在看一下有没有tag 如果有 还是走默认的tag
    if (openSingleViewModle.value && hasNoTagsElement(currentSlide.value)) {
      getViewThemeData().then(() => {
        otherData.value = returnOhterData(
          singleKeyData.value.slideTage,
          currentSlide.value.elements,
          singleDeepData.value
        )

        getDefualtOneThemeModel()
      })
    } else {
      otherData.value = returnOhterData(
        singleKeyData.value.slideTage,
        currentSlide.value.elements,
        singleDeepData.value
      )

      getDefualtOneThemeModel()
    }
  }

  const changeVisison = (current: any) => {
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
    viewRefresh.value = true
    visionData.value.data = null
    singleThemePages.value.list = []
    singleThemePages.value.showError = false
    singleThemePages.value.showLoding = true
    singleThemePages.value.showNoData = false
    singleThemePages.value.isEmpty = false

    translateList.value = []
    describeList.value = []
    getViewThemeData(name).then(() => {
      otherData.value = returnOhterData(
        singleKeyData.value.slideTage,
        currentSlide.value.elements,
        singleDeepData.value
      )
      viewRefresh.value = false

      getDefualtOneThemeModel()
    })
  }

  // 视觉模型截图使用
  const visionData: any = ref({
    image: '', // 当前页面
    coverImage: '', // 封面页 或者第一页
    data: null, // 解析过的视觉模型数据,
    coverData: null, // 封面页 或者第一页 解析过的视觉模型数据,
  })

  // 视觉模型 api
  const getViewThemeData = async (pageType?: string) => {
    // 视觉模型 先 截图
    // 根据图片 获取 模版数据

    let dom = null
    let imgFileUrl: any = ''
    if (
      !visionData.value.image &&
      visionData.value.coverImage &&
      visionData.value.coverIndex === slideIndex.value
    ) {
      visionData.value.image = visionData.value.coverImage
    }

    if (
      !visionData.value.data &&
      visionData.value.coverData &&
      visionData.value.coverIndex === slideIndex.value
    ) {
      visionData.value.data = visionData.value.coverData
    }
    // 这个图片可以缓存 每次切换就不用重新截图了
    let imageData: any = null
    if (visionData.value.image) {
      imgFileUrl = visionData.value.image
      imageData = {
        url: imgFileUrl,
        fileMd5: visionData.value.imageMD5,
      }
    } else {
      mainStore.setShowCarpSlide({
        show: true,
        isAllSlide: false,
        slideData: currentSlide.value,
      })
      await nextTick(async () => {
        dom = document.getElementById(`save-${currentSlide.value.id}`)
      })

      if (!dom) {
        returnSingError()
        return
      }
      imageData = await returnImgUrl(
        dom,
        slideIndex.value,
        imgFileType,
        'btn-singImage'
      )
      imgFileUrl = imageData?.url
      mainStore.setShowCarpSlide({ show: false, isAllSlide: false })
      visionData.value.image = imgFileUrl ? imgFileUrl : ''
      visionData.value.imageMD5 = imageData?.fileMd5
    }
    if (!imgFileUrl) {
      returnSingError()
      return
    }

    if (visionData.value.data) {
      singleDeepData.value = visionData.value.data
    } else {
      const params: any = {
        total_page: slides.value.length,
        now_page: slideIndex.value + 1,
        image_path: imgFileUrl,
        file_md5: imageData?.fileMd5,
        refresh: viewRefresh.value ? 'True' : 'False',
        task_id: cansoleid.value + 'viewThemeModleSingle',
      }

      if (pageType) {
        params.page_type = pageType
      }

      let res: any = null

      res = params?.image_path
        ? await viewThemeModle(params, 'viewThemeModleSingle')
        : null

      if (res?.code !== 200) {
        returnSingError()
        return
      }
      singleDeepData.value = res.data
    }

    handleViewImgData(currentSlide.value, singleDeepData.value)
    visionData.value.data = singleDeepData.value
    // 处理请求api 接口参数
    singleDeepData.value
    singleKeyData.value.slideType = singleDeepData.value.pageType?.replace(
      '页',
      ''
    )
    switch (singleKeyData.value.slideType) {
      case '封面':
        singleKeyData.value.slideTage = 'cover'
        break
      case '目录':
        singleKeyData.value.slideTage = 'catalog'
        break
      case '章节':
        singleKeyData.value.slideTage = 'chapter'
        break
      case '结束':
        singleKeyData.value.slideTage = 'end'
        break
      default:
        break
    }
    singleKeyData.value.slideTitle = singleDeepData.value.title
    if (singleKeyData.value.slideType === '内容') {
      singleKeyData.value.slideType = '图文型'
      singleKeyData.value.slideTage = 'content'
      let imgList: any = [] // 图片
      let specialList = [] // 表格、图表

      if (
        !singleDeepData.value?.contentTexts?.length &&
        !singleDeepData.value?.groupContent?.length
      ) {
        if (singleDeepData.value?.otherText?.length) {
          singleDeepData.value.contentTexts = singleDeepData.value?.otherText
        }
      }
      if (singleDeepData.value?.images) {
        imgList = singleDeepData.value?.images.filter(
          (item: any) => item.type === 'YOO_CHATSHAPE_IMAGE'
        )
        specialList = singleDeepData.value?.images.filter(
          (item: any) =>
            item.type === 'YOO_CHATSHAPE_CHART' ||
            item.type === 'YOO_CHATSHAPE_TABLE'
        )
      }
      const noContentKey = [
        'titleEnglish',
        'catlogEnglish',
        'catalogue',
        'titleDetail',
        'subTitle',
        'contentTexts',
        'groupCatlog',
      ]
      const haskey = noContentKey.some(
        (item: any) => singleDeepData.value[item]
      )
      if (!haskey) {
        singleKeyData.value.pageKey.keyword = singleDeepData.value.title
          ? '有标题'
          : '无标题'
      }
      singleKeyData.value.pageKey.textNum =
        singleDeepData.value?.contentTexts?.length > 1
          ? 1
          : singleDeepData.value?.contentTexts?.length
      if (singleDeepData.value.groupContent) {
        singleKeyData.value.slideType = '图示型'
        singleKeyData.value.slideTage = 'multcontent'
        singleKeyData.value.pageKey.textNum =
          singleDeepData.value?.contentTexts?.length > 1
            ? 1
            : singleDeepData.value?.contentTexts?.length
        singleKeyData.value.pageKey.itemNum =
          singleDeepData.value?.groupContent[0]?.items.length
      }

      singleKeyData.value.pageKey.imgNum = imgList?.length || 0
      singleKeyData.value.pageKey.speitalElement = specialList?.length || 0
    }
  }

  // 刷新空数据
  const replaceEmptyData = () => {
    singleThemePages.value = {
      list: [],
      limit: 6,
      showError: false,
      showLoding: true,
      showNoData: false,
      isEmpty: false,
    }
    singleThemePages.value.isEmpty = true
    singleThemePages.value.limit = 2
    isEmptyInit()
    // 普通模版

    getDefualtOneThemeModel()
  }

  // 单页没数据 元素数据时 初始化数据
  const emptyData = [
    {
      title: t('emptyBeautify.title1'),
      text: t('emptyBeautify.text1'),
    },
    {
      title: t('emptyBeautify.title2'),
      text: t('emptyBeautify.text2'),
    },
    {
      title: t('emptyBeautify.title3'),
      text: t('emptyBeautify.text3'),
    },
    {
      title: t('emptyBeautify.title4'),
      text: t('emptyBeautify.text4'),
    },
    {
      title: t('emptyBeautify.title5'),
      text: t('emptyBeautify.text5'),
    },
    {
      title: t('emptyBeautify.title6'),
      text: t('emptyBeautify.text6'),
    },
  ]
  function getRandomValueBetween2And6() {
    const values = [2, 3, 4, 5, 6]
    const randomIndex = Math.floor(Math.random() * values.length)
    return values[randomIndex]
  }
  const isEmptyInit = () => {
    singleKeyData.value.slideType = '图示型'
    const leng = getRandomValueBetween2And6()
    const groupData = emptyData.slice(0, leng)
    if (!singleKeyData.value.pageKey) {
      singleKeyData.value.pageKey = {}
    }
    singleKeyData.value.pageKey.itemNum = leng
    singleDeepData.value = {
      pageType: '内容页',
      title: t('emptyBeautify.title'),
      groupContent: [{ items: groupData }],
      isEmptyData: true,
    }
  }
  //
  const returnSingError = () => {
    singleThemePages.value.showError = true
    singleThemePages.value.showLoding = false
    singleThemePages.value.showNoData = false
    singleThemePages.value.list = []
  }

  const themeModleIds: any = ref([])
  const scroll_id = ref('')
  const otherData: any = ref(null)
  // 获取单页模版数据 默认模版数据
  const getDefualtOneThemeModel = async () => {
    try {
      let againstParams: any = reutrnAgainstGetOneThemeParams()
      if (!singleKeyData.value.slideType) {
        returnSingError()
        return
      }

      let list: any = []
      if (againstParams) {
        const params = {
          pptStyle: singleKeyData.value.pptStyle,
          slideType: singleKeyData.value.slideType,
          ...singleKeyData.value.pageKey,
        }
        againstParams = { ...params, ...againstParams }
        if (params.keyword === '无标题' && params.textNum > 0) {
          againstParams.imgNum = params.imgNum + 1
        }
        const [res1, res2] = await Promise.all([
          getSingleApi(params, 'getOnePageTemplat1'),

          getSingleApi(againstParams, 'getOnePageTemplat2'),
        ])
        list = [...res1, ...res2]
      } else {
        const res1 = await getSingleApi(
          {
            pptStyle: singleKeyData.value.pptStyle,
            slideType: singleKeyData.value.slideType,
            ...singleKeyData.value.pageKey,
          },
          'getOnePageTemplat1'
        )
        list = res1
      }
      if (list?.length === 0) {
        returnSingError()
        return
      }
      themeModleIds.value = list.map((item: any) => {
        return item.id
      })

      const topsList = list.filter((item: any) => {
        return item.special === ''
      })
      const themDataInfo = await getOnePageDetails(false, topsList)
      if (!themDataInfo) {
        returnSingError()
        return
      }
      scroll_id.value = themDataInfo.scroll_id
      await handleSingleListData(themDataInfo.list)
    } catch (error) {
      returnSingError()
    }
  }
  const breakFunction = ref(false)
  // 获取二次请求的参数 单页模版数据 为了丰富 模版类型
  const reutrnAgainstGetOneThemeParams = () => {
    // 默认数据可以 图示 图文 可以相互转化
    // 图示 图文 转化规则
    // 1.图示转图文 将当前组数据 拼接成段落
    // 2.图文转图示 判断乱落是否大于1 大于1 将段落分割成组
    // 3.图文转多图 判断是否有图片 没有图片默认2-3张图片个数随机
    if (singleKeyData.value.pageKey.speitalElement > 0) return null
    const newParams: any = {}
    let isAddImg = false
    let isAddItem = false
    let isAddContent = false
    let itemNum: any = 0
    if (singleKeyData.value.slideType === '图示型') {
      const textData = currentSlide.value.elements.filter(
        (item: any) =>
          (item?.tags?.custom?.shape_type === 'childtitle' ||
            item?.tags?.custom?.shape_type === 'childcontent') &&
          item.text
      )
      if (textData?.length || singleDeepData.value) {
        isAddContent = true
      }
    } else if (singleKeyData.value.slideType === '图文型') {
      if (openSingleViewModle.value && singleDeepData.value) {
        // 视觉模型
      } else {
        // 默认模型
      }
      // 判断是否是 多段落内容 转化为图示类型
      // 不是多段落 增加图片
      const textData: any = currentSlide.value.elements.filter(
        (item: any) => item?.tags?.custom?.shape_type === 'content' && item.text
      )
      if (textData?.length === 1) {
        slideTextContentToData(textData[0], textData[0].type, false)
        const paragraphs = textData[0].text.paragraphs
        if (paragraphs?.length > 1) {
          let runs = paragraphs.map((item: any) =>
            item?.runs?.length ? item?.runs : []
          )

          runs = runs.filter((item: any) => item.length > 0)
          if (runs?.length > 1) {
            isAddItem = true
            itemNum = runs.length / 2
            const title: any = []
            runs.forEach((item: any, index: number) => {
              const text = item.map((item: any) => item.text).join('')
              if (index % 2 === 0) {
                title.push(text)
              }
            })
            const hasLangStr = title.some((item: any) => item.length > 20)
            // 如果有标题很长的 不要添加图示类型
            if (hasLangStr) {
              isAddItem = false
              itemNum = 0
              // 可以转成多图
              isAddImg = true
            }
          } else {
            isAddImg = true
          }
        } else {
          isAddImg = true
        }
      } else if (
        openSingleViewModle.value &&
        singleDeepData?.value?.contentTexts?.length
      ) {
        // 视觉模型 有数据
        let pList = []
        if (singleDeepData.value.contentTexts) {
          pList = singleDeepData.value.contentTexts.join('|').split('|')
        } else if (singleDeepData.value.subTitle) {
          pList = singleDeepData.value.contentTexts.join('|').split('|')
        } else if (singleDeepData.value.titleEnglish) {
          pList = singleDeepData.value.titleEnglish.split('|')
        } else if (singleDeepData.value.titleDetail) {
          pList = singleDeepData.value.titleDetail.split('|')
        }
        if (pList?.length > 1) {
          itemNum = pList.length / 2
          isAddItem = true
          const titleLeng = pList
            .filter((item: any, index: number) => index % 2 === 0)
            ?.some((item: any) => item.length > 20)

          // 判断偶数长度是否小于奇数长度
          if (
            !isEvenLengthSmallerThanOdd(pList) ||
            itemNum === 1 ||
            titleLeng
          ) {
            itemNum = 0
            isAddItem = false
            isAddImg = true
          }
        } else {
          isAddImg = true
        }
      }
    }
    if (isAddImg) {
      newParams.textNum = singleKeyData.value.pageKey.textNum
      newParams.imgNum = Math.floor(Math.random() * 4) + 1
    } else if (isAddItem) {
      newParams.slideType = '图示型'
      newParams.itemNum = parseInt(itemNum)
      newParams.textNum = 0
    } else if (isAddContent) {
      newParams.slideType = '图文型'
      newParams.itemNum = 0
      newParams.textNum = 1
      newParams.imgNum = Math.floor(Math.random() * 3) + 1
    } else {
      return null
    }
    return newParams
  }

  // 获取单页模版数据Api
  const getSingleApi = async (paramsData: any, requireId?: string) => {
    const params: any = {
      type: paramsData.slideType,
      limit: 5,
      style: paramsData.pptStyle,
      type_count: paramsData.itemNum || 0,
      picture_count: paramsData.imgNum || 0,
      content_count: paramsData.textNum > 1 ? 1 : paramsData.textNum || 0,
      chart_count: paramsData.speitalElement || 0,
      keyword: paramsData.keyword || '有标题',
    }

    if (
      paramsData.type === '关键词型' &&
      currentSlide.value?.tags?.custom?.page_type === 'content'
    ) {
      params.type_count = 0
    }

    const special = ['封面', '目录', '章节', '结束']
    if (special.includes(params.type)) {
      params.language = '中文'

      if (isEnglishValue()) {
        params.language = '英文'
      }
    }

    if (!params.style && special.includes(params.type)) {
      let text: any = ''
      if (singleDeepData.value?.title) {
        text = singleDeepData.value?.title || singleDeepData.value?.original_res
      } else {
        const element = document.getElementsByClassName('viewport')
        if (element && element[0]) {
          text = element[0]?.textContent
        }
        if (!text) {
          text = title.value
        }
      }
      if (text) {
        const style = await useCommonApi().getAnalyseStyle(text)
        params.style = style
      }
    }

    if (sceneData?.value?.special) {
      params.special = sceneData.value.special
    }
    const res: any = await getOnePageTemplat(params, requireId)

    if (res.code !== 200) return []
    return res.data
  }
  // 获取模版id根据id查具体模版json
  const getOnePageDetails = async (isScroll?: boolean, topsList?: any) => {
    const params: any = {
      limit: singleThemePages.value.limit,
    }
    if (isScroll === true) {
      params.scroll_id = scroll_id.value
    } else {
      params.id =
        sessionStorage.getItem('singThemeIdList') ||
        themeModleIds.value.join(',')
    }
    if (topsList?.length) {
      params.tops = topsList.map((item: any) => item.id).join(',')
    }
    const res: any = await getOnePageDetail(params, 'getOnePageDetail')
    if (res.code !== 200) return null
    return res.data
  }

  // 处理单页数据
  const handleSingleListData = async (list: any, noJsonData?: boolean) => {
    if (singleNextOne.value) {
      singleThemePages.value.list = []
    }
    if (noJsonData) {
      list = JSON.parse(JSON.stringify(list))
      list.map((item: any) => {
        return {
          ...item,
          id: nanoid(5),
        }
      })
    } else {
      const newList: any = []
      Promise.all(
        list.map(async (item: any) => {
          let content: any = ''
          try {
            content = await fetchUrl(item.url)
          } catch (error) {
            console.error('Error fetching data:', error)
          }
          if (!content) return ''
          const jsonData = JSON.parse(content)

          const obj: any = initThemeModelSlids({
            ...jsonData,
            jsonDataId: item.mId,
            style: item.style,
            oldId: jsonData.id,
            newId: nanoid(10),
            url: item.url,
          })
          singleThemePages.value.list.push(obj)
          singleThemePages.value.showLoding = false
          const newObj = await handleBeautyElement(
            item,
            currentSlide.value,
            obj,
            otherData.value,
            singleDeepData.value
          )
          if (newObj) {
            newList.push(newObj)
            const indexList = singleThemePages.value.list.findIndex(
              (item: any) => item.newId === newObj.newId
            )
            singleThemePages.value.list[indexList] = JSON.parse(
              JSON.stringify(newObj)
            )
          }
        })
      ).then(async () => {
        // 这里处理二次 创作 或者 后置处理内容
        for (let index = 0; index < newList.length; index++) {
          const element = newList[index]
          const indexList = singleThemePages.value.list.findIndex(
            (item: any) => item.newId === element.newId
          )
          // 原始数据
          const item = singleThemePages.value.list[indexList]
          if (!item) continue
          const specialPage = ['cover', 'chapter', 'end', 'catalog']
          if (specialPage.includes(singleKeyData.value.slideTage)) {
            await handleSetElementAgainst(
              item.elements,
              singleKeyData.value.slideTage
            )
          } else {
            await handleSetElementImg(item.elements)
          }
          item.showSlide = true
          nextTick(() => {
            fontSizeResize([item])
          })
        }

        singleThemePages.value.list.forEach((item: any) => {
          if (!item.showSlide) {
            item.showSlide = true
          }
        })
      })
    }
  }

  /**
   * 回填数据
   * @param jsonData api 对象数据 有style 等字段
   * @param oldSlide 旧的章节数据
   * @param newSlideObj api 修改后的对象数据
   * @param viewDeepData 深度视觉数据
   * @returns
   */
  const handleBeautyElement = async (
    jsonData: any,
    oldSlide: any,
    newSlideObj: any,
    otherData: any,
    viewDeepData?: any,
    isFullApi?: boolean
  ) => {
    // 开始美化 ---
    let fontStyle = chatAiData.value.style
      ? chatAiData.value.style
      : getPPTStyle.value
    const special = ['cover', 'end', 'chapter', 'catalog']
    if (special.includes(singleKeyData.value.slideTage) || isFullApi) {
      fontStyle = jsonData.style
    }
    const fontStyleData = JSON.parse(
      JSON.stringify(returnFontStyleData(fontStyle))
    )
    const newSlide = await handleRichPages(
      oldSlide,
      newSlideObj,
      fontStyleData,
      viewDeepData,
      otherData
    )

    newSlideObj = {
      ...newSlideObj,
      ...newSlide,
      fontStyleData: fontStyleData,
    }
    return newSlideObj
  }
  // 单页 下一页
  const singleScrollNext = async () => {
    let isInfinite = false
    if (scroll_id.value) {
      const themDataInfo: any = await getOnePageDetails(true)
      if (themDataInfo?.list?.length === 0) {
        isInfinite = true
        return
      }
      scroll_id.value = themDataInfo.scroll_id
      await handleSingleListData(themDataInfo.list, false)
    } else {
      isInfinite = true
    }
    // 无线循环
    if (isInfinite) {
      // 开启测试模版 就不要继续无限循环
      if (
        sessionStorage.getItem('singThemeIdList') ||
        sessionStorage.getItem('disableLoop')
      ) {
        singleThemePages.value.showNoData = true
        return
      }

      const list = []
      const specialPage = ['cover', 'catalog', 'chapter', 'end']
      for (let index = 0; index < singleThemePages.value.limit; index++) {
        const tempList = singleThemePages.value.list.filter(
          (item: any) => item?.style?.indexOf('党政') === -1 || !item.style
        )
        const dataList = tempList[Math.floor(Math.random() * tempList.length)]
        list.push(dataList)
      }
      if (specialPage.includes(singleKeyData.value.slideTage)) {
        const bgImgList = await getBackgroundList()
        list.forEach((item: any) => {
          item.newId = nanoid(10)
          item.isInfinite = true
          item.elements.forEach((el: any) => {
            if (
              el.name === '动态背景' ||
              el?.tags?.custom?.shape_type === 'dnychange'
            ) {
            }
            if (
              (el.name === '动态背景' ||
                el?.tags?.custom?.shape_type === 'dnychange') &&
              el.type === 'image'
            ) {
              const imgUrlData: any =
                bgImgList[Math.floor(Math.random() * bgImgList.length)]
              const h = 'https://'
              el.src = h + imgUrlData.url
            }
          })
        })
      }
      // 匹配替换动态背景图
      if (list?.length) {
        singleThemePages.value.list = [...singleThemePages.value.list, ...list]
      }
    }
  }

  const hasChangebg = (slide: any) => {
    const bgSlideNormal = slide.tags?.normal.find(
      (el: any) =>
        el.key === 'TAG_CHATPAGE_ENABLE_CHANGEBACK' && el.value === 'TRUE'
    )
    let hasbg = null
    if (slide.elements?.length) {
      hasbg = slide.elements.find((item: any) =>
        item.tags?.normal.find(
          (el: any) =>
            el.key === 'TAG_IMAGE_ENABLE_DNYCHANGE' && el.value === 'TRUE'
        )
      )
    }

    return bgSlideNormal && hasbg
  }
  const getBackgroundList = async () => {
    const params = {
      color_style: resourcesData.value?.color_style,
      limit: singleThemePages.value.limit,
    }
    const res: any = await getTemplatBackGround(params)

    return res.code === 200 ? res.data.data : []
  }
  // 应用模版 单页模版 /全文吧
  const handleViewTemplat = (type: string, item: any, tab?: any) => {
    if (type === 'enter') {
      const slide: any = tab === 'fullThemePages' ? item.slide : item
      if (activeElementIdList.value.length > 0) {
        mainStore.setActiveElementIdList([])
      }

      mainStore.setViewTemplate({ show: true, data: slide })
      if (tab === 'fullThemePages' && !openColorSingle.value) {
        mainStore.setIsViewHoverBg(item.page_color)
      }
    } else {
      mainStore.updateViewTemplate({ show: false, data: null })
      mainStore.setIsViewHoverBg('')
    }
  }

  const disableClickBtn = ref(false)
  const appltSingTemplate = async (oldSlide: any, newSlide: any) => {
    if (!oldSlide || disableClickBtn.value) return
    disableClickBtn.value = true

    newSlide = deletThemeColorList(newSlide)
    if (singleThemePages.value.isEmpty) {
      slidesStore.updateSlide({
        background: newSlide.background,
        elements: newSlide.elements,
        tags: newSlide.tags,
      })
      addHistorySnapshot()
      message.success(t('layoutPool.applaySuccess'))
      disableClickBtn.value = false
      singleThemePages.value.isEmpty = false
      return
    }
    // 章节更新时 添加一个同时更改章节页面
    if (oldSlide?.tags?.custom?.page_type === 'chapter') {
      const chapterList = slidesStore.slides.filter((item: any) => {
        return item?.tags?.custom?.page_type === 'chapter'
      })
      const hasCatalog = newSlide.elements.find(
        (el: any) =>
          el.tags?.custom?.shape_type === 'catalog' ||
          el.tags?.custom?.shape_type === 'item'
      )
      let catalogSlide = null
      if (hasCatalog) {
        let content: any = ''
        content = await fetchUrl(newSlide.url)
        const jsonData = JSON.parse(content)
        catalogSlide = initThemeModelSlids({
          ...jsonData,
          style: newSlide.style,
          oldId: jsonData.id,
          newId: nanoid(10),
          url: newSlide.url,
        })
      }

      if (chapterList?.length) {
        chapterList.forEach((item: any) => {
          if (item.id === oldSlide.id) {
            const data: any = {
              background: newSlide.background,
              elements: newSlide.elements,
              tags: newSlide.tags,
            }
            if (newSlide?.chapterNum) {
              data.chapterNum = newSlide.chapterNum
            }
            slidesStore.updateSlide(data)
          } else {
            const copyOld = JSON.parse(JSON.stringify(item))
            let copyNew = JSON.parse(JSON.stringify(newSlide))
            if (hasCatalog) {
              copyNew = JSON.parse(JSON.stringify(catalogSlide))
            }
            updataSpecialPage(copyOld, copyNew, 'chapter')
            const data: any = {
              background: copyOld.background,
              elements: copyOld.elements,
              tags: copyOld.tags,
            }
            if (copyOld?.chapterNum) {
              data.chapterNum = copyOld.chapterNum
            }

            slidesStore.updateSlide(data, item.id)
          }
        })
      }
    } else {
      slidesStore.updateSlide({
        background: newSlide.background,
        elements: newSlide.elements,
        tags: newSlide.tags,
      })
    }

    addHistorySnapshot()
    message.success(t('layoutPool.applaySuccess'))
    disableClickBtn.value = false
  }

  let oldImgList: any = []
  let oldDrawIngImgList: any = []
  const handleToggleDrawing = async () => {
    // 这里取反 是因为 当前方法前重置了开启状态 取反 就是原本的值 然后 如果是false 就是 没有实时绘图的图片数组 防止重复请求
    if (!openDrawing.value) {
      oldDrawIngImgList = JSON.parse(JSON.stringify(imageLinkList.value))
    } else {
      oldImgList = JSON.parse(JSON.stringify(imageLinkList.value))
    }

    imageLinkList.value = []

    if (openDrawing.value) {
      // 开启实时绘图
      if (oldDrawIngImgList?.length) {
        imageLinkList.value = JSON.parse(JSON.stringify(oldDrawIngImgList))
      }
    } else {
      // 关闭实时绘图
      if (oldImgList?.length) {
        imageLinkList.value = JSON.parse(JSON.stringify(oldImgList))
      }
    }
    const imgTags = ['image', 'wordcloud', 'childimage']
    const pageTags = ['content', 'multcontent', 'background']
    singleThemePages.value.list = singleThemePages.value.list.map(
      (item: any) => {
        if (pageTags.includes(item?.tags?.custom?.page_type)) {
          if (item.elements?.length) {
            let count = 0
            item.elements.forEach((el: any) => {
              if (imgTags.includes(el.tags?.custom?.shape_type)) {
                el.imgResect = true
                el.src = ''
                count++
              }
            })
            if (count > 0) {
              item.showSlide = false
            }
          }
        }
        return item
      }
    )
    for (let index = 0; index < singleThemePages.value.list.length; index++) {
      const item = singleThemePages.value.list[index]
      if (!item) continue
      await handleSetElementImg(item.elements)
      item.showSlide = true
    }
  }
  function isEvenLengthSmallerThanOdd(arr: any) {
    if (!Array.isArray(arr) || arr.length <= 1) {
      return false // 非数组或长度不足2时返回false
    }

    let isEven = true // 初始假设是偶数行
    for (let i = 0; i < arr.length; i++) {
      if (typeof arr[i] !== 'string') {
        return false // 数组中有非字符串元素返回false
      }
      if (isEven && arr[i].length >= arr[i - 1]) {
        return false // 偶数行字符串长度大于或等于前一行返回false
      }
      isEven = !isEven // 切换偶数奇数行状态
    }
    return true // 所有条件都符合返回true
  }
  const fullOtherData = ref({})
  const initFullTemplate = async () => {
    fullThemePages.value.list = []
    fullThemePages.value.showError = false
    fullThemePages.value.showLoding = true
    fullThemePages.value.showNoData = false
    translateList.value = []
    describeList.value = []

    // 默认模式 是 tags替换效果
    // 如果有一个章节页面 有新增元素 用视觉模型
    // 视觉模型 取第一个页面 一个页面 如果有tags 用tags替换效果 如果不是封面tag
    const orgainSlideCover = slides.value.find(
      (slide) => slide?.tags?.custom?.page_type === 'cover'
    )
    const firstSlide = slides.value[0]
    if (
      !orgainSlideCover &&
      hasNoTagsElement(firstSlide) &&
      hasNoTageSlide(slides.value)
    ) {
      await getFulleViewPage()
      await getFullTemplate()
    } else {
      if (hasNoTageSlide(slides.value)) {
        openFullViewModle.value = true
      }
      if (orgainSlideCover) {
        fullOtherData.value = returnOhterData(
          singleKeyData.value.slideTage,
          orgainSlideCover?.elements,
          allDeepViewData.value
        )
      }

      getFullTemplate()
    }
  }

  const getThemePageList = () => {
    fullThemePages.value.list = []
    fullThemePages.value.showError = false
    fullThemePages.value.showLoding = true
    fullThemePages.value.showNoData = false
    translateList.value = []
    describeList.value = []
    openColorSingle.value = false
    openFullViewModle.value = false

    // 默认模式 是 tags替换效果
    // 如果有一个章节页面 有新增元素 用视觉模型
    // 视觉模型 取第一个页面 一个页面 如果有tags 用tags替换效果 如果不是封面tag
    const orgainSlideCover = slides.value.find(
      (slide) => slide?.tags?.custom?.page_type === 'cover'
    )
    if (orgainSlideCover) {
      fullOtherData.value = returnOhterData(
        singleKeyData.value.slideTage,
        orgainSlideCover?.elements,
        allDeepViewData.value
      )
    }

    getFullTemplate()
  }

  const handleToggleFullView = async () => {
    allDeepViewData.value = null
    openFullViewModle.value = !openFullViewModle.value
    fullThemePages.value.list = []
    fullThemePages.value.showError = false
    fullThemePages.value.showLoding = true
    fullThemePages.value.showNoData = false
    translateList.value = []
    describeList.value = []

    // 默认模式 是 tags替换效果
    // 如果有一个章节页面 有新增元素 用视觉模型
    // 视觉模型 取第一个页面 一个页面 如果有tags 用tags替换效果 如果不是封面tag
    const orgainSlideCover = slides.value.find(
      (slide) => slide?.tags?.custom?.page_type === 'cover'
    )
    const firstSlide = slides.value[0]
    if (
      !orgainSlideCover &&
      hasNoTagsElement(firstSlide) &&
      hasNoTageSlide(slides.value) &&
      openFullViewModle.value
    ) {
      await getFulleViewPage()
      await getFullTemplate()
    } else {
      if (orgainSlideCover) {
        fullOtherData.value = returnOhterData(
          singleKeyData.value.slideTage,
          orgainSlideCover?.elements,
          allDeepViewData.value
        )
      }

      getFullTemplate()
    }
  }
  // 全文视觉模型 截图 第一个页面
  const getFulleViewPage = async () => {
    try {
      openFullViewModle.value = true
      let coverPage = slides.value.find(
        (item: any) => item?.tags?.custom?.page_type === 'cover'
      )
      let coverIndex = slides.value.findIndex(
        (item: any) => item?.tags?.custom?.page_type === 'cover'
      )
      if (!coverPage) {
        coverPage = slides.value[0]
        coverIndex = 0
      }
      visionData.value.coverIndex = coverIndex

      if (
        coverIndex === slideIndex.value &&
        visionData.value.image &&
        !visionData.value.coverImage
      ) {
        visionData.value.coverImage = visionData.value.image
        visionData.value.coverImageMD5 = visionData.value.imageMD5
      }
      if (
        coverIndex === slideIndex.value &&
        visionData.value.data &&
        !visionData.value.coverData
      ) {
        visionData.value.coverData = visionData.value.data
      }
      let dom = null
      let imgFileUrl: any = ''
      let imageData: any = null

      if (visionData.value.coverImage) {
        imgFileUrl = visionData.value.coverImage
        imageData = {
          url: imgFileUrl,
          fileMd5: visionData.value.coverImageMD5,
        }
      } else {
        mainStore.setShowCarpSlide({
          show: true,
          isAllSlide: false,
          showPageNum: true,
          index: coverIndex,
        })
        await nextTick(async () => {
          dom = document.getElementById(`save-${coverPage.id}`)
        })
        if (!dom) {
          returnError()
          mainStore.setShowCarpSlide({ show: false, isAllSlide: false })
          return
        }
        imageData = await returnImgUrl(
          dom,
          slideIndex.value,
          imgFileType,
          'btn-fullImage'
        )
        imgFileUrl = imageData?.url
        mainStore.setShowCarpSlide({ show: false, isAllSlide: false })
        visionData.value.coverImage = imgFileUrl ? imgFileUrl : ''
        visionData.value.coverImageMD5 = imageData?.fileMd5
      }

      if (!imgFileUrl) {
        returnError()
        return
      }

      if (visionData.value.coverData) {
        allDeepViewData.value = visionData.value.coverData
      } else {
        const params = {
          total_page: slides.value.length,
          now_page: 1,
          image_path: imgFileUrl,
          file_md5: imageData?.fileMd5,
          refresh: viewRefresh.value ? 'True' : 'False',
          task_id: cansoleid.value + 'viewThemeModleFull',
        }

        let res: any = null

        res = params?.image_path
          ? await viewThemeModle(params, 'viewThemeModleFull')
          : null

        if (res?.code !== 200) {
          returnError()
          return
        }
        allDeepViewData.value = res.data
        allDeepViewData.value.slideId = coverPage.id
        visionData.value.coverData = allDeepViewData.value

        visionData.value.coverData.pageType = res.data.pageType
      }
    } catch (error) {
      returnError()
    }
  }

  const main_id = ref('')
  const privateClose = ref(false)
  const jsonDataApiTimer: any = ref(null)
  const jsonDataTime = ref(0)
  const initJsonTime = () => {
    clearInterval(jsonDataApiTimer.value)
    jsonDataTime.value = 0
    jsonDataApiTimer.value = setInterval(() => {
      jsonDataTime.value += 1000
    }, 1000)
  }

  const hasNoTageSlide = (slides: any) => {
    const hasNoTageSlide = slides.find((item: any) => {
      return (
        !item?.tags?.custom?.page_type ||
        !item?.elements.length ||
        item?.elements.some((el: any) => !el?.tags)
      )
    })
    return hasNoTageSlide ? true : false
  }

  const FullApiChannle = ref('')
  const isOnlyUse = ref(false)
  /**
   *  全文美化
   * @param pageLimit 查询条数
   * @param findFirstId 查询模版第一个要显示的模版id
   * @param searchId 根据id查询具体摸一个模版数据
   */
  const getFullTemplate = async (
    pageLimit?: number,
    findFirstId?: any,
    searchId?: any,
    addinData?: any
  ) => {
    fullThemePages.value.showLoding = true
    const params: any = {
      limit: pageLimit || fullThemePages.value.limit,
      style: chatAiData.value.style || getPPTStyle.value,
    }
    if (openColorSingle.value && resourcesData.value?.color_style) {
      params.color_style = resourcesData.value?.color_style
    }

    // 移动端美化的颜色
    if (chatAiData.value.color) {
      params.color_style = chatAiData.value.color
    }

    if (chatAiData.value.special || sceneData?.value?.special) {
      params.special = chatAiData.value.special || sceneData?.value?.special
    }

    if (params.special === '党政风') {
      params.special = ''
    }
    // 查询的id 放在第一个显示
    if (findFirstId || sessionStorage.getItem('findFirstId')) {
      params['top_ids'] = sessionStorage.getItem('findFirstId')
        ? sessionStorage.getItem('findFirstId')
        : findFirstId
    }

    if (pageLimit) {
      fullThemePages.value.limit = pageLimit
    }

    if (searchId) {
      params.id = searchId
    }

    if (
      (slides.value?.length === 0 ||
        (slides.value?.length === 1 &&
          currentSlide.value?.elements?.length === 0)) &&
      !isOnlyUse.value
    ) {
      returnError()
      return
    }

    if (!params.style && !sessionStorage.getItem('ThemeId')) {
      let text = ''
      if (allDeepViewData.value?.title) {
        text = allDeepViewData.value?.title
        const datas = allDeepViewData.value
        if (datas?.title) {
          text = datas?.title
        }
        if (datas?.subTitle) {
          text += datas?.subTitle.join(',')
        }
        if (datas?.contentTexts) {
          text += datas?.contentTexts.join(',')
        }
        if (datas?.otherText) {
          text += datas?.otherText.join(',')
        }
      } else {
        const orgainSlideCover = slides.value.find(
          (slide) => slide?.tags?.custom?.page_type === 'cover'
        )
        const textData: any = orgainSlideCover?.elements.find(
          (el: any) => el?.tags?.custom?.shape_type === 'title'
        )
        text =
          textData?.type === 'shape'
            ? retunHtmlText(textData?.text?.content)
            : retunHtmlText(textData?.content)
      }
      if (text) {
        const style = await useCommonApi().getAnalyseStyle(text)
        if (style) {
          params.style = style
          chatAiData.value.style = style
          chatAiData.value.scrollStyle = style
        }
      }
    }

    if (FullApiChannle.value === 'iframe') {
      if (params.style.indexOf(',') === -1) {
        // 单个风格 在chat对话中查询模版时 增加额外的判断
        const styleList = ['商务风', '极简风', '科技风']
        if (styleList.includes(params.style)) {
          const newStyle = styleList.filter((item) => item !== params.style)
          const randomNum = Math.floor(Math.random() * 2) + 1
          if (randomNum === 1) {
            const newVaule =
              newStyle[Math.floor(Math.random() * newStyle.length)]
            params.style = params.style + ',' + newVaule
          } else {
            params.style = params.style + ',' + newStyle.join(',')
          }
        }
      }
    }

    // 用来测试模版数据
    if (sessionStorage.getItem('ThemeId')) {
      params.id = sessionStorage.getItem('ThemeId')
      params.order = 'commend'
      delete params.limit
      delete params.style
      delete params.color_style
    }

    params.language = '中文'
    // 这个优先 页面语言
    if (chatAiData.value.language === 'en-US' || isEnglishValue()) {
      params.language = '英文'
      delete params.color_style
    }

    const res: any = await getFullPageTemplat(params, 'getFullPageTemplat')
    if (res.code !== 200 || res.data.length === 0) {
      returnError()
      if (res.code === 10003) {
        message.info(res.msg || t('login.error'))
      }
      return
    }
    //  这个是按照页数查对应的数据 不满足条数时 在调用一次接口补全条数
    if (!params.id && !addinData) {
      params.limit = fullThemePages.value.limit - res.data.length
      if (params.limit > 0) {
        if (!params.special) {
          delete params.style
        } else {
          delete params.special
        }
        const res2: any = await getFullPageTemplat(params, 'getFullPageTemplat')
        if (res2.data?.length) {
          res.data = res.data.concat(res2.data)
        }
      }
    }
    // 渲染单页模版的时候需要 要来控制loading效果
    fullThemePages.value.countNum = res.data.length
    if (addinData && res.data?.length) {
      res.data = res.data.map((item: any) => {
        if (!item.id) {
          item.id = nanoid()
        }
        if (location.protocol === 'https:') {
          item.json = item.json.replace('http://', 'https://')
        }
        return item
      })
    }

    await themePagelist(res.data, findFirstId)
  }
  const returnError = () => {
    fullThemePages.value.list = []
    fullThemePages.value.showLoding = false
    fullThemePages.value.showNoData = false
    fullThemePages.value.showError = true
  }

  const ishandleFall = ref(false)
  const colorsStyleList: any = ref([]) // 全文美化 颜色主题
  // 全文美化 处理数据json
  const themePagelist = async (listData: any, findFirstId?: string) => {
    ishandleFall.value = false
    const newList: any = []
    Promise.all(
      listData.map(async (item: any, index: number) => {
        let content: any = ''
        if (!item.slide) {
          try {
            content = await fetchUrl(item.json)
          } catch (error) {
            console.error('Error fetching data:', error)
          }
          if (!content) return ''
        }
        item.newId = nanoid(10)
        const jsonData = item.slide ? item.slide : JSON.parse(content)

        // 主题颜色
        if (!item.isInfinite) {
          item.themeColorData = jsonData?.presentation?.docTheme?.themeColors
        }

        if (item?.isFrome === 'addin' && item?.colorList?.length) {
          // 插件渲染模版需要用 自己的主题色colorList
          const colors = JSON.parse(JSON.stringify(item.colorList))
          const colorObj: any = {}
          const key = [
            'bg1',
            'text1',
            'bg2',
            'text2',
            'accent1',
            'accent2',
            'accent3',
            'accent4',
            'accent5',
            'accent6',
            'hyperLink',
            'followedHyperlink',
          ]
          colors.forEach((item: any, index: number) => {
            colorObj[key[index]] = item
          })
          item.themeColorData = JSON.parse(JSON.stringify(colorObj))
        }

        // 原本的主题色
        item.orgainColor = item.isInfinite
          ? item.orgainColor
          : JSON.parse(JSON.stringify(item.themeColorData))
        item.page_color_old = item.page_color
        item.color_style_old = item.color_style

        // 如果开启了单一颜色 模版的 颜色都要跟随 全局的主题色

        if (openColorSingle.value) {
          item.themeColorData = themeColorList?.value
        }
        // 如果没有开启单一颜色 模版颜色就是 模版主题色
        else {
          // 这里注意 后台的颜色主题 是 bg1 text1 bg2 text2 accent1 。。。 对应的是颜色数组位置
          // 滚动加载会要无线循环方案：更换主题色 和 背景图
          if (colorsStyleList.value.length && colorsStyleList.value[index]) {
            let tempColor = colorsStyleList.value[index].colors // 颜色数组 字符串效果
            if (colorsStyleList.value[index].bg_color) {
              item.page_color = colorsStyleList.value[index].bg_color
            }
            if (tempColor) {
              tempColor = JSON.parse(tempColor)
              const colorObj: any = {}
              const key = [
                'bg1',
                'text1',
                'bg2',
                'text2',
                'accent1',
                'accent2',
                'accent3',
                'accent4',
                'accent5',
                'accent6',
                'hyperLink',
                'followedHyperlink',
              ]
              tempColor.forEach((item: any, index: number) => {
                colorObj[key[index]] = item
              })
              item.themeColorData = JSON.parse(JSON.stringify(colorObj))
            }
          }
        }

        item.colorList = []
        for (const key in item.themeColorData) {
          const element = item.themeColorData[key]
          item.colorList.push(element)
        }
        let coverSlide = item.isInfinite
          ? item.slide
          : jsonData.slides.find(
              (item: any) => item.tags.custom?.page_type === 'cover'
            )
        if (!coverSlide) {
          coverSlide = jsonData.slides[0]
        }
        // 重置颜色
        item.slide = elementAddThemeColor(coverSlide, item.themeColorData)
        item.slide.id = nanoid(10)

        const sameSlide = fullThemePages.value.list.find(
          (el: any) => el.id === item.id && !item.isInfinite
        )

        if (!sameSlide) {
          fullThemePages.value.list.push(item)
          fullThemePages.value.showLoding = false
          const orgainSlideCover = slides.value.find(
            (slide) => slide?.tags?.custom?.page_type === 'cover'
          )
          // tag 填充文本
          if (
            orgainSlideCover ||
            (allDeepViewData.value &&
              allDeepViewData.value?.pageType === '封面页')
          ) {
            const firstSlide = slides.value[0]
            const slide = orgainSlideCover ? orgainSlideCover : firstSlide

            if (allDeepViewData.value) {
              handleViewImgData(slide, allDeepViewData.value)
            }
            const newObj = await handleBeautyElement(
              item,
              slide,
              item.slide,
              fullOtherData.value,
              allDeepViewData.value,
              true
            )
            newObj.newId = item.newId
            const indexList = fullThemePages.value.list.findIndex(
              (item: any) => item.newId === newObj.newId
            )

            fullThemePages.value.list[indexList].fontStyleData = JSON.parse(
              JSON.stringify(newObj.fontStyleData)
            )

            const newSlide = JSON.parse(JSON.stringify(newObj))
            delete newSlide.fontStyleData
            delete newSlide.newId

            fullThemePages.value.list[indexList].slide = JSON.parse(
              JSON.stringify(newSlide)
            )
            newList.push(fullThemePages.value.list[indexList])
          }
          // 没有封面页数据
          else {
            // 将数据都清空
            const key = [
              'title',
              'end',
              'thisnks',
              'subtitle',
              'num',
              'content',
              'logo',
              'company',
            ]
            item.slide.elements.forEach((el: any) => {
              if (key.includes(el?.tags?.custom?.shape_type)) {
                el.isDelete = true
              }
              if (el?.tags?.custom?.shape_type === 'author') {
                replaceOneLineText(useInfo?.value?.nickname, el)
              }

              if (el?.tags?.custom?.shape_type === 'date') {
                const date = moment(Date.now()).format('YYYY.MM.DD')
                replaceOneLineText(date, el)
              }
            })

            item.slide.elements = item.slide.elements.filter((el: any) => {
              return !el.isDelete
            })
            newList.push(item)
          }
        }
      })
    ).then(async () => {
      if (!fullThemePages.value.list?.length) {
        returnError()
        return
      }
      // 这里处理二次 创作 或者 后置处理内容
      for (let index = 0; index < newList.length; index++) {
        const element = newList[index]
        const indexList = fullThemePages.value.list.findIndex(
          (item: any) => item.newId === element.newId
        )
        // 原始数据
        const item = fullThemePages.value.list[indexList]
        if (!item) continue
        const tags = item.slide?.tags?.custom?.page_type
        await handleSetElementAgainst(item.slide.elements, tags)

        item.showSlide = true
        nextTick(() => {
          fontSizeResize([item.slide])
        })
      }
      if (findFirstId) {
        const findFrist = fullThemePages.value.list.find(
          (item: any) => item.id === findFirstId && !item.isInfinite
        )
        fullThemePages.value.list = fullThemePages.value.list.filter(
          (item: any) => item.id !== findFirstId
        )

        fullThemePages.value.list.unshift(findFrist)
      }

      fullThemePages.value.list.forEach((item: any) => {
        if (!item.showSlide) {
          item.showSlide = true
        }
      })
      ishandleFall.value = true
    })
  }

  // 切换单一主体色
  const handleCheckFullSingColor = async () => {
    openColorSingle.value = !openColorSingle.value
    fullThemePages.value.list = fullThemePages.value.list.map((item: any) => {
      if (openColorSingle.value) {
        // 开启单一颜色
        item.themeColorData = themeColorList?.value
      } else {
        // 关闭单一颜色 用全文美化的 颜色
        item.themeColorData = item.orgainColor
      }
      item.colorList = []
      for (const key in item.themeColorData) {
        const element = item.themeColorData[key]
        item.colorList.push(element)
      }
      item.slide = elementAddThemeColor(item.slide, item.themeColorData)
      return item
    })
  }

  const handleCheckFullColor = async (color: string) => {
    if (!color) {
      openColorSingle.value = false
      fullThemePages.value.list = fullThemePages.value.list.map(
        (item: any, index: number) => {
          item.themeColorData = JSON.parse(JSON.stringify(item.orgainColor))
          if (index === 0) {
            slidesStore.setThemeColorList(item.themeColorData)
          }

          item.page_color = item.page_color_old
          item.color_style = item.color_style_old
          item.slide = elementAddThemeColor(item.slide, item.themeColorData)
          return item
        }
      )
    } else {
      const colorRes: any = await getColorsStyle(16, color)
      if (!colorRes?.length) return
      fullThemePages.value.list = fullThemePages.value.list.map(
        (item: any, index: number) => {
          const randomIndex = Math.floor(Math.random() * colorRes.length)
          const colorData = colorRes[randomIndex]
          colorData.colorList = colorData.colors
            ? JSON.parse(colorData.colors)
            : []
          if (colorData.colorList?.length) {
            const colorObj: any = {}
            const key = [
              'bg1',
              'text1',
              'bg2',
              'text2',
              'accent1',
              'accent2',
              'accent3',
              'accent4',
              'accent5',
              'accent6',
              'hyperLink',
              'followedHyperlink',
            ]
            colorData.colorList.forEach((item: any, index: number) => {
              colorObj[key[index]] = item
            })
            colorData.themeColorData = JSON.parse(JSON.stringify(colorObj))
          }
          if (index === 0) {
            slidesStore.setThemeColorList(colorData.themeColorData)
          }

          item.themeColorData = colorData.themeColorData
          item.colorList = colorData.colorList
          item.page_color = colorData.bg_color
          item.color_style = colorData.color_style
          item.slide = elementAddThemeColor(item.slide, item.themeColorData)
          return item
        }
      )
    }
  }

  const themeScrollId = ref('')
  const themeScrollApi = async () => {
    const params: any = {
      page: fullThemePages.value.pageNum,
      limit: fullThemePages.value.limit,
      scrollId: themeScrollId.value,
    }
    // 排除在外的style 多个用，hao  分割
    if (chatAiData.value.excludedStyle) {
      params.excludedStyle = chatAiData.value.excludedStyle
    }

    if (openColorSingle.value && resourcesData.value?.color_style) {
      params.color_style = resourcesData.value?.color_style
    }

    const style = chatAiData.value.style || getPPTStyle.value

    if (chatAiData.value.scrollStyle) {
      params.style = chatAiData.value.scrollStyle
      params.color_style = ''
      //  添加颜色 可能会导致查不到数据
    }

    params.language = '中文'
    if (localStorage.getItem('lang') === 'en-US') {
      params.language = '英文'
    }
    const res: any = await getFullPageTemplatScroll(params)
    if (res?.code !== 200) {
      return null
    }
    return res.data
  }
  const fullScrollNext = async () => {
    let list = []
    const scrollData = await themeScrollApi()
    fullThemePages.value.pageNum++
    themeScrollId.value = scrollData?.scrollId
    if (scrollData?.list?.length) {
      list = scrollData?.list || []
    } else {
      // 无限循环
      if (sessionStorage.getItem('disableLoop')) return
      let tempPageCopy = JSON.parse(JSON.stringify(fullThemePages.value.list))
      tempPageCopy = tempPageCopy.slice(0, tempPageCopy?.length - 10)
      for (let index = 0; index < fullThemePages.value.limit; index++) {
        const dataList =
          tempPageCopy[Math.floor(Math.random() * tempPageCopy.length)]

        if (dataList) {
          dataList.isInfinite = true
          list.push(dataList)
        }
      }

      if (!openColorSingle.value) {
        colorsStyleList.value = await getColorsStyle()
        if (colorsStyleList.value?.length) {
          colorsStyleList.value = shuffleArray(colorsStyleList.value)
        }
      }
    }
    await themePagelist(list)
  }

  // 处理自定义模版数据格式 根据主题数据一样
  const setCustomeTheme = async (
    jsonUrl: string,
    colorList: any,
    slide: any
  ) => {
    let content: any = await fetchUrl(jsonUrl)
    if (!content) return null

    const jsonData: any = JSON.parse(content)
    const docTheme = jsonData?.presentation?.docTheme
    const data: any = {
      id: nanoid(10) + 'custome',
      newId: nanoid(10),
      color_style: docTheme?.color,
      color_style_old: docTheme?.color,
      json: jsonUrl,
      page_color_old: docTheme.themeColors.accent1,
      page_color: docTheme.themeColors.accent1,
      include_bg: 0, // 是否有背景图 0-无 1-有 自定义的 都默认设置没有
      style: '',
      orgainColor: docTheme.themeColors,
      themeColorData: docTheme.themeColors,
      colorList: colorList || [],
    }
    if (openColorSingle.value) {
      data.themeColorData = themeColorList?.value
    }
    const coverSlide = jsonData.slides.find(
      (item: any) => item.tags.custom?.page_type === 'cover'
    )

    data.slide = elementAddThemeColor(coverSlide, data.themeColorData)
    const newObj = await handleBeautyElement(
      data,
      slide,
      data.slide,
      fullOtherData.value,
      allDeepViewData.value,
      true
    )
    data.slide = newObj
    return data
  }
  // 主题颜色
  const getColorsStyle = async (limite?: number, color?: string) => {
    const params: any = {
      limit: limite || fullThemePages.value?.limit,
      color_style: color,
    }
    const res: any = await getTemplatColors(params)
    const data = res.code === 200 ? res.data.data : []
    return data
  }
  const shuffleArray = (array: any[]): void => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }

  const activeTheme = ref('')
  // 应用主题
  const handleApplayThemes = async (item: any, index: any) => {
    mainStore.setIsViewHoverBg('')
    mainStore.setBeautifyFirstView({
      url: visionData?.value?.coverImage,
      id: slides.value[0].id,
      viewData: allDeepViewData.value,
      list: fullThemePages.value.list,
      scrollId: themeScrollId.value,
      openColorSingle: openColorSingle.value,
      openDrawing: openDrawing.value,
      slidesData: item,
      type: 'byBeautifyBtn',
    })
    mainStore.setShowBeautifyPage(true)
    mainStore.setOpenNoTokenToobal(false)
    mainStore.setShowToolbar(false)
    sessionStorage.setItem(
      'fullTheme',
      JSON.stringify({ id: item.id, json: item.json })
    )
  }

  // 主题设计的应用 只是应用模版
  const handleApplayThemesBase = async (item: any) => {
    activeTheme.value = item.id
    if (disableClickBtn.value) return
    disableClickBtn.value = true
    try {
      await applyThemeFull(item, allDeepViewData.value, openColorSingle.value)
      disableClickBtn.value = false
    } catch (error) {
      disableClickBtn.value = false
    }
    selectPage({
      page: slidesStore.slides.length,
    })
  }

  const initAddTheme = () => {
    imageLinkList.value = []
    iconLinkList.value = []
    singleThemePages.value = {
      list: [],
      limit: 6,
      showError: false,
      showLoding: true,
      showNoData: false,
      isEmpty: false,
    }
    fullThemePages.value = {
      pageNum: 1,
      list: [],
      limit: 6,
      showError: false,
      showLoding: false,
      showNoData: false,
    }

    openSingleViewModle.value = false
    openFullViewModle.value = false
    openColorSingle.value = true
    allDeepViewData.value = null
    singleDeepData.value = null
    themeModleIds.value = []
    scroll_id.value = ''
    singleThemePages.value.list = initThemeModelSlids([...emptyList])
    getAddTheme()
  }

  const getAddTheme = async () => {
    try {
      let res: any
      if (!userToken.value) {
        res = datas
      } else {
        const params = {
          style: getPPTStyle.value,
          limit: 5,
        }
        res = await getNewPageTemplat(params)
      }

      if (res.code === 200) {
        res.data.map(async (item: any, index: number) => {
          let content: any = ''
          try {
            content = await fetchUrl(item.json)
          } catch (error) {
            console.error('Error fetching data:', error)
          }

          if (!content) return ''
          const jsonData = JSON.parse(content)
          jsonData.slides.forEach((slide: any) => {
            slide.style = item.style
          })
          const slideList = initThemeModelSlids(jsonData.slides)
          singleThemePages.value.showLoding = false
          singleThemePages.value.list = [
            ...slideList,
            ...singleThemePages.value.list,
          ]
        })
      } else {
        returnSingError()
      }
    } catch (error) {
      returnSingError()
    }
  }

  const handleCansole = () => {
    const token = returnCancel()
    const hasCancel = token.find((item: any) => {
      return item === 'viewThemeModleFull' || item === 'viewThemeModleSingle'
    })
    if (hasCancel) {
      let key = cansoleid.value
      if (token?.viewThemeModleFull) {
        key += 'viewThemeModleFull'
      } else {
        key += 'viewThemeModleSingle'
      }
      canceltask({ id: key, task: 'VisionSlide' })
    }
  }
  return {
    singleInit,
    handleViewTemplat,
    singleScrollNext,
    appltSingTemplate,
    handleToggleDrawing,
    initFullTemplate,
    handleApplayThemes,
    fullScrollNext,
    replaceEmptyData,
    handleToggleSingView,
    handleCheckFullSingColor,
    handleCheckFullColor,
    handleToggleFullView,
    getFullTemplate,
    initAddTheme,
    getThemePageList,
    themePagelist,
    handleApplayThemesBase,
    handleCansole,
    cancelRequestsRequests,
    setCustomeTheme,
    jsonDataApiTimer,
    privateClose,
    chatAiData,
    activeTheme,
    singleThemePages,
    fullThemePages,
    disableClickBtn,
    currentSlide,
    mainStore,
    openSingleViewModle,
    openFullViewModle,
    openColorSingle,
    viewRefresh,
    breakFunction,
    slides,
    allDeepViewData,
    themeModleIds,
    toolbarData,
    openDrawing,
    isOnlyUse,
    ishandleFall,
    FullApiChannle,
    singleKeyData,
    changeVisison,
  }
}
