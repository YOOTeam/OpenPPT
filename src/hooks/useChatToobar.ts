import { ref, reactive, watch, nextTick } from 'vue'
import { useMainStore, useSlidesStore, useChatInfo } from '@/store'
import { writtenWords } from '@/api/careate'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import useCombineElement from '@/hooks/useCombineElement'
import useChangeImage from '@/hooks/useChangeImage'
import useInitSlides from '@/hooks/useInitSlides'
import useThemeFileTemplate from '@/hooks/useThemeFileTemplate'
import { translateText } from '@/api/careate'
import useExport from '@/hooks/useExport'
import useHistorySnapshot from './useHistorySnapshot'

export default function useChatToolbar(elementType: string) {
  // 状态定义
  const textType = ref<string | undefined>()
  const option = ref<any[]>([])
  const openChatBar = ref(false)

  // 依赖注入
  const mainStore = useMainStore()
  const slideStore = useSlidesStore()
  const chatInfoStore = useChatInfo()

  const { t } = useI18n()
  const { canCombine, combineElements, uncombineElements } = useCombineElement()
  const { handleGenerateImage, handleSearchImage } = useChangeImage()
  const { setTextContent } = useInitSlides()
  const { defaultColorTheme } = useThemeFileTemplate()
  const { htmlToJsonData } = useExport()
  const { addHistorySnapshot } = useHistorySnapshot()
  // Store引用
  const {
    toolbarData,
    showToolbar,
    handleElement,
    handleElementId,
    useFileId,
    selectedSlidesIndex,
  } = storeToRefs(mainStore)
  const { slides, slideIndex, currentSlide } = storeToRefs(slideStore)

  const { currentTextNode } = storeToRefs(chatInfoStore)
  const editor_data: any = ref([])

  // 选项定义
  const textOpction: any = reactive([
    {
      name: t('tipsBar.writtenwords'),
      key: 'textExpand',
    },

    {
      name: t('tipsBar.aiTransltate'),
      key: 'textTranslation',
    },
  ])

  const imgOpction: any = reactive([
    {
      name: t('tipsBar.imgCreate'),
      key: 'imgCreate',
    },
    {
      name: t('tipsBar.imgSearch'),
      key: 'imgSearch',
    },
  ])

  const assistOption: any = reactive([
    {
      name: t('tipsBar.polishing'),
      key: 'assistPolishing',
    },
    {
      name: t('tipsBar.expanding'),
      key: 'assistExpanding',
    },
    {
      name: t('tipsBar.refining'),
      key: 'assistRefining',
    },
    {
      name: t('tipsBar.continuing'),
      key: 'assistContinuing',
    },
  ])

  const translationOption: any = reactive([
    {
      name: t('tipsBar.chinese'),
      key: 'translationChinese',
    },
    {
      name: t('tipsBar.english'),
      key: 'translationEnglish',
    },
    {
      name: t('tipsBar.japanese'),
      key: 'translationJapanese',
    },
    {
      name: t('tipsBar.korean'),
      key: 'translationKorean',
    },
  ])

  const generationOption: any = reactive([
    {
      name: t('tipsBar.img'),
      key: 'generationImg',
    },
    {
      name: t('tipsBar.vector'),
      key: 'generationVectorIcon',
    },
    {
      name: t('tipsBar.structuralDiagram'),
      key: 'generationStructuralDiagram',
    },
  ])

  // 常量定义
  const TEXT_OPTION_KEYS: any = ['textExpand', 'textTranslation', 'textCreate']
  const IMG_OPTION_KEYS: any = ['imgCreate', 'imgSearch', 'imgDirect']
  const CHAT_ACTION_KEYS: any = [
    'assistPolishing',
    'assistExpanding',
    'assistRefining',
    'assistContinuing',
  ]
  const TRANSLATION_KEYS: any = [
    'translationChinese',
    'translationEnglish',
    'translationJapanese',
    'translationKorean',
  ]

  // 映射定义
  const TEXT_TYPE_MAP: any = {
    textExpand: 'assist',
    textTranslation: 'translate',
    textCreate: 'generation',
  }

  const INSTRUCTION_MAP: any = {
    assistPolishing: t('tipsBar.assistPolishing'),
    assistExpanding: t('tipsBar.assistExpanding'),
    assistRefining: t('tipsBar.assistRefining'),
    assistContinuing: t('tipsBar.assistContinuing'),
    translationChinese: t('tipsBar.translationChinese'),
    translationEnglish: t('tipsBar.translationEnglish'),
    translationJapanese: t('tipsBar.translationJapanese'),
    translationKorean: t('tipsBar.translationKorean'),
  }
  const OPENINSTRUCTION_MAP: any = {
    assistPolishing: 'polish',
    assistExpanding: 'winden',
    assistRefining: 'refine',
    assistContinuing: 'continue',
    translationChinese: '中文',
    translationEnglish: '英文',
    translationJapanese: '日语',
    translationKorean: '韩语',
  }

  // 初始化选项
  const initOption = () => {
    const obj = {
      label: '',
      icon: '',
      key: '',
    }
    const multiObj = {
      label: '',
      icon: '',
      key: 'group',
    }

    option.value = [
      {
        key: 'chat',
        icon: '',
        label: 'AI Chat',
      },
    ]

    obj.key = elementType
    switch (elementType) {
      case 'text':
        obj.label = t('tipsBar.textStyle')
        obj.icon = 'icon-wenben'
        break
      case 'image':
        obj.label = t('tipsBar.imgStyle')
        obj.icon = 'icon-tupian'
        break
      case 'shape':
        obj.label = t('tipsBar.shapStyle')
        obj.icon = 'icon-xingzhuang'
        break
      case 'table':
        obj.label = t('tipsBar.tableStyle')
        obj.icon = 'icon-biaoge'
        break
      case 'chart':
        obj.label = t('tipsBar.chartStyle')
        obj.icon = 'icon-tubiao'
        break
      case 'latex':
        obj.label = t('tipsBar.latexStyle')
        obj.icon = 'icon-gongshi'
        break
      case 'audio':
        obj.label = t('tipsBar.audioStyle')
        obj.icon = 'icon-yinpinbofang'
        break
      case 'video':
        obj.label = t('tipsBar.videoStyle')
        obj.icon = 'icon-meiti'
        break
      case 'line':
        obj.label = t('tipsBar.lineStyle')
        obj.icon = 'icon-kaishishengcheng'
        break
      case 'multi':
        obj.label = t('tipsBar.moreStyle')
        obj.icon = 'icon-congAImobanshengcheng'
        if (canCombine.value) {
          multiObj.label = t('positionPool.group')
          multiObj.icon = 'IconGroup'
        } else {
          multiObj.label = t('positionPool.noGroup')
          multiObj.icon = 'IconUngroup'
        }
        break
      case 'iframe':
        obj.label = t('tipsBar.iframeStyle')
        obj.icon = 'icon-wangyewaikuangyangshi-liulanqi'
        break

      default:
        break
    }

    if (obj.label) {
      if (multiObj.label) {
        option.value.unshift(multiObj)
      }
      option.value.unshift(obj)
    }

    const style = toolbarData.value.contentStyle
    if (showToolbar.value && toolbarData.value.useact === 'update') {
      mainStore.setToolbarData({
        showEmpty: false,
        type: elementType,
        useact: 'update',
        x: 0,
        y: 0,
        contentStyle: style,
      })
    }
  }

  // 获取历史ID
  const getHistroyId = () => {
    const currentslide = slideStore.slideIndex
    const slideId = slideStore.slides[currentslide].id
    const elementsId = mainStore.activeElementIdList
    const multiId = [...new Set(selectedSlidesIndex.value)]
    const slides = slideStore.slides
    const pptSelects = ref<any>([])

    if (multiId.length !== 0) {
      pptSelects.value = multiId.map((index) => {
        const slide = slides[index]
        const isCurrent = slide.id === slideId
        return {
          slideId: slide.id,
          elements: elementsId,
          is_current: isCurrent,
          is_select: true,
        }
      })
    } else {
      pptSelects.value = [
        {
          slideId: slideId,
          elements: elementsId,
          is_current: true,
          is_select: true,
        },
      ]
    }

    mainStore.setChatInfo({
      toChatData: {
        ppt_id: mainStore.useFileId,
        ppt_selects: pptSelects,
        editor_data: editor_data.value || [],
      },
    })
  }

  // 设置聊天工具栏数据
  const setChatToolbarData = () => {
    mainStore.setToolbarData({
      showEmpty: false,
      type: 'chat',
      useact: 'add',
      x: 0,
      y: 0,
      className: 'chat',
      contentStyle: { right: '100rem', left: 'auto' },
    })
    mainStore.setShowToolbar(true)
  }

  // 处理组操作
  const handleGroupAction = (item: any) => {
    if (canCombine.value) {
      combineElements()
      updateGroupOption(true)
    } else {
      uncombineElements()
      updateGroupOption(false)
    }
  }

  // 处理文本操作
  const handleTextAction = async (item: any) => {
    await getHistroyId()
    textType.value = TEXT_TYPE_MAP[item.key] || undefined
  }

  // 处理图片操作
  const handleImageAction = async (item: any) => {
    const imageHandlers: any = {
      imgCreate: handleGenerateImage,
      imgSearch: handleSearchImage,
    }

    mainStore.setChatInfo({
      toChatData: {
        ...mainStore.chatInfo.toChatData,
        input_text: item.name,
      },
    })
    const handler = imageHandlers[item.key]
    if (handler) await handler()
    else console.warn('未知的图片处理类型:', item.key)
  }

  // 处理聊天操作
  const handleChatAction = async (item: any) => {
    openChatBar.value = !openChatBar.value
    if (CHAT_ACTION_KEYS.includes(item.key)) {
      const instruction = INSTRUCTION_MAP[item.key]
      const type = OPENINSTRUCTION_MAP[item.key]
      let Text: any = ''
      if (getSelectText()) {
        if (instruction !== t('tipsBar.assistContinuing')) {
          Text = getSelectText()
        } else {
          chatInfoStore.setIsEnd(true)
          Text = getSelectText()
        }
      } else {
        if (instruction !== t('tipsBar.assistContinuing')) {
          Text = null
        } else {
          chatInfoStore.setIsEnd(true)
          Text = selectCursorBeforeText()
        }
      }
      if (Text) {
        // 1.chat的形式
        // 获取到Text后，转化。获取转化后的文案，在调用重新赋值。
        await writtenWords({
          type: type,
          text: Text,
        }).then((res: any) => {
          if (res.code === 200) {
            const id = handleElement.value?.id
            chatChangeText(id, res.data?.result)
            addHistorySnapshot()
            return
          }
        })
        return
      }
      // 1.直接获取的形式
      if (handleElement.value) {
        const text =
          handleElement.value.type === 'shape'
            ? htmlToJsonData(
                handleElement.value?.text?.content,
                null,
                '',
                null,
                true
              )
            : htmlToJsonData(handleElement.value?.content, null, '', null, true)
        // 获取到Text后，转化。获取转化后的文案，在调用重新赋值。
        await writtenWords({
          type: type,
          text: text.text,
        }).then((res: any) => {
          if (res.code === 200) {
            const id = handleElement.value?.id
            chatChangeText(id, res.data?.result)
            addHistorySnapshot()
            return
          }
        })
        return
      }
    }
    if (TRANSLATION_KEYS.includes(item.key)) {
      const instruction = INSTRUCTION_MAP[item.key]
      const lang = OPENINSTRUCTION_MAP[item.key]
      let Text: any = ''
      if (getSelectText()) {
        if (instruction !== t('tipsBar.assistContinuing')) {
          Text = getSelectText()
        } else {
          chatInfoStore.setIsEnd(true)
          Text = getSelectText()
        }
      } else {
        if (instruction !== t('tipsBar.assistContinuing')) {
          Text = null
        } else {
          chatInfoStore.setIsEnd(true)
          Text = selectCursorBeforeText()
        }
      }
      if (Text) {
        // 1.chat的形式
        // 获取到Text后，转化。获取转化后的文案，在调用重新赋值。
        const translateText = await aiTranslate(Text, null, lang)
        replaceCurrentTextNode(translateText)
        addHistorySnapshot()
        return
      }
      if (handleElement.value as any) {
        const text =
          handleElement.value?.type === 'shape'
            ? htmlToJsonData(
                handleElement.value?.text?.content,
                null,
                '',
                null,
                true
              )
            : htmlToJsonData(handleElement.value?.content, null, '', null, true)
        const id = handleElement.value?.id
        await aiTranslate(text, id, lang)
        addHistorySnapshot()
        return
      }
    }
  }
  // 处理形状类型且存在文本
  const handleShapeText = async (item: any) => {
    await getHistroyId()
    textType.value = TEXT_TYPE_MAP[item.key] || undefined
  }
  // 处理其他操作
  const handleOtherActions = (item: any, style: any) => {
    if (item.key === 'source') {
      slideStore.updataPPTViewData({
        type: 'sourceView',
        sourceID: item.value,
      })
      return
    }

    const shouldShowToolbar =
      item.key !== 'chat' ||
      (elementType !== 'text' &&
        elementType !== 'image' &&
        !(elementType === 'shape' && handleElement.value?.text?.content) &&
        !(elementType === 'shape' && handleElement.value?.fillPicture?.src))
    mainStore.setShowToolbar(shouldShowToolbar)
    if (shouldShowToolbar) {
      mainStore.setToolbarData({
        showEmpty: false,
        type: elementType,
        useact: 'update',
        x: 0,
        y: 0,
        contentStyle: style,
      })
    }
    if (
      item.key === 'chat' &&
      elementType !== 'text' &&
      elementType !== 'image' &&
      !(elementType === 'shape' && handleElement.value?.text?.content) &&
      !(elementType === 'shape' && handleElement.value?.fillPicture?.src)
    ) {
      setChatToolbarData()
    }
  }
  // 更新组选项
  const updateGroupOption = (isCombine: boolean) => {
    const groupItem = option.value.find(
      (optionItem) => optionItem.key === 'group'
    )
    if (groupItem) {
      groupItem.label = isCombine
        ? t('positionPool.noGroup')
        : t('positionPool.group')
      groupItem.icon = isCombine ? 'IconUngroup' : 'IconGroup'
    }
  }
  // 主处理函数
  const handleOpenBar = async (item: any) => {
    const style = toolbarData.value.contentStyle
    const targetKeys = new Set([...TEXT_OPTION_KEYS, ...IMG_OPTION_KEYS])
    switch (item.key) {
      case 'group':
        handleGroupAction(item)
        return
      case 'chat':
        openChatBar.value =
          elementType === 'text' ||
          elementType === 'image' ||
          elementType === 'shape'
            ? !openChatBar.value
            : false
        handleOtherActions(item, style)
        return
      default:
        if (targetKeys.has(item.key)) {
          await getHistroyId()
          if (elementType === 'text') {
            handleTextAction(item)
          } else if (elementType === 'image') {
            handleImageAction(item)
          } else if (elementType === 'shape') {
            handleShapeText(item)
            handleImageAction(item)
          }
        } else if (
          CHAT_ACTION_KEYS.includes(item.key) ||
          TRANSLATION_KEYS.includes(item.key)
        ) {
          handleChatAction(item)
        } else {
          handleOtherActions(item, style)
        }
    }
  }

  //  1. 获取鼠标划选文本
  const getSelectText = () => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return false

    const range = selection.getRangeAt(0)
    const selectedText = range.toString()

    // 记录完整信息，供后续替换使用
    const selectionInfo = {
      range, // 【新增】整段 range，后面直接用
      node: range.startContainer,
      startOffset: range.startOffset,
      endOffset: range.endOffset,
      isCollapsed: range.collapsed,
      selectedText,
    }

    chatInfoStore.setCurrentTextNode(selectionInfo)
    editor_data.value = [selectedText]
    getHistroyId()
    return selectedText
  }

  //  2. 选中光标之前所有文字
  const selectCursorBeforeText = () => {
    const selection = window.getSelection()
    if (
      selection?.anchorNode &&
      selection.anchorNode.nodeType !== Node.TEXT_NODE
    )
      return false
    if (!selection || selection.rangeCount === 0) return false
    const curRange = selection.getRangeAt(0)
    let cursorNode = curRange.startContainer
    const cursorOffset = curRange.startOffset
    // 当前节点
    const nodes: Text[] = []
    if (cursorNode.nodeType === Node.TEXT_NODE) nodes.push(cursorNode as Text)
    // 向上找到可编辑根（限制收集范围，防止整页遍历）
    const root =
      (cursorNode as Element).closest?.('[contenteditable="true"]') ||
      cursorNode.parentElement!.closest('[contenteditable="true"]')!
    const prevTextNode = (from: Node): Text | null => {
      let node: Node | null = from
      while (node && node !== root) {
        if (node.previousSibling) {
          node = node.previousSibling
          while (node?.lastChild) node = node.lastChild
          if (node?.nodeType === Node.TEXT_NODE) return node as Text
        } else {
          node = node.parentNode
        }
      }
      return null
    }
    const prev1 = prevTextNode(cursorNode)
    if (prev1) nodes.unshift(prev1)
    const prev2 = prev1 ? prevTextNode(prev1) : null
    if (prev2) nodes.unshift(prev2)
    if (nodes.length === 0) return false
    const startNode = nodes[0]
    const endNode = nodes[nodes.length - 1]
    const range = document.createRange()
    range.setStart(startNode, 0) // 从第一段文本头开始
    range.setEnd(cursorNode, cursorOffset) // 到光标处结束
    const selectedText = range.toString()
    const selectionInfo = {
      range,
      node: curRange.startContainer, // 保持原名
      startOffset: 0,
      endOffset: cursorOffset,
      isCollapsed: false,
      selectedText,
    }
    chatInfoStore.setCurrentTextNode(selectionInfo)
    editor_data.value = [selectedText]
    getHistroyId()
    return selectedText
  }

  // 3. 替换 / 续写选中文本
  const replaceCurrentTextNode = async (aiText: string, isEnd?: boolean) => {
    const { range } = currentTextNode.value

    try {
      const frag = document.createDocumentFragment()

      if (isEnd) {
        frag.appendChild(range.cloneContents())
      }

      const ANCHOR_CHAR = '\u200B'
      const anchorNode = document.createTextNode(ANCHOR_CHAR)
      frag.appendChild(anchorNode) // 先放锚点
      const aiTextNode = document.createTextNode(aiText)
      frag.appendChild(aiTextNode) // 再放 AI 文本

      const insertParent =
        range.commonAncestorContainer.nodeType === Node.TEXT_NODE
          ? range.commonAncestorContainer.parentNode
          : range.commonAncestorContainer

      range.extractContents()
      range.insertNode(frag)

      await nextTick()

      const sel = window.getSelection()
      if (!sel) return

      const walker = document.createTreeWalker(
        insertParent,
        NodeFilter.SHOW_TEXT,
        null
      )
      let foundAnchor = false
      let targetTextNode: Text | null = null
      let anchorOffsetInNode = -1

      let node: Text | null = null
      while ((node = walker.nextNode() as Text)) {
        const content = node.textContent!
        const idx = content.indexOf(ANCHOR_CHAR)
        if (idx !== -1) {
          // 找到了锚点所在的 text node
          targetTextNode = node
          anchorOffsetInNode = idx
          foundAnchor = true
          break
        }
      }

      if (!foundAnchor || !targetTextNode) {
        // 极端兜底：直接放到插入位置
        const r = document.createRange()
        r.setStart(insertParent, 0)
        r.collapse(true)
        sel.removeAllRanges()
        sel.addRange(r)
        return
      }

      targetTextNode.textContent = targetTextNode.textContent!.replace(
        ANCHOR_CHAR,
        ''
      )

      const aiStartOffset = anchorOffsetInNode // 锚点被删掉后，就是 AI 文本起点
      const aiEndOffset = aiStartOffset + aiText.length

      const r = document.createRange()
      r.setStart(targetTextNode, aiStartOffset)
      r.setEnd(targetTextNode, aiEndOffset)
      sel.removeAllRanges()
      sel.addRange(r)

      /* 4. 同步业务 store（与原逻辑一致） */
      const element: any = findElementById(handleElementId.value)
      if (element) {
        const wrapper = document.getElementById(
          `editable-element-${handleElementId.value}`
        )
        const pm = wrapper?.querySelector('.ProseMirror')
        if (pm) {
          const html = Array.from(pm.children)
            .map((n: any) => n.outerHTML)
            .join('')

          if (element.type === 'shape' && element.text)
            element.text.content = html
          if (element.content) element.content = html
        }
      }

      const newSlide = slides.value[slideIndex.value]
      slideStore.updateSlide({ elements: newSlide.elements })
    } catch (error) {
      console.error('Error replacing text:', error)
    }
  }

  // 根据id查找元素
  const findElementById = (id: string) => {
    const slide = currentSlide.value
    const element = slide?.elements.find((item: any) => {
      return item.id === id
    })
    return element
  }

  const aiTranslate = async (data: any, elementId: any, lang: any) => {
    if (!data) return ''
    const langMap = [
      { id: 'zh', value: '中文' },
      { id: 'en', value: '英文' },
      { id: 'jp', value: '日语' },
      { id: 'kor', value: '韩语' },
      { id: 'fra', value: '法语' },
      { id: 'spa', value: '西班牙语' },
      { id: 'th', value: '泰语' },
      { id: 'ara', value: '阿拉伯语' },
      { id: 'pt', value: '葡萄牙语' },
      { id: 'de', value: '德语' },
      { id: 'it', value: '意大利语' },
      { id: 'el', value: '希腊语' },
      { id: 'nl', value: '荷兰语' },
      { id: 'pl', value: '波兰语' },
      { id: 'bul', value: '保加利亚语' },
      { id: 'est', value: '爱沙尼亚语' },
      { id: 'dan', value: '丹麦语' },
      { id: 'fin', value: '芬兰语' },
      { id: 'cs', value: '捷克语' },
      { id: 'rom', value: '罗马尼亚语' },
      { id: 'slo', value: '斯洛文尼亚语' },
      { id: 'swe', value: '瑞典语' },
      { id: 'hu', value: '匈牙利语' },
      { id: 'cht', value: '繁体中文' },
      { id: 'vie', value: '越南语' },
    ]
    const langData = langMap.find(
      (langItem: any) => langItem.value === lang
    )?.id
    if (elementId !== null) {
      const element: any = findElementById(elementId)
      // 先拆分dom结构成为段落数据
      const textP =
        element.type === 'shape'
          ? htmlToJsonData(element.text.content, null, '', null, true)
          : htmlToJsonData(element.content, null, '', null, true)

      element.text.paragraphs = textP.paragraphs
      element.text.text = textP.text
      const defaultColor =
        element.type === 'shape'
          ? element.text.defaultColor
          : element.defaultColor
      await Promise.all(
        element.text.paragraphs.map(async (item: any) => {
          const translateTexts = item.runs?.length
            ? item.runs.map((el: any) => el.text).join()
            : ''
          if (translateTexts) {
            const res: any = await translateText({
              text: translateTexts,
              to: langData,
            })
            if (res.code === 200) {
              if (item.runs?.length === 1) {
                item.runs[0].text = res.data
              } else if (item.runs?.length > 1) {
                const firstRun = JSON.parse(JSON.stringify(item.runs[0]))
                firstRun.text = res.data
                firstRun.bold = false
                if (defaultColor) {
                  firstRun.fontColor = defaultColor
                }
                item.runs = [firstRun]
              }
            }
          }
        })
      )
      await setTextContent(element, element.type)
      const newSlide = slides.value[slideIndex.value]
      slideStore.updateSlide({
        elements: newSlide.elements,
      })
      nextTick(() => {
        // 获取可编辑元素
        const editableElement = document.getElementById(
          `editable-element-${elementId}`
        )
        if (editableElement) {
          // 查找ProseMirror编辑器区域
          const proseMirrorElement =
            editableElement.querySelector('.ProseMirror')
          if (proseMirrorElement) {
            // 创建选区并选中所有内容
            const selection = window.getSelection()
            const range = document.createRange()
            range.selectNodeContents(proseMirrorElement)
            selection?.removeAllRanges()
            selection?.addRange(range)
          }
        }
      })
    } else {
      const langData = langMap.find((item: any) => item.value === lang)?.id
      const res: any = await translateText({ text: data, to: langData })
      return res.data
    }
  }

  // 处理AI对话，修改整段文本内容
  const chatChangeText = async (
    id: any,
    text: any,
    colorList?: any,
    isEnd?: boolean
  ) => {
    try {
      // 1.根据id，查询需要替换的元素
      const element: any = findElementById(id)
      if (!element) {
        return
      }
      if (element?.text?.paragraphs?.length === 0 || !element.text) return
      const arr = element?.text?.paragraphs
      if (!arr || arr.length === 0) {
        return
      }

      const content = text
      let paragraphs = []
      let endParagraphs = []
      const oldParagraphs = JSON.parse(JSON.stringify(arr))
      element.text.text = content

      // 2.根据返回的文本标识符进行分割
      const firstList = content.split('\n')
      const pList = processParagraphs(firstList)
      if (pList) {
        // 过滤掉空内容项
        const filteredPList = pList.filter((item) => item.trim())
        for (let index = 0; index < filteredPList.length; index++) {
          const paragraphText = filteredPList[index]

          // 确保arr[index]存在
          if (!arr[index]) continue

          const textStyle = JSON.parse(JSON.stringify(arr[index].runs[0] || {}))
          if (textStyle.fontColor && colorList) {
            textStyle.fontColor.templateThemeColors = colorList
          }
          if (defaultColorTheme() && textStyle?.fontColor?.value === 'bg2') {
            textStyle.fontColor.value = 'text1'
          }
          textStyle.text = paragraphText
          textStyle.length = paragraphText.length

          // 创建新的段落对象
          const newParagraph = JSON.parse(JSON.stringify(arr[index]))
          newParagraph.runs = [textStyle]
          endParagraphs.push(newParagraph)
          paragraphs.push(newParagraph)
        }
      } else {
        // 处理没有pList的情况
        const runs = arr[0]?.runs[0]
        if (runs) {
          const newRuns = JSON.parse(JSON.stringify(runs))
          newRuns.text = content
          if (newRuns.fontColor && colorList) {
            newRuns.fontColor.templateThemeColors = colorList
          }
          if (defaultColorTheme() && newRuns?.fontColor?.value === 'bg2') {
            newRuns.fontColor.value = 'text1'
          }
          newRuns.len = content.length
          const newParagraph = JSON.parse(JSON.stringify(arr[0]))
          newParagraph.runs = [newRuns]
          paragraphs.push(newParagraph)
          endParagraphs.push(newParagraph)
        }
      }

      // 只有当paragraphs不为空时才更新
      if (paragraphs.length > 0) {
        if (isEnd) {
          paragraphs = [...oldParagraphs, ...endParagraphs]
        }
        element.text.paragraphs = paragraphs
        await setTextContent(element, element.type)
        const newSlide = slides.value[slideIndex.value]
        slideStore.updateSlide({
          elements: newSlide.elements,
        })
      } else {
      }
    } catch (error) {}
  }
  const processParagraphs = (paragraphs: any) => {
    const result: string[] = []
    paragraphs.forEach((paragraph: any) => {
      const match = paragraph.match(/^(\d+\..+?)：(.+)$/)
      if (match) {
        // 提取标题和内容
        const title = match[1]
        const content = match[2]
        // 将标题和内容分别添加到结果数组
        result.push(`${title}：`)
        result.push(content)
      } else {
        // 如果未匹配到格式，将原文添加到结果数组
        result.push(paragraph)
      }
    })
    return result
  }

  // 初始化
  initOption()

  // 监听selectedSlidesIndex变化
  watch(
    () => selectedSlidesIndex.value,
    () => {
      getHistroyId()
    }
  )

  // 返回公共方法和状态
  return {
    option,
    openChatBar,
    textType,
    textOpction,
    imgOpction,
    assistOption,
    translationOption,
    generationOption,
    handleOpenBar,
    getHistroyId,
    selectCursorBeforeText,
    replaceCurrentTextNode,
    chatChangeText,
    aiTranslate,
  }
}
