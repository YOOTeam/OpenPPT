import { customAlphabet } from 'nanoid'
import { defineStore } from 'pinia'
import { ToolbarStates } from '@/types/toolbar'
import type {
  CreatingElement,
  ShapeFormatPainter,
  TextFormatPainter,
} from '@/types/edit'
import type { DialogForExportTypes } from '@/types/export'
import { type TextAttrs, defaultRichTextAttrs } from '@/utils/prosemirror/utils'
import { SYS_FONTS } from '@/configs/font'
import { isSupportFont } from '@/utils/font'

import { useSlidesStore } from './slides'

interface ToolbarDataAttrs {
  showEmpty?: boolean
  type: string
  x: number
  y: number
  useact?: string
  contentStyle?: any
  activeTab?: string
}
const toolbarDataAttrs: ToolbarDataAttrs = {
  showEmpty: false,
  type: '',
  useact: 'add',
  x: 0,
  y: 0,
  contentStyle: { right: '100rem', left: 'auto' },
  activeTab: '',
}

export interface MainState {
  useInfo?: any
  userToken: string
  useFileId: string
  tempTimeMobile: string
  activeElementIdList: string[]
  handleElementId: string
  activeGroupElementId: string
  hiddenElementIdList: string[]
  canvasPercentage: number
  canvasScale: number
  canvasDragged: boolean
  thumbnailsFocus: boolean
  editorAreaFocus: boolean
  disableHotkeys: boolean
  gridLineSize: number
  showRuler: boolean
  creatingElement: CreatingElement | null
  creatingCustomShape: boolean
  availableFonts: typeof SYS_FONTS
  toolbarState: ToolbarStates
  clipingImageElementId: string
  isScaling: boolean
  richTextAttrs: TextAttrs
  selectedTableCells: string[]
  selectedSlidesIndex: number[]
  databaseId: string
  textFormatPainter: TextFormatPainter | null
  shapeFormatPainter: ShapeFormatPainter | null
  showSelectPanel: boolean
  showSearchPanel: boolean
  showNotesPanel: boolean
  showToolbar: boolean
  showLoadingMarks: boolean
  showBeautifyPage: boolean
  toolbarData: any | null
  screenCountTime: string
  showSaveBox: any
  showMobileChat: boolean
  presentation: any
  chatInfo: any
  viewTemlpate: any
  initDataTotal: any
  isViewHoverBg: any
  showDownLoadFile: boolean
  downloadFile: any
  mobileLayout: any
  mobileEditor: boolean
  showCarpSlide: any
  beautifyData: any
  beautifyDocument: any
  chatPPTBeautify: any
  beautifyFirstView: any
  mobileChangeMode: string
  mobileChatResule: any
  saveHistory: any
  createLoading: any
  isAddinData: any
  beautifyLoadingData: any
  showBeautifyTips: any
  operactionData: any
  drageTextCursor: string
  drageElement: boolean
  thesisData: any
  showBoxHover: boolean
  showElementHover: any
  editorToken?: string
  actionAnimation: any
  templateJson?: any
  naveBarSet: any
  errorData?: any // 错误数据
  sceneData?: any // 场景数据

  reload?: boolean
  saveTimerData?: any
  oldTimerData?: any
  playModal?: any
  hoverElementId?: any

  openNoTokenModal?: boolean
  openNoTokenToobal?: boolean
}

const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
)
export const databaseId = nanoid(10)

export const useMainStore = defineStore('main', {
  state: (): MainState => ({
    showCarpSlide: null, // 截图
    isViewHoverBg: '', // 美化hover
    useInfo: null, // 用户信息
    tempTimeMobile: '', // 移动端时间
    userToken: '',
    useFileId: '', // chatppt 文件id
    activeElementIdList: [], // 被选中的元素ID集合，包含 handleElementId
    handleElementId: '', // 正在操作的元素ID
    activeGroupElementId: '', // 组合元素成员中，被选中可独立操作的元素ID
    hiddenElementIdList: [], // 被隐藏的元素ID集合
    canvasPercentage: 90, // 画布可视区域百分比
    canvasScale: 1, // 画布缩放比例（基于宽度1000px）
    canvasDragged: false, // 画布被拖拽移动
    thumbnailsFocus: false, // 左侧导航缩略图区域聚焦
    editorAreaFocus: false, //  编辑区域聚焦
    disableHotkeys: false, // 禁用快捷键
    gridLineSize: 0, // 网格线尺寸（0表示不显示网格线）
    showRuler: false, // 显示标尺
    creatingElement: null, // 正在插入的元素信息，需要通过绘制插入的元素（文字、形状、线条）
    creatingCustomShape: false, // 正在绘制任意多边形
    availableFonts: SYS_FONTS, // 当前环境可用字体
    toolbarState: ToolbarStates.SLIDE_DESIGN, // 右侧工具栏状态
    clipingImageElementId: '', // 当前正在裁剪的图片ID
    richTextAttrs: defaultRichTextAttrs, // 富文本状态
    selectedTableCells: [], // 选中的表格单元格
    isScaling: false, // 正在进行元素缩放
    selectedSlidesIndex: [], // 当前被选中的页面索引集合
    databaseId, // 标识当前应用的indexedDB数据库ID
    textFormatPainter: null, // 文字格式刷
    shapeFormatPainter: null, // 形状格式刷
    showSelectPanel: false, // 打开选择面板
    showSearchPanel: false, // 打开查找替换面板
    showNotesPanel: false, // 打开批注面板
    showToolbar: false, // 打开工具面板
    showLoadingMarks: false, // 加载蒙层
    showBeautifyPage: false, // 美化
    toolbarData: toolbarDataAttrs, // 工具栏
    screenCountTime: '00:00', // 播放的倒计时
    showSaveBox: { show: false, view: true }, // 保存弹框
    showMobileChat: false,
    presentation: null, // ppt解析的 ppt 信息 保存需要
    chatInfo: {
      status: 'init', // 初始化 init start 开始录音 stop 暂停录音 success 录影发送后台成功 error 发送后台失败
      content: '', // 录影内容
      toChatData: {
        ppt_id: '',
        ppt_selects: '',
        input_text: '',
      },
      fromChatData: {},
    },
    viewTemlpate: {
      show: false,
      data: null,
    }, // 视觉模型 模版展示
    initDataTotal: 0, // 初始化/上传文档是的 总页数
    showDownLoadFile: false, // 显示下载进度
    downloadFile: '', // chatppt 那边过来的下载标识
    mobileEditor: false,
    mobileLayout: false, // 移动端的模版交互需要用的
    beautifyData: null, // 每一张的美化数据 章节ID 截图 和视觉模型数据
    beautifyDocument: null, // 上传美化的数据 美化接口需要的
    chatPPTBeautify: false, // chatppt过来的ppt 是否需要美化
    beautifyFirstView: null, // 美化的第一个章节的视觉模型数据 上传美化的主题模版需要
    mobileChangeMode: '', // 移动端切换模式
    mobileChatResule: null, // 移动端chat结果执行
    saveHistory: {
      isloading: false,
      activeTime: '',
      activeId: '',
    },
    createLoading: {
      loadingType: 1,
    },
    isAddinData: {}, // 插件跳转
    beautifyLoadingData: {}, // 美化
    showBeautifyTips: {}, // 显示美化引导
    operactionData: {}, // 点击分享 下载 未登录时 记录一下状态 实现登录后继续后面操作
    drageTextCursor: '', // 拖拽文本框时修改鼠标样式
    drageElement: false, // 是否是拖拽
    thesisData: {
      show: false,
    },
    showBoxHover: false,
    showElementHover: {
      show: false,
      style: {},
    },
    editorToken: '',
    actionAnimation: false, // 开启动画
    templateJson: null, // 模版json
    naveBarSet: null, // 权限
    errorData: {}, // 错误数据
    sceneData: null, // 场景数据
    reload: false,
    saveTimerData: {},
    oldTimerData: {},
    playModal: 'base',
    hoverElementId: null, // 鼠标悬停的元素

    openNoTokenModal: false,
    openNoTokenToobal: false,
  }),

  getters: {
    isAllDisableEdit(state) {
      return false
    },
    getPPTStyle(state) {
      const list = state.presentation?.tags?.normal
      const style: any = list?.length
        ? list.find((item: any) => item.key === 'TAG_PRESENTATION_STYLE')
        : null
      return style?.value || state.presentation?.style
    },
    getPPTLanguage(state) {},
    activeElementList(state) {
      const slidesStore = useSlidesStore()
      const currentSlide = slidesStore.currentSlide
      if (!currentSlide || !currentSlide.elements) return []
      return currentSlide.elements.filter((element) =>
        state.activeElementIdList.includes(element.id)
      )
    },
    handleElement(state) {
      const slidesStore = useSlidesStore()
      const currentSlide = slidesStore.currentSlide
      if (!currentSlide || !currentSlide.elements) return null
      return (
        currentSlide.elements.find(
          (element) => state.handleElementId === element.id
        ) || null
      )
    },
  },
  actions: {
    setOpenNoTokenModal(data: boolean) {
      this.openNoTokenModal = data
    },
    setOpenNoTokenToobal(data: boolean) {
      this.openNoTokenToobal = data
    },
    setPlayModal(value: string) {
      this.playModal = value
    },
    setHoverElementId(elementId: any) {
      this.hoverElementId = elementId
    },
    setOldTimerData(data: any) {
      this.oldTimerData = data
    },
    setSaveTimerData(data: any) {
      this.saveTimerData = data
    },
    setReload(value: boolean) {
      this.reload = value
    },

    setSceneData(data: any) {
      this.sceneData = data
    },

    setTemplateJson(templateJson: any) {
      this.templateJson = templateJson
    },
    setActionAnimation(show: boolean) {
      this.actionAnimation = show
    },

    setShowElementHover(data: any) {
      this.showElementHover = { ...this.showElementHover, ...data }
    },
    setShowBoxHover(show: boolean) {
      this.showBoxHover = show
    },

    setDrageElement(drag: boolean) {
      this.drageElement = drag
    },
    setDrageTextCursor(cursor: string) {
      this.drageTextCursor = cursor
    },
    setOperactionData(data: any) {
      this.operactionData = { ...this.operactionData, ...data }
    },
    setShowBeautifyTips(data: any) {
      this.showBeautifyTips = { ...this.beautifyLoadingData, ...data }
    },
    setbeautifyLoadingData(data: any) {
      this.beautifyLoadingData = { ...this.beautifyLoadingData, ...data }
    },
    setIsAddinData(data: any) {
      this.isAddinData = { ...this.isAddinData, ...data }
    },
    setCreateLoading(data: any) {
      this.createLoading = { ...this.createLoading, ...data }
    },
    setCreateLoadingData(data: any) {
      this.createLoading = data
    },

    setSaveHistory(data: any) {
      this.saveHistory = { ...this.saveHistory, ...data }
    },
    setMobileChatResule(data: any) {
      this.mobileChatResule = data
    },
    setMobileChangeMode(data: string) {
      this.mobileChangeMode = data
    },
    setBeautifyFirstView(data: any) {
      this.beautifyFirstView = data
    },
    setChatPPTBeautify(data: any) {
      this.chatPPTBeautify = data
    },
    setBeautifyDocument(data: any) {
      this.beautifyDocument = { ...this.beautifyDocument, ...data }
    },
    removeBeautifyDocument(data: any) {
      this.beautifyDocument = data
    },
    setBeautifyData(data: any) {
      this.beautifyData = { ...this.beautifyData, ...data }
    },
    setBeautifyDataNew(data: any) {
      this.beautifyData = data
    },
    setShowCarpSlide(data: any) {
      this.showCarpSlide = { ...this.showCarpSlide, ...data }
    },
    setTempTimeMobile(data: string) {
      this.tempTimeMobile = data
    },
    setMobileEditor(data: boolean) {
      this.mobileEditor = data
    },
    setMobileLayout(data: any) {
      this.mobileLayout = data
    },
    setDownloadFile(data: any) {
      this.downloadFile = data
    },
    setShowDownLoadFile(data: any) {
      this.showDownLoadFile = data
    },
    setInitDataTotal(data: any) {
      this.initDataTotal = data
    },
    setChatInfo(data: any) {
      this.chatInfo = { ...this.chatInfo, ...data }
    },
    setPresentation(presentation: any) {
      this.presentation = presentation
    },
    setPresentationItem(data: any) {
      this.presentation = { ...this.presentation, ...data }
    },
    setShowMobileChat(showMobileChat: boolean) {
      this.showMobileChat = showMobileChat
    },
    setSaveBoxShow(showSaveBox: any) {
      this.showSaveBox = showSaveBox
    },
    setIsViewHoverBg(color: string) {
      this.isViewHoverBg = color
    },
    setUseInfo(useInfo: any) {
      this.useInfo = { ...this.useInfo, ...useInfo }
    },
    setToken(userToken: string) {
      this.userToken = userToken
    },
    setUseFileId(useFileId: string) {
      this.useFileId = useFileId
      localStorage.setItem('fileID', useFileId)
    },
    setScreenCountTime(screenCountTime: string) {
      this.screenCountTime = screenCountTime
    },
    setActiveElementIdList(activeElementIdList: string[]) {
      if (activeElementIdList.length === 1) {
        this.handleElementId = activeElementIdList[0]
      } else this.handleElementId = ''

      this.activeElementIdList = activeElementIdList
    },

    setHandleElementId(handleElementId: string) {
      this.handleElementId = handleElementId
    },

    setActiveGroupElementId(activeGroupElementId: string) {
      this.activeGroupElementId = activeGroupElementId
    },

    setHiddenElementIdList(hiddenElementIdList: string[]) {
      this.hiddenElementIdList = hiddenElementIdList
    },

    setCanvasPercentage(percentage: number) {
      this.canvasPercentage = percentage
    },

    setCanvasScale(scale: number) {
      this.canvasScale = scale
    },

    setCanvasDragged(isDragged: boolean) {
      this.canvasDragged = isDragged
    },

    setThumbnailsFocus(isFocus: boolean) {
      this.thumbnailsFocus = isFocus
    },

    setEditorareaFocus(isFocus: boolean) {
      this.editorAreaFocus = isFocus
    },

    setDisableHotkeysState(disable: boolean) {
      this.disableHotkeys = disable
    },

    setGridLineSize(size: number) {
      this.gridLineSize = size
    },

    setRulerState(show: boolean) {
      this.showRuler = show
    },

    setCreatingElement(element: CreatingElement | null) {
      this.creatingElement = element
    },

    setCreatingCustomShapeState(state: boolean) {
      this.creatingCustomShape = state
    },

    setAvailableFonts() {
      this.availableFonts = SYS_FONTS.filter((font) =>
        isSupportFont(font.value)
      )
    },

    setToolbarState(toolbarState: ToolbarStates) {
      this.toolbarState = toolbarState
    },

    setClipingImageElementId(elId: string) {
      this.clipingImageElementId = elId
    },

    setRichtextAttrs(attrs: TextAttrs) {
      this.richTextAttrs = attrs
    },

    setSelectedTableCells(cells: string[]) {
      this.selectedTableCells = cells
    },

    setScalingState(isScaling: boolean) {
      this.isScaling = isScaling
    },

    updateSelectedSlidesIndex(selectedSlidesIndex: number[]) {
      this.selectedSlidesIndex = selectedSlidesIndex
    },

    setTextFormatPainter(textFormatPainter: TextFormatPainter | null) {
      this.textFormatPainter = textFormatPainter
    },

    setToolbarData(toolbarData: any) {
      this.toolbarData = toolbarData
    },

    setToolbarItemData(data: any) {
      this.toolbarData = { ...this.toolbarData, ...data }
    },

    setViewTemplate(data: any) {
      this.viewTemlpate = { ...this.viewTemlpate, ...data }
    },

    updateViewTemplate(data: any) {
      this.viewTemlpate = data
    },

    setShapeFormatPainter(shapeFormatPainter: ShapeFormatPainter | null) {
      this.shapeFormatPainter = shapeFormatPainter
    },

    setShowLoadingMarks(show: boolean) {
      this.showLoadingMarks = show
    },

    setShowBeautifyPage(show: boolean) {
      this.showBeautifyPage = show
    },

    setShowToolbar(show: boolean) {
      this.showToolbar = show
      if (show) {
        this.thesisData = false
      }
    },
    setSelectPanelState(show: boolean) {
      this.showSelectPanel = show
    },

    setSearchPanelState(show: boolean) {
      this.showSearchPanel = show
    },

    setNotesPanelState(show: boolean) {
      this.showNotesPanel = show
    },
  },
})
