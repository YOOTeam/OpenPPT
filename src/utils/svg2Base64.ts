// svg转base64图片，参考：https://github.com/scriptex/svg64

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
const PREFIX = 'data:image/svg+xml;base64,'
import { getSvgPathRange } from '@/utils/svgPathParser'

const utf8Encode = (string: string) => {
  string = string.replace(/\r\n/g, '\n')
  let utftext = ''

  for (let n = 0; n < string.length; n++) {
    const c = string.charCodeAt(n)

    if (c < 128) {
      utftext += String.fromCharCode(c)
    }
    else if (c > 127 && c < 2048) {
      utftext += String.fromCharCode((c >> 6) | 192)
      utftext += String.fromCharCode((c & 63) | 128)
    }
    else {
      utftext += String.fromCharCode((c >> 12) | 224)
      utftext += String.fromCharCode(((c >> 6) & 63) | 128)
      utftext += String.fromCharCode((c & 63) | 128)
    }
  }

  return utftext
}

const encode = (input: string) => {
  let output = ''
  let chr1, chr2, chr3, enc1, enc2, enc3, enc4
  let i = 0
  input = utf8Encode(input)
  while (i < input.length) {
    chr1 = input.charCodeAt(i++)
    chr2 = input.charCodeAt(i++)
    chr3 = input.charCodeAt(i++)
    enc1 = chr1 >> 2
    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4)
    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6)
    enc4 = chr3 & 63
    if (isNaN(chr2)) enc3 = enc4 = 64
    else if (isNaN(chr3)) enc4 = 64
    output = output + characters.charAt(enc1) + characters.charAt(enc2) + characters.charAt(enc3) + characters.charAt(enc4)
  }
  return output
}

const urlToBase64 = (url: any) => {
  // 将URL转换为ASCII字符串
  const asciiString = encodeURI(url)
  // 将ASCII字符串转换为二进制字符串
  let binaryString = ''
  for (let i = 0; i < asciiString.length; i++) {
    binaryString += String.fromCharCode(asciiString.charCodeAt(i) & 0xff)
  }
  // 对二进制字符串进行Base64编码
  const base64String = btoa(binaryString)
  return base64String
}

export const svg2Base64 = (element: Element) => {
  const XMLS = new XMLSerializer()
  const svg = XMLS.serializeToString(element)
  return PREFIX + encode(svg)
}
export const setCanvasImg = (paths: any, data: any) => {
  return new Promise((resolve) => {
    const { maxX, maxY } = getSvgPathRange(paths)

    const canvas = document.createElement('canvas')
    canvas.width = maxX
    canvas.height = maxY
    canvas.style.position = 'absolute'
    canvas.style.top = '0'
    const ctx = canvas.getContext('2d')
    const image = new Image()
    // 假设这是你的复杂path的d属性
    const pathD = paths
    // 加载图片（请替换为你的图片URL）
    image.src = data.src
    image.setAttribute('crossOrigin', 'anonymous')
    image.onload = () => {
      // 绘制图片
      // 创建路径
      const path = new Path2D(pathD)
      // 裁剪图片
      ctx.clip(path)
      // 绘制裁剪后的图片
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

      const imgUrl = canvas.toDataURL('image/png')
      resolve(imgUrl)
    }
    image.onerror = () => {
      resolve({ message: '相片处理失败' })
    }
  })
}

const base64 = (url: any) => {
  return new Promise((resolve) => {
    const image = new Image()
    // 先设置图片跨域属性
    image.crossOrigin = 'Anonymous'
    // 再给image赋值src属性，先后顺序不能颠倒
    image.src = url
    image.onload = function () {
      const canvas: any = document.createElement('CANVAS')
      // 设置canvas宽高等于图片实际宽高
      canvas.width = image.width
      canvas.height = image.height
      canvas.globalAlpha = 1
      const context = canvas.getContext('2d')
      context.drawImage(image, 0, 0)
      const dataURL = canvas.toDataURL('image/png')
      resolve(dataURL)
    }
    image.onerror = () => {
      resolve({ message: '相片处理失败' })
    }
  })
}

const getImgImg = async (url: any) => {
  const base64str = await base64(url)
  return base64str
}

const deepCloneDOM = (element: any) => {
  // 将元素转换为HTML字符串
  const html = element.outerHTML

  // 使用DOM解析器创建新的DOM元素
  const newElement = document.createElement('div')
  newElement.innerHTML = html

  // 获取新元素的第一个子节点，这将是原元素的深度复制
  const clonedElement = newElement.children[0]

  // 返回深度复制的元素
  return clonedElement
}

// 图形图片填充
export const svgImgBase64 = async (element: Element) => {
  const clonedElement = deepCloneDOM(element)
  const XMLS = new XMLSerializer()
  const images = clonedElement.querySelectorAll('image')[0]
  const href = images.getAttribute('xlink:href')
  const base64Img: any = await getImgImg(href)
  images.setAttribute('xlink:href', base64Img)

  const svg = XMLS.serializeToString(clonedElement)
  const stringUTF8 = unescape(encodeURIComponent(svg))
  // 使用btoa将UTF-8编码的字节转换为Base64编码
  const base64 = btoa(stringUTF8)

  // 返回Base64编码的数据URL
  return `data:image/svg+xml;base64,${base64}`
}