import { padStart } from 'lodash'
import CryptoJS from 'crypto-js'
import axios from 'axios'

export const fileMd5Sum = (file: any) => {
  return new Promise((resolve) => {
    const fileReader = new FileReader()
    fileReader.onloadend = (ev: any) => {
      resolve(
        CryptoJS.MD5(CryptoJS.enc.Latin1.parse(ev.target.result)).toString(
          CryptoJS.enc.Hex
        )
      )
    }
    fileReader.readAsBinaryString(file)
  })
}
/**
 * 补足数字位数
 * @param digit 数字
 * @param len 位数
 */
export const fillDigit = (digit: number, len: number) => {
  return padStart('' + digit, len, '0')
}

/**
 * 判断设备
 */
export const isPC = () => {
  let match = !navigator.userAgent.match(
    /(iPhone|iPod|iPad|Android|Mobile|BlackBerry|Symbian|Windows Phone)/i
  )
  const appKeyList = ['isTablet', 'Tablet']
  const appKey: any = localStorage.getItem('appKey')
  if (appKeyList.includes(appKey)) {
    match = true
  }

  return match
}

/**
 * 判断URL字符串
 */
export const isValidURL = (url: string): boolean => {
  try {
    // 1. 基本格式校验（协议、域名、路径）
    const pattern = /^https?:\/\/(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?$/
    if (!pattern.test(url)) return false
    // 2. 通过 URL 构造函数进一步验证
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function isHtmlString(str: string): boolean {
  if (!str || typeof str !== 'string') return false
  const trimmedStr = str.trim()

  // 检查是否包含HTML标签特征
  // 匹配开始标签、结束标签、自闭合标签
  const htmlTagRegex = /<\/?[a-z][^>]*>/i
  // 匹配DOCTYPE声明
  const doctypeRegex = /^<!DOCTYPE html/i
  // 匹配常见HTML根标签
  const htmlRootTagRegex =
    /<(html|body|head|div|p|span|table|ul|ol|li|h[1-6])[\s>]/i

  return (
    htmlTagRegex.test(trimmedStr) ||
    doctypeRegex.test(trimmedStr) ||
    htmlRootTagRegex.test(trimmedStr)
  )
}

export const returnRem = () => {
  const _isPC = isPC()
  const html: any = document.querySelector('html')
  const clientWidth = html.offsetWidth
  let rem = clientWidth / 1920

  if (clientWidth <= rem) {
    rem = 0.732292
  }

  if (!_isPC) {
    rem = clientWidth / 460
    if (rem < 0.7) {
      rem = 0.732292
    }
  }
  return rem
}

export const fetchUrl = async (url: string) => {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then((response) => {
        if (response.ok) {
          return response.text()
        }
        reject('Network response was not ok.')
      })
      .then((text) => {
        resolve(text)
      })
      .catch((error) => {
        console.error('There was a problem with the fetch operation:', error)
        reject(error)
      })
  })
}

export function createRequest() {
  const source = axios.CancelToken.source() // 创建取消令牌
  const request: any = (config: any) =>
    instance({
      ...config,
      cancelToken: source.token, // 将取消令牌添加到请求中
    })
  const cancel = (message: any) => source.cancel(message) // 取消请求的方法
  return { request, cancel }
}

export function convertToNumber(str: string) {
  // 定义各种数字表示形式的映射关系
  const numberMappings: any = {
    // 阿拉伯数字
    '0': 0,
    '0.': 0,
    '0、': 0,
    '00': 0,
    '1': 1,
    '1.': 1,
    '1、': 1,
    '01.': 1,
    '01、': 1,
    '01': 1,
    '2': 2,
    '2.': 2,
    '2、': 2,
    '02': 2,
    '02.': 2,
    '02、': 2,
    '3': 3,
    '3.': 3,
    '3、': 3,
    '03': 3,
    '03.': 3,
    '03、': 3,
    '4': 4,
    '4.': 4,
    '4、': 4,
    '04': 4,
    '04.': 4,
    '04、': 4,
    '5': 5,
    '5.': 5,
    '5、': 5,
    '05': 5,
    '05.': 5,
    '05、': 5,
    '6': 6,
    '6.': 6,
    '6、': 6,
    '06': 6,
    '06.': 6,
    '06、': 6,
    '7': 7,
    '7.': 7,
    '7、': 7,
    '07': 7,
    '07.': 7,
    '07、': 7,
    '8': 8,
    '8.': 8,
    '8、': 8,
    '08': 8,
    '08.': 8,
    '08、': 8,
    '9': 9,
    '9.': 9,
    '9、': 9,
    '09': 9,
    '09.': 9,
    '09、': 9,
    '10': 10,
    '10.': 10,
    '10、': 10,

    // 中文数字
    零: 0,
    〇: 0,
    壹: 1,
    一: 1,
    贰: 2,
    二: 2,
    两: 2,
    叁: 3,
    三: 3,
    肆: 4,
    四: 4,
    伍: 5,
    五: 5,
    陆: 6,
    六: 6,
    柒: 7,
    七: 7,
    捌: 8,
    八: 8,
    玖: 9,
    九: 9,
    拾: 10,
    十: 10,

    // 英文数字
    zero: 0,
    ZERO: 0,
    one: 1,
    ONE: 1,
    two: 2,
    TWO: 2,
    three: 3,
    THREE: 3,
    four: 4,
    FOUR: 4,
    five: 5,
    FIVE: 5,
    six: 6,
    SIX: 6,
    seven: 7,
    SEVEN: 7,
    eight: 8,
    EIGHT: 8,
    nine: 9,
    NINE: 9,
    ten: 10,
    TEN: 10,
  }

  // 去除字符串前后空格并转换为小写（英文数字需要）
  const normalizedStr: any = str.toString().trim().toLowerCase()

  // 检查映射表中是否存在该字符串
  if (numberMappings?.hasOwnProperty(normalizedStr)) {
    return numberMappings[normalizedStr]
  }

  // 处理带标点的数字（如"1."、"1、"等）
  const punctRemoved = normalizedStr.replace(/[.、,，]/g, '')
  if (typeof punctRemoved === 'number') {
    return punctRemoved
  }

  if (numberMappings.hasOwnProperty(punctRemoved)) {
    return numberMappings[punctRemoved]
  }

  const matchNumber = str.match(/\d+/g)
  if (matchNumber?.length) {
    return matchNumber.map(Number)[0]
  }

  const chineseChar = str.match(/[一二三四五六七八九十]/)?.[0]
  if (chineseChar && numberMappings.hasOwnProperty(chineseChar)) {
    return numberMappings[chineseChar]
  }

  // 如果无法识别，返回原始字符串或抛出错误
  return str // 或者 throw new Error(`无法识别的数字格式: ${str}`);
}

export function base64ToFile(base64: string, filename: string) {
  // 1. 提取 Base64 数据部分（去掉 data:image/png;base64,）
  const arr = base64.split(',')
  const mime = arr[0].match(/:(.*?);/)[1] // 获取 MIME 类型（如 image/png）
  const bstr = atob(arr[1]) // 解码 Base64 字符串

  // 2. 转换成 Uint8Array
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }

  // 3. 创建 Blob 并转换成 File
  const blob = new Blob([u8arr], { type: mime })
  return new File([blob], filename, { type: mime })
}

export function isSvgUrl(str: string): boolean {
  if (typeof str !== 'string') return false

  try {
    const url = new URL(str)
    return url.pathname.toLowerCase().endsWith('.svg')
  } catch (e) {
    // 如果不是完整URL，检查是否以.svg结尾
    return /\.svg($|\?)/i.test(str)
  }
}
export function isSvgHtml(str: string): boolean {
  if (typeof str !== 'string') return false

  const trimmedStr = str.trim()
  // 匹配<svg>...</svg>或自闭合<svg />
  const svgRegex = /^\s*<svg[\s>][\s\S]*?(<\/svg>|(\/>))\s*$/i
  return svgRegex.test(trimmedStr)
}
