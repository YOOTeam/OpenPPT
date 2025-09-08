const defaultOption = {
  id: 'watermark-id',
  // 防止别人外界破坏
  preventTamper: false,
  // 水印单个图片配置
  width: 400,
  height: 300,
  text: 'Utalk',
  padding: 180,
  font: '14px Times New Roman',
  fontColor: 'rgba(0, 0, 0, 0.3)',
  // 顺时针旋转的弧度
  rotateDegree: -45,
  // 平移变换
  translateX: 0,
  translateY: 0,
  // 水印容器的样式
  style: {
    'pointer-events': 'none',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    position: 'fixed',
    'z-index': 1000,
  },
}

// 观察配置
const observeConfig = {
  attributes: true,
  childList: true,
  characterData: true,
  subtree: true,
}

let container: any
let observer: any

function createImageUrl(options: any) {
  // 设置默认值
  const {
    text = 'Watermark',
    font = '16px Arial',
    fontColor = 'rgba(128, 128, 128, 0.6)',
    rotateDegree = -45,
    height = 100,
    translateX = 0,
    translateY = 0,
    padding = 40,
    offset = 20, // 默认偏移50px
    rowGap = 180, // 默认行间距80px
  } = options

  // 1. 先测量文本宽度（不旋转状态）
  const tempCanvas = document.createElement('canvas')
  const tempCtx = tempCanvas.getContext('2d')!
  tempCtx.font = font
  const textWidth = tempCtx.measureText(text).width

  // 2. 计算旋转后需要的Canvas尺寸
  const radians = (rotateDegree * Math.PI) / 180
  const rotatedWidth =
    Math.abs(textWidth * Math.cos(radians)) +
    Math.abs(height * Math.sin(radians))
  const rotatedHeight =
    Math.abs(textWidth * Math.sin(radians)) +
    Math.abs(height * Math.cos(radians))

  // 3. 创建足够大的Canvas
  const canvas = document.createElement('canvas')
  canvas.width = rotatedWidth + padding // 添加边距
  canvas.height = rotatedHeight + 40
  const ctx = canvas.getContext('2d')!

  // 4. 设置样式
  ctx.font = font
  ctx.fillStyle = fontColor
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 2
  ctx.shadowBlur = 2

  // 5. 移动到Canvas中心
  ctx.translate(canvas.width / 2, canvas.height / 2)

  // 6. 应用旋转
  ctx.rotate(radians)

  // 7. 应用额外偏移（如果有）
  ctx.translate(translateX, translateY)

  // 8. 绘制文本（从旋转后的中心点绘制）
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, -offset / 2, -rowGap / 2)

  // 绘制第二行文本（位置偏右）
  ctx.fillText(text, offset / 2, rowGap / 2)

  return canvas.toDataURL('image/png')
}
// 将背景填充至指定水印位置处
function createContainer(options?: any, forceCreate?: any) {
  const oldDiv = document.getElementById(options.id)
  if (!forceCreate && oldDiv) return container

  const url = createImageUrl(options)
  const div = oldDiv || document.createElement('div')
  div.id = options.id

  // 水印容器的父元素，默认document.body
  let parentEl = options.preventTamper
    ? document.body
    : options.parentEl || document.body

  if (typeof parentEl === 'string') {
    if (parentEl.startsWith('#')) parentEl = parentEl.substring(1)
    parentEl = document.getElementById(parentEl)
  }

  // 返回元素的大小及其相对于视口的位置。
  const rect = parentEl.getBoundingClientRect()
  // 默认：按照父元素的偏移位置

  options.style.width = '100%'
  options.style.height = '100%'
  div.style.cssText = getStyleText(options)
  div.setAttribute('class', '')
  div.style.background = 'url(' + url + ') repeat top left'

  !oldDiv && parentEl.appendChild(div)

  return div
}

// 获取配置中的style
function getStyleText(options?: any) {
  let ret = ''
  const style = options.style
  Object.keys(style).forEach((k) => {
    ret += k + ': ' + style[k] + ';'
  })
  return ret
}

// 监听元素
function observe(options?: any, observeBody?: any) {
  observeWatermark(options)
  observeBody && observeBodyElement(options)
}

// 监听水印
function observeWatermark(options?: any) {
  const target = container

  const childCallBack = () => {
    // 关闭上个观察，重新创建元素，重新观察
    observer.disconnect()
    container = createContainer(options, true)
    observer.observe(target, observeConfig)
  }

  observer = new MutationObserver(childCallBack)
  // 开始观察目标节点
  observer.observe(target, observeConfig)
}

// 监听body元素，如果水印element被删除，则重新创建&&重新监听
function observeBodyElement(options?: any) {
  const callback = (mutations?: any) => {
    mutations.forEach((m?: any) => {
      if (m.type === 'childList' && m.removedNodes.length > 0) {
        let watermarkNodeRemoved = false
        for (const n of m.removedNodes) {
          if (n.id === options.id) {
            watermarkNodeRemoved = true
          }
        }

        if (watermarkNodeRemoved) {
          container = createContainer(options)
          observe(options, false)
        }
      }
    })
  }
  const pObserver = new MutationObserver(callback)
  pObserver.observe(document.body, { childList: true, subtree: true })
}

// 入口函数
export function initWaterMark(options?: any) {
  options = !options ? defaultOption : { ...defaultOption, ...options }
  container = createContainer(options)
  options.preventTamper && observe(options, true)
}
