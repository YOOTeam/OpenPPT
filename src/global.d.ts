interface HTMLElement {
  webkitRequestFullScreen(options?: FullscreenOptions): Promise<void>
  mozRequestFullScreen(options?: FullscreenOptions): Promise<void>
  msRequestFullscreen(options?: FullscreenOptions): Promise<void>
}

interface Document {
  webkitFullscreenElement: Element | null
  mozFullScreenElement: Element | null
  msFullscreenElement: Element | null
  webkitCurrentFullScreenElement: Element | null
  mozCancelFullScreen(): Promise<void>
  webkitExitFullscreen(): Promise<void>
  msExitFullscreen(): Promise<void>
}

interface Window {
  _ASSETS_URL?: string // 静态资源替换
  _AIP_BASE_URL?: string // 定义可选的 _AIP_BASE_URL 属性
  _PROCESS_TRANSLATE?: boolean // 翻译
  _PROCESS_CONTENT?: boolean // 内容 描述
  _PROCESS_IMAGE?: boolean // 美化图片
  _APPKEYTOKEN?: string // token
}
