import { storeToRefs } from 'pinia'
import { nextTick, ref } from 'vue'
import {
  useSlidesStore,
  useMainStore,
  useSnapshotStore,
  useChatInfo,
} from '@/store'
import moment from 'moment'

import useInitMarkDown from '@/hooks/useInitMarkDown'
import { isPC, fetchUrl } from '@/utils/common'
import useOrderElement from '@/hooks/useOrderElement'
import message from '@/utils/message'
import useThemeFileTemplate from '@/hooks/useThemeFileTemplate'
import {
  getFullPageTemplat,
  getOnePageTemplat,
  getOnePageDetail,
} from '@/api/careate'
import useCommonApi from './useCommonApi'
import { datas } from '@/mocks/test'
import { emptyList } from '@/mocks/empty'
import useInitSlides from '@/hooks/useInitSlides'
import { nanoid } from 'nanoid'
import useSaveJSON from '@/hooks/useSaveJSON'
import { useI18n } from 'vue-i18n'

export default () => {
  const { t } = useI18n()
  const { moveTopElement } = useOrderElement()

  const { MarkDownContent } = useInitMarkDown()
  const {
    getIconApi,
    getImageApi,
    getTextApi,
    replaceImg,
    replaceIcon,
    viewMoldeTextReplace,
    filleImageUrlToElement,
    openDrawing,
  } = useThemeFileTemplate()
  const { saveJSONData, isSaveData } = useSaveJSON()
  const mainStore = useMainStore()
  const snapshotStore = useSnapshotStore()
  const slidesStore = useSlidesStore()
  const { title, slides, slideIndex } = storeToRefs(slidesStore)
  const { useInfo, useFileId } = storeToRefs(mainStore)
  const {
    initSlids,
    slideDataInit,
    setTextContent,
    fontSizeResize,
    initSingleElement,
    lineHeightNoReplace,
    initOrgainData,
  } = useInitSlides()
  const lang = localStorage.getItem('lang')

  const chatInfoStore = useChatInfo()
  const { pptJsonData } = storeToRefs(chatInfoStore)
  const drawImg = ref('')
  const showLoadingPage = ref(true) // loading 面板显示
  const showPPTTips = ref(false) // 初始化加载时显示的 ppt提示
  const loadingTimeTips = ref('10')
  const isOpenAi = ref(true) // 是否开启 ai 扩写
  const OpenSpeech = ref(false) // 演讲稿
  const jsonDataUrl = ref('')

  const createData: any = ref(null)
  const themeData: any = ref(null)

  const highlightNumbers = (str: any) => {
    return str.split(/(\d+(?:\.\d+)?)([%+]|[百千万亿])?/).filter(Boolean)
  }
  // 初始化 json格式类型数据 如官网的
  const initCreate = async (url: string) => {
    jsonDataUrl.value = url

    sessionStorage.removeItem('createThemeList')

    try {
      slidesStore.setSlides([])
      sessionStorage.removeItem('createThemeList')
      lineHeightNoReplace.value = true
      url = url?.indexOf('http:') > -1 ? url.replace('http:', 'https:') : url
      const jsons: any = await fetchUrl(url)
      createData.value = JSON.parse(jsons)

      themeData.value = createData.value?.template_data || {}
      themeData.value.title = createData.value?.title
      const createImageType = createData.value?.create_image_type
      drawImg.value = createData.value?.image_style
      if (createImageType === '2') {
        openDrawing.value = true
      } else {
        openDrawing.value = false
      }

      // 这里生成 需要考虑 图片是 ai绘制 还是 普通cc0
      // 场景 是通用 还是 课程 金融等
      // 版式风格
      const param: any = {
        style: createData.value?.template_data?.style,
        limit: 1,
        color_style: createData.value?.template_data?.color,
      }

      if (
        !themeData.value?.style &&
        !themeData.value?.jsonUrl &&
        themeData.value?.title
      ) {
        param.style = await useCommonApi().getAnalyseStyle(
          createData.value?.template_data?.title
        )
      }

      param.language = '中文'
      if (localStorage.getItem('lang') === 'en-US') {
        param.language = '英文'
      }

      if (!themeData.value?.jsonUrl) {
        const res: any = await getFullPageTemplat(param, 'getFullPageTemplat')
        if (res.code === 200) {
          themeData.value.color_style = res.data[0].color_style
          themeData.value.style = res.data[0].style
          themeData.value.page_color = res.data[0].page_color
          themeData.value.jsonUrl = res.data[0].json
        }
      }
      // ppt信息 初始化存储
      await pptInfoInit()
      const templateList = returnSlideList()
      normalCreate(templateList)
    } catch (error) {
      errorSilse()
    }
  }
  const newSlide: any = ref([])

  //  ppt信息 初始化存储
  const pptInfoInit = async () => {
    slidesStore.setTitle(themeData.value.title)
    slidesStore.setOldTilte(themeData.value.title)

    if (themeData.value.jsonUrl) {
      const url = themeData.value.jsonUrl + '?v=' + new Date().getTime()
      let content: any = await fetchUrl(url)

      const PPTData: any = JSON.parse(content)
      if (themeData.value.color_style) {
        PPTData.presentation.docTheme.color = themeData.value.color_style
      }
      PPTData.presentation.style = themeData.value.style
      if (themeData.value.themeColorData) {
        PPTData.presentation.docTheme.themeColors =
          themeData.value.themeColorData
      }
      if (PPTData?.presentation) {
        PPTData.presentation.name = title.value
        // 溯源模型 添加对应tag信息
        if (createData.value?.trace_source || createData.value?.enable_net) {
          const sourceKey = {
            key: 'TAG_STREAM_ID',
            value: createData.value?.trace_source_id,
          }
          PPTData.presentation.tags.normal.push(sourceKey)

          // TAG_ENABLE_NET 是否联网
          if (createData.value?.enable_net) {
            PPTData.presentation.tags.normal.push({
              key: 'TAG_ENABLE_NET',
              value: '1',
            })
          }
        }
        if (createData.value?.language) {
          PPTData.presentation.tags.normal.push({
            key: 'LANGUAGE',
            value: createData.value.language,
          })
          PPTData.presentation.language = createData.value.language
        }

        mainStore.setSceneData({
          scene: createData.value?.scene,
          special: createData.value?.template_data?.special,
        })
        PPTData.presentation.themeID = themeData.value.id
        mainStore.setPresentation(PPTData.presentation)
      }
      const w = PPTData?.presentation?.width || 960
      const h = PPTData?.presentation?.height || 540
      slidesStore.setViewportSize(w)
      slidesStore.setViewportRatio(h / w)

      const themeColorList = PPTData?.presentation?.docTheme?.themeColors
      if (themeColorList) {
        slidesStore.setThemeColorList(themeColorList)
      }

      const colorStyle = PPTData?.presentation?.docTheme?.color
      if (colorStyle) {
        slidesStore.updateResourcesData({ color_style: colorStyle })
      }
      // 上传时更改 背景颜色
      if (themeData.value?.page_color) {
        slidesStore.updateResourcesData({
          main_color: themeData.value?.page_color,
        })
      }
      themeData.value.slides = PPTData.slides
    } else {
      themeData.value.slides = []
    }
  }
  const request_id = nanoid(10)

  // 通用生成流程
  const normalCreate = async (
    templateList: any,
    isCreateSingle?: boolean,
    slidesIndex = 0
  ) => {
    try {
      // 这里 要将 多少页 算出来
      showLoadingPage.value = false
      showPPTTips.value = false
      if (!templateList?.length) return
      let contentBgPage = null

      if (!isCreateSingle) {
        mainStore.setShowLoadingMarks(true)
        mainStore.setInitDataTotal(templateList.length)
        const bgList = themeData.value.slides.filter(
          (ele: any) =>
            ele.tags?.custom?.page_type === 'background' ||
            ele.tags?.custom?.page_type === 'custom'
        )
        if (bgList.length) {
          const randomIndex = Math.floor(Math.random() * bgList.length)
          contentBgPage = bgList[randomIndex] // 背景模版
        }
      }

      const baseIndex = isCreateSingle ? slidesIndex + 1 : 0

      for (let index = 0; index < templateList.length; index++) {
        const item = templateList[index]
        let newSlide = null
        let elements = []
        const defaultSlide = JSON.parse(JSON.stringify(emptyList[0]))
        defaultSlide.tags = {
          custom: {
            page_type: item.type,
          },
        }
        defaultSlide.id = nanoid(10)
        slidesStore.addSlide(defaultSlide)
        slidesStore.updateSlideIndex(baseIndex + index)
        let showLoadingType = item.type
        if (item.table?.length) {
          showLoadingType = 'table'
        }
        let loadingPageType = 1
        if (
          showLoadingType === 'cover' ||
          showLoadingType === 'end' ||
          showLoadingType === 'chapter'
        ) {
          loadingPageType = Math.floor(Math.random() * 2) + 1
        } else if (showLoadingType === 'content') {
          loadingPageType = Math.floor(Math.random() * 5) + 1
        }
        mainStore.setCreateLoading({
          showLoading: true,
          showType: showLoadingType,
          loadingType: loadingPageType,
        })

        if (
          item.type === 'cover' ||
          item.type === 'catalog' ||
          item.type === 'end' ||
          item.type === 'chapter'
        ) {
          await delay(200)
          newSlide = await handleSpecialSlide(item, themeData.value.slides)
        } else {
          newSlide = await handleContentSlide(item, contentBgPage)
        }

        const style = isCreateSingle ? '' : themeData.value.style
        if (newSlide) {
          newSlide.id = defaultSlide.id
          const slide = slideDataInit({ slides: [newSlide] }, true, style)[0]
          if (slide.elements.length) {
            elements = JSON.parse(JSON.stringify(slide.elements))

            slide.elements = []
          }

          slide.remark = ''
          slidesStore.updateSlide(slide)
          mainStore.setCreateLoading({
            showLoading: false,
          })

          const countTitme = 500
          let timer: any = 20
          timer =
            countTitme / elements.length > 10
              ? countTitme / elements.length
              : 10
          if (timer > 50) {
            timer = 50
          }
          if (elements?.length) {
            await unitDelay(elements, parseInt(timer), 1)
            fontSizeResize([slides.value[slideIndex.value]])
            if (index < templateList.length - 1) {
              await delay(500)
            }
          }
        }
      }

      const imgKey = ['wordcloud', 'image', 'childimage']
      try {
        await Promise.all(
          slides.value.map(async (slide: any, index: number) => {
            mainStore.setCreateLoading({
              tips: t('create.tips1'),
              noshow: true,
            })
            await Promise.all(
              slide.elements.map(async (element: any) => {
                try {
                  let resule = ''
                  if (element.isdescribe && isOpenAi.value) {
                    if (element.isTitle) {
                      resule = await getTextApi(element.isTitle, 'describe')
                    }
                  }
                  if (element.istranslate && isOpenAi.value) {
                    if (element.isTitle) {
                      resule = await getTextApi(element.isTitle, 'translate')
                    }
                  }
                  if (resule && element?.text) {
                    viewMoldeTextReplace(element, resule)
                    setTextContent(element, element.type)
                    delete element?.isdescribe
                    delete element?.istranslate
                    delete element?.isTitle
                  }
                  if (element.isApi) {
                    const data: any = filleImageUrlToElement(
                      element,
                      slide.elements
                    )
                    if (element.tags?.custom?.shape_type === 'icon') {
                      const keyword = data.content ? data.content : data.text
                      const iconRes = await getIconApi(keyword, true)
                      slidesStore.updateSlideIndex(index)
                      if (iconRes?.length) {
                        await replaceIcon(element, iconRes[0])
                      } else {
                      }
                    } else {
                      if (element.src) {
                        const isNoCover =
                          element.tags?.custom?.shape_type === 'logo'
                            ? true
                            : false
                        element = replaceImg(element, element.src, isNoCover)
                      } else {
                        if (!data.text && !data.content) {
                          data.text = title.value || ''
                        }
                        const imgRes: any = data.text
                          ? await getImageApi(
                              data.text,
                              data.content,
                              data.content,
                              drawImg.value,
                              request_id
                            )
                          : []
                        slidesStore.updateSlideIndex(index)
                        if (imgRes?.length) {
                          element.src = imgRes[0]
                          element = await replaceImg(element, element.src)
                        }
                      }
                    }
                    delete element?.isApi
                    //
                  }
                } catch (error) {}
              })
            )
          })
        ).then(async () => {
          mainStore.setCreateLoading({
            showLoading: false,
          })
          mainStore.setActiveElementIdList([])
          mainStore.setHandleElementId('')
          if (!isCreateSingle) {
            snapshotStore.initSnapshotDatabase()
          }
          // 这个方法后期需要优化
          nextTick(async () => {
            fontSizeResize()
            if (!isCreateSingle) {
              slidesStore.updateSlideIndex(0)
              if (createData.value?.is_import) {
                isSaveData.value.is_import = 'True'
              } else {
                isSaveData.value.is_import = 'False'
              }
            }

            await saveJSONData()
            if (!isCreateSingle) {
              mainStore.setShowLoadingMarks(false)
              message.success(t('create.success'))
              initOrgainData()
            }
          })
          //
        })
      } catch (error) {
        createError()
      }
    } catch (error) {
      createError()
    }
  }

  const createError = () => {
    mainStore.setActiveElementIdList([])
    mainStore.setHandleElementId('')
    snapshotStore.initSnapshotDatabase()
    // 这个方法后期需要优化
    nextTick(async () => {
      fontSizeResize()
      slidesStore.updateSlideIndex(0)
      if (createData.value?.is_import) {
        isSaveData.value.is_import = 'True'
      } else {
        isSaveData.value.is_import = 'False'
      }
      await saveJSONData()
      mainStore.setShowLoadingMarks(false)
      message.error(t('create.error'))
      showLoadingPage.value = false
      showPPTTips.value = false
      initOrgainData()
    })
  }

  const returnSlideList = () => {
    const chatData = createData.value?.chat_file
    // 封面 结束 章节 目录 内容（内容要看到leve 2)
    const themeSlide = themeData.value?.slides || []
    if (!themeSlide?.length) return
    const hasCatalog = themeSlide.some(
      (item: any) => item?.tags?.custom?.page_type === 'catalog'
    )
    const hasChapter = themeSlide.some(
      (item: any) => item?.tags?.custom?.page_type === 'chapter'
    )

    const titleData: any = {
      title: chatData?.title,
      type: 'cover',
      content: [],
    }

    const end: any = {
      title:
        createData.value?.language === 'en-US'
          ? 'Thanks for watching'
          : t('create.endTitle'),
      type: 'end',
      content: [],
    }
    if (createData.value?.thesis_info) {
      titleData.author = createData.value?.thesis_info?.pleader
      titleData.advisor = createData.value?.thesis_info?.advisor
      let logoImg = createData.value?.thesis_info?.logo
      if (logoImg && logoImg.indexOf('http') === -1) {
        logoImg = `https:${logoImg}`
      }
      titleData.logo = logoImg || createData.value?.thesis_info?.school
      end.author = titleData.author
      end.logo = titleData.logo
    }
    let templateList: any = [titleData]

    if (titleData.logo) {
      mainStore.setPresentationItem({
        logo: titleData.logo,
      })
    }

    const catalogData: any = {
      title:
        createData.value?.language === 'en-US'
          ? 'CatalogTitle'
          : t('create.catalogTitle'),
      type: 'catalog',
      content: chatData?.catalogs || [],
    }
    if (hasCatalog) {
      if (titleData.logo) {
        catalogData.logo = titleData.logo
      }
      templateList.push(catalogData)
    }
    if (chatData?.catalogItems) {
      chatData?.catalogItems.forEach((element: any, index: number) => {
        const chapterData: any = {
          title: resectTitle(element.catalog),
          type: 'chapter',
          number: index + 1,
          content: [],
        }
        if (hasChapter) {
          if (titleData.logo) {
            chapterData.logo = titleData.logo
          }
          templateList.push(chapterData)
        }

        const lists = returnChildenList(element, index)
        templateList = [...templateList, ...lists]
      })
    }

    templateList.push(end)
    return templateList
  }

  const returnChildenList = (element: any, index: number) => {
    let list: any = []
    const datas: any = {
      title: resectTitle(element.catalog),
      type: 'content',
      chatperNum: index + 1,
      content: [],
      picture: element.picture,
      table: element?.table || [],
    }
    if (element.catalogItems?.length && element.Level < 3) {
      element.catalogItems.forEach((item: any) => {
        const newDatas: any = JSON.parse(JSON.stringify(datas))
        newDatas.title = resectTitle(item.catalog)
        newDatas.picture = []
        // 二级
        if (item.catalogItems?.length) {
          item.catalogItems.forEach((chidl: any) => {
            newDatas.content.push({
              title: resectTitle(chidl.catalog),
              content: chidl.content,
            })
            newDatas.picture = [...newDatas.picture, ...chidl.picture]
          })
          list.push(newDatas)
        } else {
          const resule = returnChildenList(item, index)
          if (resule?.length) {
            list = [...list, ...resule]
          }
        }
      })
    } else {
      if (element.content) {
        let textList: any = []
        const tableList: any = []
        if (element.content.indexOf('\r') > -1) {
          element.content.split('\r').forEach((item: any) => {
            if (item.indexOf('\n') > -1) {
              textList = [...textList, ...item.split('\n')]
            } else if (item.indexOf('|') > -1) {
              const tipsList = item
                .split('|')
                .map((cell: any) => cell.trim())
                .filter((cell: any) => cell && cell.indexOf('-----') === -1)
              if (tipsList?.length) {
                tableList.push(tipsList)
              }
            } else {
              textList.push(item)
            }
          })
        } else if (element.content.indexOf('\n') > -1) {
          element.content.split('\n').forEach((item: any) => {
            if (item.indexOf('|') > -1) {
              const tipsList = item
                .split('|')
                .map((cell: any) => cell.trim())
                .filter((cell: any) => cell && cell.indexOf('-----') === -1)
              if (tipsList?.length) {
                tableList.push(tipsList)
              }
            } else {
              textList.push(item)
            }
          })
        } else {
          textList.push(element.content)
        }
        textList = textList.filter((item: any) => item !== '')
        const outputData = transformData(textList)
        datas.content = [...[], ...outputData]

        if (tableList?.length) {
          datas.table.push(tableList)
        }
        list.push(datas)
      }
    }

    return list
  }

  const transformData = (data: any) => {
    const result = []
    let currentTitle = ''

    for (let i = 0; i < data.length; i++) {
      const item = data[i]

      // 检查是否是标题行（以数字和点开头）
      if (/^\d+\..+/.test(item)) {
        // 如果是标题行，且当前有未处理的标题，先保存到结果
        if (currentTitle) {
          result.push({ title: currentTitle, content: '' })
        }
        currentTitle = resectTitle(item)
      } else {
        // 如果是内容行，且当前有标题，则保存标题和内容
        if (currentTitle) {
          result.push({ title: currentTitle, content: item })
          currentTitle = ''
        } else {
          // 如果没有标题但有内容，可能是数据异常，这里可以选择忽略或处理
          result.push({ title: '', content: item })
        }
      }
    }

    // 处理最后一个标题（如果没有内容）
    if (currentTitle) {
      result.push({ title: currentTitle, content: '' })
    }

    return result
  }

  const resectTitle = (str: string) => {
    const regex =
      /^(?:\d+(?:\.\d+)+[:：]?|\d+(?:\.\d+)*[\.、]|\d+\s*[\.、]|[一二三四五六七八九十]+[、.．]|\s*)\s*/gm
    let result = str ? str.replace(regex, '') : ''
    if (result.startsWith('.')) {
      result = result.slice(1, result.length)
    }
    return result
  }

  const isUseDescribe = (item: any) => {
    if (createData.value?.language === 'en-US') {
      delete item.istranslate
      item.isdescribe = true
    } else if (!createData.value?.language) {
      if (lang === 'en-US') {
        delete item.istranslate
        item.isdescribe = true
      }
    }
  }

  const handleSpecialSlide = (data: any, slideList?: any) => {
    const pageType = data.type
    let temps = slideList.find(
      (ele: any) => ele.tags?.custom?.page_type === pageType
    )

    //
    if (temps && data.type === 'catalog') {
      const catalogTemp = slideList.filter(
        (ele: any) => ele.tags?.custom?.page_type === pageType
      )
      const randomIndex = Math.floor(Math.random() * catalogTemp.length)
      temps = catalogTemp[randomIndex]
    }
    let templateSlide = temps ? JSON.parse(JSON.stringify(temps)) : null

    let isSpecialChapter = false
    if (!templateSlide && data.type === 'chapter') {
      isSpecialChapter = true
      temps = slides.value.find(
        (ele: any) => ele.tags?.custom?.page_type === 'catalog'
      )
      // 这里处理一下 用目录页面的数据 给有文本的元素又加了一下 10

      templateSlide = temps ? JSON.parse(JSON.stringify(temps)) : null
      if (templateSlide) {
        handReectItem(templateSlide)
        templateSlide.tags.custom.page_type = 'chapter'
        templateSlide.chapterNum = data.number
      }
    }
    if (!templateSlide) {
      return null
    }
    templateSlide.id = nanoid(10)
    const textElement = templateSlide.elements.filter(
      (ele: any) => ele?.text?.text
    )
    setDataFontName(textElement)

    // 统一处理的是的 标题
    const title = textElement.filter(
      (ele: any) => ele.tags?.custom?.shape_type === 'title'
    )
    const hasCatalog = templateSlide.elements.find(
      (ele: any) =>
        ele.tags?.custom?.shape_type === 'catalog' ||
        ele.tags?.custom?.shape_type === 'item'
    )

    if (title?.length && pageType !== 'catalog') {
      if (pageType === 'chapter' && hasCatalog) {
        // 标题是章节的 并且是目录类型的
      } else {
        title.forEach((item: any) => {
          const text = resectTitle(data.title)
          if (text) {
            reterTextContent(item, text)
          }
        })
      }
    }
    // 副标题
    const subTitle = textElement.find(
      (ele: any) => ele.tags?.custom?.shape_type === 'subtitle'
    )
    if (subTitle) {
      if (
        subTitle.tags?.custom?.text_type === 'detail' ||
        subTitle.name.indexOf('简述') > -1
      ) {
        // 生成描述
        if (window._PROCESS_CONTENT) {
          subTitle.isdescribe = true
        } else {
          subTitle.isDelet = true
        }
        subTitle.isTitle = data.title
      } else {
        // 翻译
        if (window._PROCESS_TRANSLATE) {
          subTitle.istranslate = true
          isUseDescribe(subTitle)
        } else {
          subTitle.isDelet = true
        }
        subTitle.isTitle = data.title
      }
      if (!subTitle.istranslate && !subTitle.isdescribe) {
        subTitle.isDelet = true
      }
    }
    // 翻译
    const logoType = ['logo', 'company']
    templateSlide.elements.forEach((ele: any) => {
      if (logoType.includes(ele.tags?.custom?.shape_type)) {
        if (data.logo) {
          if (data.logo.indexOf('http') > -1) {
            ele.src = data.logo
            ele.isApi = true
          } else {
            reterTextContent(ele, data.logo)
          }
        } else {
          ele.isDelet = true
        }
      }
    })

    // 封面页 和 结束页 需要另外添加 名称 和 日期
    if (pageType === 'cover' || pageType === 'end') {
      templateSlide.elements.forEach((ele: any) => {
        if (ele.tags?.custom?.shape_type === 'advisor' && data.advisor) {
          reterTextContent(ele, `${t('create.teacher')}${data.advisor}`)
        }
        if (ele.tags?.custom?.shape_type === 'thesisinfo') {
          let text = t('create.tips')
          if (createData.value?.thesis_info?.major) {
            text += `${createData.value?.thesis_info?.major}/`
          }
          if (createData.value?.thesis_info?.school) {
            text += `${createData.value?.thesis_info?.school}`
          }
          if (text === t('create.tips')) {
            ele.isDelet = true
          } else {
            reterTextContent(ele, text)
          }
        }
      })

      const date = textElement.find(
        (ele: any) => ele.tags?.custom?.shape_type === 'date'
      )
      const name = textElement.find(
        (ele: any) => ele.tags?.custom?.shape_type === 'author'
      )
      if (date) {
        const text = moment(Date.now()).format('YYYY.MM.DD')
        reterTextContent(date, text)
      }
      if (name) {
        let text = data.author || useInfo?.value?.nickname
        reterTextContent(name, text)
      }
    } else if (pageType === 'catalog') {
      const catalogLeng = data?.content?.length
      templateSlide.elements.forEach((ele: any) => {
        if (
          ele.tags?.custom?.shape_type === 'catalog' ||
          ele.tags?.custom?.shape_type === 'item'
        ) {
          if (
            !ele.tags?.custom?.group_index &&
            ele.tags?.custom?.content_index
          ) {
            ele.tags.custom.group_index = ele.tags?.custom?.content_index + ''
          }
        }
        if (ele.tags?.custom?.group_index > catalogLeng) {
          ele.isDelet = true
        }
      })

      for (let index = 0; index < textElement.length; index++) {
        const ele = textElement[index]
        const group_index = ele.tags?.custom?.group_index
        if (
          group_index &&
          data.content[group_index - 1] &&
          (ele?.tags?.custom?.shape_type === 'item' ||
            ele?.tags?.custom?.shape_type === 'catalog' ||
            ele?.tags?.custom?.diagram_shape_type === 'title')
        ) {
          reterTextContent(ele, data.content[group_index - 1])
        } else if (
          group_index &&
          data.content[group_index - 1] &&
          (ele.tags.custom.shape_type === 'detail' ||
            ele.tags.custom.shape_type === 'english')
        ) {
          if (ele.tags.custom.shape_type === 'detail') {
            // 生成描述
            if (window._PROCESS_CONTENT) {
              ele.isdescribe = true
            } else {
              ele.isDelet = true
            }
            ele.isTitle = data.content[group_index - 1]
          } else {
            // 翻译
            if (window._PROCESS_TRANSLATE) {
              ele.istranslate = true
              isUseDescribe(ele)
            } else {
              ele.isDelet = true
            }
            ele.isTitle = data.content[group_index - 1]
          }
        }
      }
    } else if (pageType === 'chapter') {
      if (isSpecialChapter) {
        for (let index = 0; index < templateSlide.elements.length; index++) {
          const ele = templateSlide.elements[index]
          const group_index =
            ele.tags?.custom?.group_index || ele.tags?.custom?.content_index
          if (parseInt(group_index) === data.number) {
            if (
              ele?.tags?.custom?.shape_type === 'item' ||
              ele?.tags?.custom?.shape_type === 'catalog' ||
              ele?.tags?.custom?.diagram_shape_type === 'title'
            ) {
              if (ele.fill) {
                ele.fill.value = 'accent1'
              }
              if (ele.text?.paragraphs) {
                if (ele.text?.paragraphs[0].runs?.length) {
                  ele.text.paragraphs[0].runs.forEach((element: any) => {
                    element.fontColor.value = 'text2'
                    if (ele?.fill?.type === 'noFill') {
                      element.fontColor.value = 'accent1'
                    }
                    element.fontColor.type = 'themeColor'
                  })
                }
              }
            } else if (ele?.tags?.custom?.shape_type === 'num') {
              if (ele.text?.paragraphs) {
                ele.text.paragraphs[0].runs.forEach((element: any) => {
                  element.fontColor.type = 'themeColor'
                  element.fontColor.value =
                    ele?.fill?.value !== 'accent1' ||
                    ele?.fill?.type === 'noFill'
                      ? 'accent1'
                      : 'text2'
                })
              }
            } else {
              if (ele.fill) {
                ele.fill.value = 'accent1'
              }

              if (ele.color) {
                ele.color.value = 'accent1'
              }
            }
          }
        }
      } else {
        const chapterNum = textElement.find(
          (ele: any) => ele.tags?.custom?.shape_type === 'num'
        )
        const num = data.number > 9 ? data.number : '0' + data.number + ''
        reterTextContent(chapterNum, num)
      }
    }

    const schoolBb = templateSlide.elements.find(
      (ele: any) =>
        ele.tags?.custom?.shape_type === 'school_bg' ||
        ele.tags?.normal.some(
          (keyData: any) => keyData.value === 'YOO_CHATSHAPE_SCHOOL_BG'
        )
    )
    if (schoolBb) {
      schoolBb.src = createData.value?.thesis_info?.picture
      schoolBb.isApi = true
    }

    templateSlide.elements = templateSlide.elements.filter(
      (ele: any) => !ele.isDelet
    )

    // 这里重制一下元素的id 不然会导致后置美化查询元素的时候 查到相同元素
    templateSlide.elements.forEach((ele: any) => {
      ele.id = nanoid(10)
    })

    return templateSlide
  }

  const contentType: any = []
  const themeJsonList: any = {}
  // 内容页面
  const handleContentSlide = async (item: any, contentBgPage?: any) => {
    try {
      // 获取模版
      const params = returnApiKey(item)
      let list: any = []
      let contentTemplate: any = null
      let randomIndex: any = ''
      const themeItem =
        themeJsonList[
          `${params.type_count}_${params.picture_count}_${params.content_count}_${params.chart_count}`
        ]

      if (themeItem?.length) {
        list = themeItem
        randomIndex = Math.floor(Math.random() * list.length)
        contentTemplate = list[randomIndex]
        let copyList = JSON.parse(JSON.stringify(list))
        copyList = copyList.filter((item: any) => {
          return item.url !== contentTemplate.url
        })
        themeJsonList[
          `${params.type_count}_${params.picture_count}_${params.content_count}_${params.chart_count}`
        ] = copyList
      } else {
        const res: any = await getOnePageTemplat(params)
        if (res.code !== 200) return
        let ids = []

        if (ids.length === 0) {
          ids = res.data.map((item: any) => item.id)
        }
        const res2: any = await getOnePageDetail({
          limit: 15,
          id: ids.join(','),
          language: params.language,
        })
        if (res2.code !== 200) return
        list = res2.data.list
        randomIndex = Math.floor(Math.random() * list.length)
        contentTemplate = list[randomIndex]
        let copyList = JSON.parse(JSON.stringify(list))
        copyList = copyList.filter((item: any) => {
          return item.url !== contentTemplate.url
        })
        themeJsonList[
          `${params.type_count}_${params.picture_count}_${params.content_count}_${params.chart_count}`
        ] = copyList
      }

      if (sessionStorage.getItem('createThemeList')) {
        const createThemeList = JSON.parse(
          sessionStorage.getItem('createThemeList') || '[]'
        )
        createThemeList.push(contentTemplate)
        sessionStorage.setItem(
          'createThemeList',
          JSON.stringify(createThemeList)
        )
      } else {
        sessionStorage.setItem(
          'createThemeList',
          JSON.stringify([contentTemplate])
        )
      }
      mainStore.setPresentationItem({
        contentTemplate: sessionStorage.getItem('createThemeList'),
      })
      let content: any = await fetchUrl(contentTemplate?.url)

      const slideJson = JSON.parse(content)
      if (contentTemplate?.url.indexOf('/1736218244542-94.json') > -1) {
        slideJson.tags.custom.page_type = 'content'
      }

      if (contentBgPage) {
        const hasTitle = contentBgPage.elements.find(
          (ele: any) => ele.tags?.custom?.shape_type === 'title'
        )
        const hasPageNum = contentBgPage.elements.find(
          (ele: any) => ele.tags?.custom?.shape_type === 'slidecount'
        )

        const hasLogo = contentBgPage.elements.find(
          (ele: any) =>
            ele.name === 'logo' ||
            ele.tags?.custom?.shape_type === 'logo' ||
            ele.tags?.custom?.shape_type === 'fixedlogo'
        )

        if (hasPageNum && hasPageNum?.text?.text) {
          hasPageNum.text.paragraphs[0].runs[1].text = slides.value.length + ' '
        }

        if (hasTitle) {
          const image = contentBgPage.elements.find(
            (ele: any) => ele.name === 'Picture 13'
          )
          image.tags.custom.shape_type = 'direction'
          slideJson.elements = slideJson.elements.filter((ele: any) => {
            return ele.tags?.custom?.shape_type !== 'title'
          })
        }

        slideJson.elements = [...contentBgPage.elements, ...slideJson.elements]
      }
      // 处理模版数据 回填数据
      const textElement = slideJson.elements.filter(
        (ele: any) => ele?.text?.text
      )
      setDataFontName(textElement)
      const pageTyep = slideJson.tags?.custom?.page_type
      contentType.push(pageTyep)
      // 统一处理的是的 标题
      const title = textElement.filter(
        (ele: any) => ele.tags?.custom?.shape_type === 'title'
      )

      if (title?.length) {
        title.forEach((ele: any) => {
          reterTextContent(ele, item.title)
        })
      }

      let keyList = ['wordcloud', 'image', 'childimage', 'icon']

      const imageType = ['image', 'childimage', 'wordcloud']
      slideJson.elements.forEach((ele: any) => {
        if (keyList.includes(ele.tags?.custom?.shape_type)) {
          ele.isApi = true
          if (
            imageType.includes(ele.tags?.custom?.shape_type) &&
            item.picture?.length
          ) {
            let imageUrl = item.picture.shift()
            if (imageUrl) {
              if (imageUrl.indexOf('http://') > -1) {
                imageUrl = imageUrl.replace('http://', 'https://')
              }
              ele.src = imageUrl
            }
          }
        }

        if (ele?.text?.text) {
          if (
            ele.tags?.custom?.shape_type === 'subtitle' ||
            ele.tags?.custom?.shape_type === 'detail' ||
            ele.tags?.custom?.shape_type === 'english' ||
            ele.tags?.custom?.text_type === 'detail' ||
            ele.tags?.custom?.text_type === 'english' ||
            ele.name.indexOf('描述') > -1 ||
            ele.name.indexOf('翻译') > -1
          ) {
            if (
              ele.tags?.custom?.shape_type === 'english' ||
              ele.tags?.custom?.text_type === 'english' ||
              ele.name.indexOf('翻译') > -1
            ) {
              ele.istranslate = true
              isUseDescribe(ele)
            } else {
              ele.isdescribe = true
            }
            ele.isTitle = item.title
            if (ele.tags?.custom?.group_index) {
              const group_index = ele?.tags?.custom?.group_index
              ele.isTitle =
                item.content[group_index - 1].title ||
                item.content[group_index - 1].content ||
                item.title
            }
          }
        }

        // 表格
        if (
          ele.tags?.custom?.shape_type === 'table' ||
          ele.tags?.custom?.shape_type === 'chart'
        ) {
          if (item.table?.length) {
            const tableData = item.table.shift()
            delete ele.src
            delete ele.shapePresetType
            delete ele.pathFormula
            ele.type = 'table'
            ele.name = '表格'
            const colWidths: number[] = new Array(tableData[0].length).fill(
              1 / tableData[0].length
            )
            ele.colWidths = colWidths
            const tableBody: any = []

            tableData.forEach((eles: any, index: number) => {
              const tempList: any = []
              eles.forEach((child: any, childIndex: number) => {
                if (childIndex <= tableData[0].length - 1) {
                  const obj = {
                    id: nanoid(10),
                    colspan: 1,
                    rowspan: 1,
                    text: child,
                    style: {
                      color: {
                        type: 'themeColor',
                        value: 'text1',
                        transparent: '1',
                        brightness: '-30',
                      },
                      fontname: '微软雅黑',
                      fontsize: index > 0 ? '14px' : '16px',
                      bold: index > 0 ? false : true,
                    },
                  }
                  tempList.push(obj)
                }
              })

              if (tempList?.length) {
                tableBody.push(tempList)
              }
            })

            ele.data = tableBody
            ele.outline = {
              width: 1,
              style: 'solid',
              color: {
                type: 'themeColor', // 类型：themeColor、rgb
                value: 'accent1', // 颜色值，如果是themeColor，则为id；否则为十六进制色值
                transparent: 1,
              },
            }

            ele.theme = {
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
            ele.tableStyle = 'threeTable'
            const oneHeight: any = ele.height / tableBody.length
            ele.cellMinHeight = parseInt(oneHeight)
          } else {
            ele.isApi = true
          }
        }
      })

      if (pageTyep === 'content') {
        // 模版是 文本类型
        const content = textElement.filter(
          (ele: any) => ele.tags?.custom?.shape_type === 'content'
        )

        if (content?.length) {
          content.forEach((ele: any) => {
            if (ele.groupId) {
              const sameGroup = slideJson.elements.filter(
                (e: any) => e.groupId && e.groupId === ele.groupId
              )
              const hasDecoration = sameGroup.find(
                (e: any) => e.tags?.custom?.shape_type === 'decoration'
              )
              if (!hasDecoration) {
                reterTextContent(ele, item.content, 'content')
              }
            } else {
              reterTextContent(ele, item.content, 'content')
            }
          })
        }
      } else if (pageTyep === 'multcontent') {
        // 图示类型
        textElement.forEach((ele: any) => {
          // 删除 图示里面有内容的数据 暂时没有这种数据
          if (ele.tags?.custom?.shape_type === 'content') {
            ele.isDelet = true
          }
          const group_index = ele?.tags?.custom?.group_index
          if (ele?.tags?.custom?.shape_type === 'pagedecorate') {
            ele.isDelet = true
          }
          if (group_index && item.content && item.content[group_index - 1]) {
            const contentData = item.content[group_index - 1]
            const hasTitle = contentData.title
            if (ele?.tags?.custom?.shape_type === 'childtitle') {
              if (hasTitle) {
                reterTextContent(ele, contentData.title)
              } else {
                reterTextContent(ele, '', 'setEmpty')
              }
            } else if (ele?.tags?.custom?.shape_type === 'childcontent') {
              if (contentData.content) {
                reterTextContent(ele, contentData.content, 'childcontent')
              } else {
                ele.isDelet = true
              }
            }
          }
        })
      }

      if (slideJson && slideJson.elements?.length) {
        slideJson.elements = slideJson.elements.filter((ele: any) => {
          return !ele.isDelet
        })
      }
      // 这里重制一下元素的id 不然会导致后置美化查询元素的时候 查到相同元素
      slideJson.elements.forEach((ele: any) => {
        ele.id = nanoid(10)
      })

      const finLogo = slideJson.elements.find(
        (ele: any) =>
          ele.name === 'logo' ||
          ele.tags?.custom?.shape_type === 'logo' ||
          ele.tags?.custom?.shape_type === 'fixedlogo'
      )
      if (finLogo) {
        slideJson.elements = moveTopElement(slideJson.elements, finLogo)
      }
      slideJson.id = nanoid(10)
      return slideJson
    } catch (error) {
      return null
    }
  }

  const handReectItem = (slide: any) => {
    slide.elements.forEach((item: any) => {
      if (item?.text?.text) {
        const w = item.width
        const h = item.height
        item.width = item.width - 10
        if (w === h) {
          item.height = item.width
          item.top = item.top + 5
        }
      }
    })
    return slide
  }
  const returnApiKey = (item: any) => {
    const params: any = {
      type: '图文型',
      keyword: '有标题',
      type_count: 0, // 图示个数
      picture_count: 0, // 图片个数
      content_count: 0, // 文本个数
      chart_count: 0, // 图表 表格
      limit: 5,
    }
    // 区分是多个数据 还是纯文本数据
    const leng = item?.content?.length
    if (leng === 0) {
      // 纯图片
      // 图片 1-3 随机
      params.picture_count = Math.floor(Math.random() * 3) + 1
    } else if (leng === 1) {
      // 肯定是存文本+图片
      params.picture_count = Math.floor(Math.random() * 3) + 1
      params.content_count = 1
    } else if (leng > 1 && leng < 5) {
      // 概率 文本+图片30%  或者 图示70%
      let typeApi = ''
      const random = Math.random() // 生成一个 0 到 1 之间的随机数
      if (random < 0.7) {
        typeApi = 'item' // 70% 的概率返回 1
      } else {
        typeApi = 'content' // 30% 的概率返回 2
      }

      if (typeApi === 'item') {
        params.type = '图示型'
        params.type_count = leng
        params.picture_count = 0
        params.content_count = 0
      } else {
        params.type = '图文型'
        params.type_count = 0
        params.picture_count = Math.floor(Math.random() * 3) + 1
        params.content_count = 1
      }
    } else {
      // 图示
      params.type = '图示型'
      params.type_count = leng
      params.picture_count = 0
      params.content_count = 0
    }

    if (item?.table?.length) {
      params.type = '图文型'
      params.picture_count = 0
      params.chart_count = item?.table?.length
      params.content_count = item?.content?.length > 1 ? 1 : 0
      params.type_count = 0
    }
    const hasContentIsEmpty = item?.content?.some((item: any) => {
      return !item.content
    })

    // 图示没有大于6的组
    if (params.type_count > 6 || hasContentIsEmpty) {
      params.type_count = 0
      params.type = '图文型'
      params.chart_count = 0
      params.content_count = 1
      params.picture_count = Math.floor(Math.random() * 3) + 1
    }

    if (item.picture?.length && !params.chart_count) {
      params.type = '图文型'
      params.content_count = 1
      params.picture_count = item.picture?.length
    }

    return params
  }
  const reterTextContent = (item: any, text: any, type?: string) => {
    const paragraphs = item?.text?.paragraphs || []
    const runs = paragraphs?.length ? paragraphs[0].runs[0] : []
    if ((!text && type !== 'setEmpty') || paragraphs?.length === 0) return
    const somelist = text && typeof text === 'string' ? text.split('\n') : []
    if (type === 'content') {
      // 如果是内容类型的 这里的text是数组
      const contentList = text
      const newParagrap: any = []
      contentList.forEach((element: any, index: number) => {
        // 标题
        if (element.title) {
          const temRunObj = JSON.parse(JSON.stringify(runs))
          temRunObj.text =
            contentList?.length > 1
              ? `${index + 1}.${element.title}`
              : element.title
          temRunObj.len = element.title.length
          temRunObj.fontSize = temRunObj.fontSize + 2
          temRunObj.bold = true
          temRunObj.fontColor = {
            type: 'themeColor',
            value: 'accent1',
            transparent: '1',
            brightness: '-30',
          }
          const p = JSON.parse(JSON.stringify(paragraphs[0]))
          p.runs = [temRunObj]
          if (index > 0) {
            p.paragraphSpace = 15
          }
          newParagrap.push(p)
        }
        // 内容
        if (element.content) {
          const contentSplit = element.content.split('\n')
          contentSplit.forEach((ele: any) => {
            const temRunObj = JSON.parse(JSON.stringify(runs))
            temRunObj.text = ele
            temRunObj.len = ele.length
            const newRunsTextList = returnPercentageStr(ele)
            // 后置美化 数字强调 默认设置为主题色、且亮度设置-50%
            const runsList: any = []
            newRunsTextList.forEach((textRun: any) => {
              const obj = JSON.parse(JSON.stringify(runs))
              if (isPercentage(textRun)) {
                obj.fontColor = {
                  type: 'themeColor',
                  value: 'accent1',
                  transparent: '1',
                  brightness: '-50',
                }
                obj.bold = true
              }
              obj.text = textRun
              obj.len = textRun.length
              runsList.push(obj)
            })
            if (runsList?.length) {
              const p = JSON.parse(JSON.stringify(paragraphs[0]))
              p.runs = runsList // 是数组
              newParagrap.push(p)
            }
          })
        }
      })
      item.text.paragraphs = setTextLineHeight(item, newParagrap)
    } else {
      item.text.text = text
      if (somelist?.length > 0) {
        const tempPList: any = []
        somelist.forEach((ele: any) => {
          // 子内容 后置美化 数字强调
          if (type === 'childcontent') {
            const newRunsTextList = returnPercentageStr(ele)
            const runsList: any = []
            newRunsTextList.forEach((textRun: any) => {
              const obj = JSON.parse(JSON.stringify(runs))
              if (isPercentage(textRun)) {
                obj.fontColor = {
                  type: 'themeColor',
                  value: 'accent1',
                  transparent: '1',
                  brightness: '-50',
                }
                obj.bold = true
              }
              obj.text = textRun
              obj.len = textRun.length
              runsList.push(obj)
            })
            if (runsList?.length) {
              const tempPItem = JSON.parse(JSON.stringify(paragraphs[0]))
              tempPItem.runs = runsList
              tempPList.push(tempPItem)
            }
          } else {
            const tempRunItem = JSON.parse(JSON.stringify(runs))
            tempRunItem.text = ele
            tempRunItem.len = ele.length
            const tempPItem = JSON.parse(JSON.stringify(paragraphs[0]))
            tempPItem.runs = [tempRunItem]
            tempPList.push(tempPItem)
          }
        })

        item.text.paragraphs = setTextLineHeight(item, tempPList)
      } else {
        runs.text = text
        runs.len = text.length
        paragraphs[0].runs = [runs]
        item.text.paragraphs = setTextLineHeight(item, [paragraphs[0]])
      }
    }
  }

  const isPercentage = (str: string) => {
    const percentageRegex = /^(\d{1,3}(?:,\d{3})*(?:%|\+)?)$/
    return percentageRegex.test(str)
  }

  // 内容 找到 百分比数值 和 千位字符
  const returnPercentageStr = (str: string) => {
    // 使用正则表达式匹配要拆分的部分
    const result = str.split(/(\d{1,3}(?:,\d{3})*(?:%|\+)?)/).filter(Boolean)
    // /(\d{1,3}(?:,\d{3})*(?:%|\+)?)/
    return result
  }
  const setTextLineHeight = (item: any, list: any, margin?: any) => {
    list.forEach((ele: any) => {
      let step = margin || 2
      if (ele.lineHeightType && ele.lineHeightNum) {
        step = ele.lineHeightNum
      }
      const maxFontSize = Math.max(...ele.runs.map((run: any) => run.fontSize))
      const lineHeightPx = maxFontSize + step
      const multiple = (lineHeightPx / maxFontSize).toFixed(1)
      ele.lineHeight = multiple
    })
    return list
  }
  const errorSilse = (noMessage?: boolean, isSave?: boolean) => {
    if (!noMessage) {
      message.error(t('create.error1'))
    }
    const errorData = JSON.parse(JSON.stringify(datas))
    errorData.slides = emptyList
    initSlids(errorData)
    snapshotStore.initSnapshotDatabase()
    showLoadingPage.value = false
    showPPTTips.value = false
    if (isSave) {
      saveJSONData(null, null, null, true)
      if (localStorage.getItem('linkType') === 'CreateEmpty') {
        localStorage.removeItem('linkType')
      }
    }
  }
  const defualtSlide = () => {
    // 地址栏没有存 fileid 就初始化一个默认数据
    initSlids(datas)
    snapshotStore.initSnapshotDatabase()
    mainStore.setAvailableFonts()
    showLoadingPage.value = false
    showPPTTips.value = false
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
  const setDataFontName = (newElementList: any) => {
    let fontStyle = themeData.value?.fontStyle || null
    if (JSON.stringify(fontStyle) === '{}') {
      fontStyle = null
    }
    if (newElementList?.length) {
      newElementList.forEach((item: any) => {
        // 内容字体跟随 随机字体
        if (fontStyle && item.text) {
          const isTitleTag = ['title', 'subtitle']
          item.text.paragraphs.forEach((p: any) => {
            p.runs.forEach((r: any) => {
              if (isTitleTag.includes(item.tags.custom.shape_type)) {
                r.fontName = fontStyle.titleFontStyle
                if (isBoldFont.includes(fontStyle.titleFontStyle)) {
                  r.bold = false
                }
              } else {
                r.fontName = fontStyle.subTitleFontStyle
                if (isBoldFont.includes(fontStyle.subTitleFontStyle)) {
                  r.bold = false
                }
              }
            })
          })
        }
      })
    }
  }

  return {
    showLoadingPage,
    showPPTTips,
    loadingTimeTips,
    useFileId,
    normalCreate,
    handleContentSlide,
    returnChildenList,
    defualtSlide,
    delay,
    fetchUrl,
    initCreate,
    errorSilse,
  }
}
