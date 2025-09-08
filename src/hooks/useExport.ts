import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { filter, trim } from 'lodash'
import { saveAs } from 'file-saver'
import pptxgen from 'pptxgenjs'
import { json2ppt } from '@/api/careate'
import tinycolor from 'tinycolor2'
import { toPng, toJpeg } from 'html-to-image'
import { onUploads } from '@/utils/upload'
import jsBridge from 'ym-jsbridge'
import { base64ToFile, isPC } from '@/utils/common'
import { useSlidesStore, useMainStore } from '@/store'
import type {
  PPTElementOutline,
  PPTElementShadow,
  PPTElementLink,
  Slide,
} from '@/types/slides'
import {
  getElementRange,
  getLineElementPath,
  getTableSubThemeColor,
} from '@/utils/element'
import { type AST, toAST } from '@/utils/htmlParser'
import { type SvgPoints, toPoints } from '@/utils/svgPathParser'
import { encrypt } from '@/utils/crypto'
import { svg2Base64, svgImgBase64, setCanvasImg } from '@/utils/svg2Base64'
import message from '@/utils/message'
import useColor from '@/hooks/useColor'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { CLIPPATHS } from '@/configs/imageClip'
import $ from 'jquery'
import { useI18n } from 'vue-i18n'
interface ExportImageConfig {
  quality: number
  width: number
  fontEmbedCSS?: string
}

export default () => {
  const { t } = useI18n()

  const _isPC = isPC()
  const { initColor } = useColor()
  const slidesStore = useSlidesStore()
  const mainStore = useMainStore()
  const ratio = 72 / 96
  const exportStatus = ref('')
  const exportPPTXFile = ref('')
  const { presentation, useFileId, sceneData, saveTimerData } =
    storeToRefs(mainStore)
  const { slides, theme, viewportRatio, title, viewportSize, themeColorList } =
    storeToRefs(slidesStore)

  const getColor = (color: any) => {
    const type = typeof color
    let data = color
    if (type === 'string') {
      data = {
        type: 'rgb', // 类型：themeColor、rgb
        value: color, // 颜色值，如果是themeColor，则为id；否则为十六进制色值
        transparent: 1, // 不透明度0~1
      }
    }
    if (data?.value) {
      if (data?.value.indexOf('rgba') > -1) {
        const color = data.value
        const colorData = tinycolor(color)
        data.value = `rgb(${colorData.toRgb().r},${colorData.toRgb().g},${
          colorData.toRgb().b
        })`
        data.transparent = tinycolor(color).toRgb().a
      }
    }
    return data
  }

  const getGradientColor = (colors: any) => {
    let newColor = colors
    if (!Array.isArray(colors)) return colors
    newColor = newColor.map((item: any) => {
      if (typeof item === 'string') {
        const color = item
        item = {
          type: 'rgb', // 类型：themeColor、rgb
          value: color, // 颜色值，如果是themeColor，则为id；否则为十六进制色值
          transparent: 1, // 不透明度0~1
        }
      } else {
        if (typeof item.color === 'string') {
          item.color = {
            type: 'rgb', // 类型：themeColor、rgb
            value: item.color, // 颜色值，如果是themeColor，则为id；否则为十六进制色值
            transparent: 1, // 不透明度0~1
          }
        }
      }
      return item
    })

    return newColor
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
    if (JSON.stringify(colorList) === JSON.stringify(defaultColor)) {
      return true
    }
    return false
  }
  // 替换模版的文本
  const slideTextContentReplace = (oldData: any, data: any, flage?: string) => {
    const content =
      oldData.type === 'shape' ? oldData.text.content : oldData.content
    const textProps = htmlToJsonData(content, null, '', data)
    let str = ''
    if (textProps) {
      str = textProps.text
    }

    const colorList =
      data.type === 'shape'
        ? data.text?.defaultColor?.templateThemeColors
        : data?.defaultColor?.templateThemeColors

    const paragraphs = []
    if (!data.text) {
      data.text = {}
    }
    if (data.text?.paragraphs?.length) {
      const arr = data.text.paragraphs[0]
      if (textProps.paragraphs?.length > 1 && flage === 'content') {
        let temp = textProps.paragraphs.map((item: any) => {
          let content = ''
          if (item.runs?.length) {
            item.runs.forEach((item: any) => {
              content += item.text
            })
          }
          return content
        })
        temp = temp.filter((item: any) => item)
        let countNum = 0
        for (let index = 0; index < temp.length; index++) {
          const element = temp[index]
          if (!arr.runs[0]) {
            paragraphs.push([])
            return
          }
          const textStyle = JSON.parse(JSON.stringify(arr.runs[0]))

          let isTitle = false
          const num = index + 1
          if (num % 2 > 0 && element.length < temp[index + 1]?.length) {
            // 是奇数行 并且字数小于偶数行
            textStyle.fontSize = textStyle.fontSize + 2
            textStyle.bold = true
            textStyle.fontColor = {
              type: 'themeColor',
              value: 'accent1',
              transparent: '1',
              brightness: '-30',
            }
            isTitle = true
            countNum += 1
          } else {
            textStyle.fontSize = textStyle.fontSize - 2
          }

          if (textStyle.fontColor && colorList) {
            textStyle.fontColor.templateThemeColors = colorList
          }
          if (defaultColorTheme() && textStyle.fontColor.value === 'bg2') {
            textStyle.fontColor.value = 'text1'
          }
          textStyle.text = element
          textStyle.length = element.length
          const runsArr = JSON.parse(JSON.stringify(arr))
          runsArr.runs = [textStyle]
          if (isTitle && countNum > 1) {
            runsArr.paragraphSpace = 15
          }
          paragraphs.push(runsArr)
        }
      } else {
        if (arr.runs?.length) {
          arr.runs = [arr.runs[0]]
          const runs = arr.runs[0]
          runs.text = str
          if (runs.fontColor) {
            runs.fontColor.templateThemeColors = colorList
          }
          if (defaultColorTheme() && runs.fontColor.value === 'bg2') {
            runs.fontColor.value = 'text1'
          }
          runs.len = str.length
          paragraphs.push(arr)
        }
      }
    }
    data.text.paragraphs = paragraphs
    data.text.text = str
    if (data?.text?.content) {
      data.text.content = ''
    }
    data.content = ''
  }

  const returnColor = (
    color: string,
    colorString?: string,
    colorData?: any
  ) => {
    let obect: any
    const tColor = tinycolor(color)
    const nColor = colorString ? tinycolor(colorString) : ''
    const styleColor = tColor.getFormat()
    const importColor = nColor ? nColor.getFormat() : ''
    if (styleColor === importColor) {
      obect = colorData ? JSON.parse(JSON.stringify(colorData)) : null
    } else {
      const tRgb = tColor.toRgbString()
      const nRbg = nColor ? nColor.toRgbString() : ''
      if (tRgb === nRbg) {
        obect = colorData ? JSON.parse(JSON.stringify(colorData)) : null
      } else {
        const hColor = tColor.toHexString()
        let sameColor = false
        for (const key in themeColorList?.value) {
          const element = themeColorList.value[key]
          const themeColor = tinycolor(element)
          const themeHex = themeColor.toHexString()
          if (hColor === themeHex) {
            sameColor = true
            obect = {
              value: key,
              type: 'themeColor',
              transparent: '1',
            }
            break
          }
        }
        if (!sameColor && obect) {
          obect.type = 'rgb'
          obect.value = tColor.toHexString()
        }
        if (obect) {
          const rgba = tColor.toRgb()
          obect.transparent = '' + rgba.a
        }
      }
    }

    if (obect?.transparent) {
      obect.transparent =
        typeof obect.transparent === 'string'
          ? obect.transparent
          : '' + obect.transparent
    }

    const key = [
      'text1',
      'bg1',
      'text2',
      'bg2',
      'accent1',
      'accent2',
      'accent3',
      'accent4',
      'accent5',
      'accent6',
    ]
    if (obect?.transparent) {
      obect.transparent = '' + obect.transparent
    }
    if (obect?.value && key.includes(obect.value)) {
      obect.type = 'themeColor'
    }
    return obect
  }

  const spanContentToJson = (
    element: any,
    colorData?: any,
    colorString?: string,
    textData?: any
  ) => {
    const textList: any = []
    const textStyle: any = []
    function getDomChildren(node: any, array: any = []): any {
      // 将当前节点的信息添加到数组中
      array.push({
        nodeName: node.nodeName,
        node: node,
        children: [],
      })

      if (node.nodeType !== Node.ELEMENT_NODE) {
        textList.push(node.textContent)
      }
      // 遍历所有子节点
      for (let i = 0; i < node.childNodes.length; i++) {
        // 递归调用函数处理每个子节点
        getDomChildren(node.childNodes[i], array[array.length - 1].children)
      }
      return array
    }

    function listSet(arr: any): any {
      const result: any = []
      for (let index = 0; index < arr.length; index++) {
        const element = arr[index]
        if (element.nodeName === 'P') {
          return element.children
        }
        if (element.children.length) {
          listSet(element.children)
        }
      }
      return result
    }

    function setStyle(arr: any, isFirst: boolean, obj?: any): any {
      for (let index = 0; index < arr.length; index++) {
        const obect = isFirst ? {} : JSON.parse(JSON.stringify(obj))
        const element = arr[index]

        if (element.node.nodeName === 'STRONG') {
          obect.bold = true
        }
        if (element.node.nodeName === 'EM') {
          obect.italic = true
        }
        if (element.node.nodeName === 'CODE') {
          obect.code = true
        }
        if (element.node.nodeName === 'SUB') {
          obect.sub = true
        }
        if (element.node.nodeName === 'SUP') {
          obect.sup = true
        }

        if (element.node.nodeName === '#text') {
          obect.text = element.node.textContent
          obect.len = element.node.textContent.length
          obect.start = 0
          textStyle.push(obect)
        }
        if (element.node.nodeName === 'SPAN') {
          const tempDiv: any = document.createElement('div')
          tempDiv.innerHTML = element.node.outerHTML
          const style = tempDiv?.firstChild?.style
          const fontSize = style?.fontSize
          const underline = style?.textDecoration
          const textDecorationLine = style?.textDecorationLine
          const backgroundColor = style?.backgroundColor
          const color = style?.color
          const fontFamily = style?.fontFamily
          if (textData?.defaultColor) {
            obect.fontColor = textData.defaultColor
          }
          if (textData?.defaultFontName) {
            obect.fontName = textData.defaultFontName
          }
          if (color) {
            obect.fontColor = {
              value: color,
              type: 'rgb',
              transparent: '1',
            }
            const newObj = returnColor(color, colorString, colorData)
            if (newObj) {
              obect.fontColor = newObj
            }
          }
          if (fontSize) {
            obect.fontSize = parseInt(fontSize)
          }
          if (underline) {
            obect.underline = underline
          }
          if (textDecorationLine) {
            obect.delline = textDecorationLine
          }
          if (backgroundColor) {
            obect.backgroundColor = {
              value: backgroundColor,
              type: 'rgb',
              transparent: '1',
            }
            const newObj = returnColor(backgroundColor, colorString, colorData)
            if (newObj) {
              obect.backgroundColor = newObj
            }
          }
          if (fontFamily) {
            obect.fontFamily = fontFamily
          }
        }

        if (element.children.length) {
          setStyle(element.children, false, obect)
        }
      }
    }
    const list = getDomChildren(element)
    const resultList = listSet(list)
    setStyle(resultList, true)
    return {
      textStyle,
      textList,
    }
  }

  const htmlToJsonData = (
    str: any,
    colorData?: any,
    color?: string,
    textdata?: any,
    dataNoReplace?: boolean // 是否不需要转化单位
  ) => {
    let data: any = {
      text: '',
    }
    const parser = new DOMParser()
    const doc = parser.parseFromString(str, 'text/html')
    const domObj: any = doc.body.childNodes
    if (!domObj) return
    const leng = domObj.length
    let text = ''
    const paragraphsList: any = []
    function pNodeSetStyle(
      dom: any,
      styleObj: any,
      colorData: any,
      color: any,
      textdata: any
    ) {
      const obj = JSON.parse(JSON.stringify(styleObj))
      const domStyle = dom?.style
      if (domStyle['text-align']) {
        obj.align = domStyle['text-align']
      }
      if (domStyle['line-height']) {
        obj.lineHeight = dataNoReplace
          ? parseFloat(domStyle['line-height'])
          : parseFloat(domStyle['line-height']) / ratio
      }
      if (domStyle['margin-top']) {
        obj.paragraphSpace = dataNoReplace
          ? parseFloat(domStyle['margin-top'])
          : parseFloat(domStyle['margin-top']) / ratio
      }
      if (domStyle['margin-bottom']) {
        obj.paragraphSpaceAfter = dataNoReplace
          ? parseFloat(domStyle['margin-bottom'])
          : parseFloat(domStyle['margin-bottom']) / ratio
      }
      const textContent = spanContentToJson(dom, colorData, color, textdata)

      obj.runs = textContent.textStyle
      return {
        content: dom.textContent,
        obj,
      }
    }
    for (let index = 0; index < leng; index++) {
      const element: any = domObj[index]
      const obj: any = {}
      if (element.nodeName === 'UL' || element.nodeName === 'OL') {
        const children = element.children
        const style = element?.style
        if (style['list-style-type']) {
          obj.bulletStyle = style['list-style-type']
        } else {
          obj.bulletStyle = 'disc'
        }
        for (let childIndex = 0; childIndex < children.length; childIndex++) {
          const elements = children[childIndex]
          if (elements.nodeName === 'LI') {
            const pNode = elements.firstChild
            if (pNode.nodeName === 'P') {
              const result = pNodeSetStyle(
                pNode,
                obj,
                colorData,
                color,
                textdata
              )
              paragraphsList.push(result.obj)
              text += result.content
            }
          }
        }
      } else if (element.nodeName === 'P') {
        const result = pNodeSetStyle(element, obj, colorData, color, textdata)
        paragraphsList.push(result.obj)
        text += result.content
      }
    }

    data = {
      paragraphs: paragraphsList,
      text: text,
    }

    return data
  }
  // 导入时的dom 解析 都不删
  const slideTextContentToData = (
    data: any,
    type?: any,
    dataNoReplace?: boolean // 是否不需要转化单位
  ) => {
    dataNoReplace = true
    const content = type === 'shape' ? data.text.content : data.content
    const textProps = htmlToJsonData(content, null, '', data, dataNoReplace)
    if (!data.text) {
      data.text = {}
    }
    data.text.paragraphs = textProps.paragraphs
    data.text.text = textProps.text

    if (!data.text.autoSize) {
      data.text.autoSize = 'none'
    }

    if (data.autoSize) {
      data.text.autoSize = data.autoSize
    }

    if (type === 'shape') {
      data.text.paragraphs.forEach((item: any) => {
        if (!item.lineHeight && data.text.lineHeight) {
          item.lineHeight = dataNoReplace
            ? parseFloat(data.text.lineHeight.toFixed(2))
            : parseFloat((data.text.lineHeight / ratio).toFixed(2))
        }

        if (!item.paragraphSpace && data.text.paragraphSpace) {
          item.paragraphSpace = dataNoReplace
            ? parseFloat(data.text.paragraphSpace.toFixed(2))
            : parseFloat((data.text.paragraphSpace / ratio).toFixed(2))
        }

        if (!item.wordSpace && data.text.wordSpace) {
          item.wordSpace = dataNoReplace
            ? parseFloat(data.text.wordSpace.toFixed(2))
            : parseFloat((data.text.wordSpace / ratio).toFixed(2))
        }

        if (!item.align) {
          item.align = 'left'
        }

        if (!item.indent) {
          item.indent = 0
        }
        if (item.runs?.length) {
          item.runs.forEach((el: any) => {
            if (!el.fontColor && data.text.defaultColor) {
              el.fontColor = data.text.defaultColor
            }
          })
        }
      })
    } else {
      data.text.paragraphs.forEach((item: any) => {
        if (!item.lineHeight && data.lineHeight) {
          item.lineHeight = dataNoReplace
            ? parseFloat(data.lineHeight.toFixed(2))
            : parseFloat((data.lineHeight / ratio).toFixed(2))
        }
        if (!item.paragraphSpace && data.paragraphSpace) {
          item.paragraphSpace = dataNoReplace
            ? parseFloat(data.paragraphSpace.toFixed(2))
            : parseFloat((data.paragraphSpace / ratio).toFixed(2))
        }
      })
      if (data.verticalAlign) {
        data.text.verticalAlign = data.verticalAlign
      }
      if (data.wordSpace) {
        data.text.wordSpace = data.wordSpace
      }
    }
  }

  // 导出时的用转json 有数据需要删除
  const slideTextContentToJson = (
    data: any,
    type?: any,
    dataNoReplace?: boolean
  ) => {
    const content = type === 'shape' ? data.text.content : data.content
    const textProps = htmlToJsonData(content, null, '', data, dataNoReplace)
    if (!data.text) {
      data.text = {}
    }
    if (textProps.paragraphs) {
      textProps.paragraphs.forEach((item: any) => {
        if (item.runs?.length) {
          item.runs.forEach((el: any) => {
            if (!el.bold) {
              el.bold = false
            }
            if (!el.delline) {
              el.delline = false
            }
            if (!el.italic) {
              el.italic = false
            }
            if (!el.underline) {
              el.underline = false
            }
          })
        }
      })
    }

    // 暂时没有兼容
    if (data.text.marginLeft) {
      data.text.marginLeft = 0
    }
    if (data.text.marginTop) {
      data.text.marginTop = 0
    }
    if (data.text.marginRight) {
      data.text.marginRight = 0
    }
    if (data.text.marginBottom) {
      data.text.marginBottom = 0
    }
    data.text.paragraphs = textProps.paragraphs
    data.text.text = textProps.text
    if (!textProps.text) {
      delete data.text
      return
    }

    if (!data.text.autoSize) {
      data.text.autoSize = 'none'
    }

    if (data.autoSize) {
      data.text.autoSize = data.autoSize
    }

    delete data.autoSize

    if (type === 'shape') {
      let verticalAlign = 'center'
      if (data.text.align) {
        verticalAlign = data.text.align
        delete data.text.align
      }
      data.text.verticalAlign = verticalAlign
      data.text.paragraphs.forEach((item: any) => {
        if (!item.lineHeight && data.text.lineHeight) {
          item.lineHeight = dataNoReplace
            ? parseFloat(data.text.lineHeight.toFixed(2))
            : parseFloat((data.text.lineHeight / ratio).toFixed(2))
        }
        if (!item.paragraphSpace && data.text.paragraphSpace) {
          item.paragraphSpace = dataNoReplace
            ? parseFloat(data.text.paragraphSpace.toFixed(2))
            : parseFloat((data.text.paragraphSpace / ratio).toFixed(2))
        }

        if (!item.wordSpace && data.text.wordSpace) {
          item.wordSpace = dataNoReplace
            ? parseFloat(data.text.wordSpace.toFixed(2))
            : parseFloat((data.text.wordSpace / ratio).toFixed(2))
        }

        if (!item.align) {
          item.align = 'left'
        }

        if (!item.indent) {
          item.indent = 0
        }
        if (item.runs?.length) {
          item.runs.forEach((el: any) => {
            if (!el.fontColor && data.text.defaultColor) {
              el.fontColor = data.text.defaultColor
              if (el.fontColor?.transparent) {
                el.fontColor.transparent = '' + el.fontColor.transparent
              }
            }

            if (!el.fontSize) {
              el.fontSize = 20
            }

            if (!el.fontName && data.text.defaultFontName) {
              el.fontName = data.text.defaultFontName
            }
          })
        }
      })

      delete data.text.lineHeight
      delete data.text.paragraphSpace
      delete data.text.wordSpace
      delete data.text.content
      delete data.text.defaultColor
      delete data.text.defaultFontName
    } else {
      data.text.paragraphs.forEach((item: any) => {
        if (!item.lineHeight && data.lineHeight) {
          item.lineHeight = dataNoReplace
            ? parseFloat(data.lineHeight.toFixed(2))
            : parseFloat((data.lineHeight / ratio).toFixed(2))
        } else {
          item.lineHeight = item.lineHeight
            ? dataNoReplace
              ? parseFloat(item.lineHeight.toFixed(2))
              : parseFloat((item.lineHeight / ratio).toFixed(2))
            : 0
        }
        if (!item.paragraphSpace && data.paragraphSpace) {
          item.paragraphSpace = dataNoReplace
            ? parseFloat(data.paragraphSpace.toFixed(2))
            : parseFloat((data.paragraphSpace / ratio).toFixed(2))
        } else {
          item.paragraphSpace = item.paragraphSpace
            ? dataNoReplace
              ? parseFloat(item.paragraphSpace.toFixed(2))
              : parseFloat((item.paragraphSpace / ratio).toFixed(2))
            : 0
        }

        if (!item.indent) {
          item.indent = 0
        }

        if (!item.align) {
          item.align = 'left'
        }

        if (item.runs?.length) {
          item.runs.forEach((el: any) => {
            if (!el.fontColor && data.defaultColor) {
              el.fontColor = data.defaultColor
              if (el.fontColor?.transparent) {
                el.fontColor.transparent = '' + el.fontColor.transparent
              }
            }
            if (!el.fontSize) {
              el.fontSize = 20
            }
            if (!el.fontName && data.defaultFontName) {
              el.fontName = data.defaultFontName
            }
          })
        }
      })

      if (data.verticalAlign) {
        data.text.verticalAlign = data.verticalAlign
      }

      if (data.wordSpace) {
        data.text.wordSpace = data.wordSpace
      }

      delete data.lineHeight
      delete data.paragraphSpace
      delete data.content
      delete data.defaultColor
      delete data.defaultFontName
      delete data.verticalAlign
      delete data.wordSpace
    }
  }

  const slideImage = (data: any) => {
    data.type = 'picture'

    if (data.colorMask) {
      data.colorMask = getColor(data.colorMask)
    }
    if (data.fillPicture) {
      delete data.fillPicture
    }

    if (data.imgFillType) {
      delete data.imgFillType
    }

    if (data.path) {
      const svgRef = document.querySelector(
        `.base-element-${data.id} svg`
      ) as HTMLElement
      if (svgRef) {
        const XMLS = new XMLSerializer()
        const svg = XMLS.serializeToString(svgRef)
        data.svgPath = svg
      }
    }
  }

  const slideShape = (data: any, dataReplace?: boolean) => {
    if (data.path) {
      const svgRef = document.querySelector(
        `.base-element-${data.id} svg`
      ) as HTMLElement
      if (svgRef) {
        const XMLS = new XMLSerializer()
        const svg = XMLS.serializeToString(svgRef)
        data.svgPath = svg
      }
    }
    if (data.text) {
      slideTextContentToJson(data, 'shape', !dataReplace)
    }
  }

  const slideLine = (data: any) => {
    if (data.color) {
      data.color = getColor(data.color)
    }
  }

  const slideTable = (data: any, dataNoReplace?: boolean) => {
    if (data.theme) {
      data.theme.color = getColor(data.theme.color)
    }
    if (data.data) {
      data.data.forEach((element: any) => {
        if (element?.length) {
          element.forEach((el: any) => {
            if (el.style) {
              el.style.color = getColor(el.style.color)
              el.style.backcolor = getColor(el.style.backcolor)
              if (dataNoReplace) {
                el.style.fontsize = parseInt(el.style.fontsize) || 12
              }
            }
            if (el?.content) {
              const doc = new DOMParser().parseFromString(
                el.content,
                'text/html'
              )
              el.text = doc.body.textContent || ''
            }
          })
        }
      })
    }
  }

  const slideChart = (data: any) => {
    if (data.gridColor) {
      data.gridColor = getColor(data.gridColor)
    }

    if (data.themeColors) {
      data.themeColors = getGradientColor(data.themeColors)
    }
  }

  const slideVideo = (data: any) => {}

  const slideAudio = (data: any) => {
    if (data.color) {
      data.color = getColor(data.color)
    }
  }

  const slideLatex = (data: any) => {
    if (data.color) {
      data.color = getColor(data.color)
    }
  }
  const slideIframe = (data: any) => {}

  // slide数据转化成json 导出ppt时的json 需要单位转化 dataReplace 是否需要转化单位 默认不可以
  const slideDataToNewJson = (data: any, dataReplace?: boolean) => {
    data.forEach((element: any) => {
      if (element.background) {
        element.background.color = getColor(element.background.color)
        if (element.background.gradient) {
          element.background.gradient.colors = getGradientColor(
            element.background.gradient.colors
          )
        } else if (element.background.type === 'image') {
          if (
            element.background.image.src &&
            element.background.image.src.indexOf('http://') > -1
          ) {
            element.background.image.src = element.background.image.src.replace(
              'http://',
              'https://'
            )
          }
        }
      } else {
        element.background = {
          color: getColor('#ffffff'),
          type: 'solid',
        }
      }

      element.elements.forEach((el: any) => {
        if (el.isApi) {
          delete el.isApi
        }
        if (el.fill) {
          el.fill = getColor(el.fill)
        }

        if (el.gradient) {
          el.gradient.colors = getGradientColor(el.gradient.colors)
        }
        if (el.outline) {
          el.outline.color = getColor(el.outline.color)
        }

        if (el.shadow && el.shadow?.openShow !== 'none') {
          el.shadow.color = getColor(el.shadow.color)
        }
        switch (el.type) {
          case 'text':
            slideTextContentToJson(el, el.type, !dataReplace)
            break
          case 'image':
            slideImage(el)
            break
          case 'shape':
            slideShape(el, dataReplace)
            break
          case 'line':
            slideLine(el)
            break
          case 'table':
            slideTable(el, dataReplace)
            break
          case 'chart':
            slideChart(el)
            break
          case 'video':
            slideVideo(el)
            break
          case 'audio':
            slideAudio(el)
            break
          case 'iframe':
            slideIframe(el)
            break
          default:
            break
        }
      })
    })
  }

  const slideBaese64ImgToFile = async (slides: any) => {
    await Promise.all(
      slides.map(async (slide: any) => {
        await Promise.all(
          slide.elements.map(async (element: any) => {
            if (element.type === 'picture' && element.text) {
              delete element.text
            }
            if (
              element.type === 'picture' &&
              element.src.indexOf('data:image') > -1
            ) {
              const file = base64ToFile(element.src, 'image.png')
              const data: any = await onUploads(file, 'image')
              element.src = data.url
              const props = { src: data.url }
              slidesStore.updateElement({ id: element.id, props })
            }
          })
        )
      })
    )
  }

  const ratioPx2Inch = computed(() => {
    return 96 * (viewportSize.value / 960)
  })

  const ratioPx2Pt = computed(() => {
    return (96 / 72) * (viewportSize.value / 960)
  })

  // 使用示例
  const exporting = ref(false)
  // 将跨域图片转换为 Base64
  const convertImageToBase64 = async (url: any) => {
    const response = await fetch(url)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // 替换 HTML 中的图片地址
  const replaceImagesWithBase64 = async (element: any) => {
    const images = element.querySelectorAll('img')
    for (const img of images) {
      const src = img.src
      if (!src) {
        img.remove()
      } else if (src.startsWith('http:')) {
        const base64 = await convertImageToBase64(src)
        img.src = base64
      }
    }
  }

  // 导出图片
  const exportImage = (
    domRef: HTMLElement,
    format: string,
    quality: number,
    ignoreWebfont = true
  ) => {
    exportStatus.value = 'wating'
    exporting.value = true
    try {
      const toImage = format === 'png' ? toPng : toJpeg
      const foreignObjectSpans = domRef.querySelectorAll(
        'foreignObject [xmlns]'
      )
      foreignObjectSpans.forEach((spanRef) => spanRef.removeAttribute('xmlns'))
      setTimeout(async () => {
        const w = 1600
        const config: ExportImageConfig = {
          quality,
          width: w,
        }

        if (ignoreWebfont) config.fontEmbedCSS = ''
        const domList = $(domRef).find('.thumbnail-slide')
        for (const page of domList) {
          const svgImgList = $(page).find('svg').find('image')
          if (svgImgList?.length) {
            const list = Array.from(svgImgList)
            for (const imgDom of list) {
              const dom = $(imgDom).parents('svg')
              if (dom?.length) {
                const parent = dom.parent()
                const base64SVG = await svgImgBase64(dom[0])
                $(parent).prepend(`<img src="${base64SVG}"/>`)
                $(dom).remove()
              }
            }
          }
        }
        await replaceImagesWithBase64(domRef)
        toImage(domRef, config)
          .then((dataUrl) => {
            exportStatus.value = 'success'
            exporting.value = false
            saveAs(dataUrl, `${title.value}.${format}`)
          })
          .catch((error) => {
            console.error('导出图片失败:', error)
            exporting.value = false
            message.error(t('dowload.error3'))
            exportStatus.value = 'error'
          })
      }, 200)
    } catch (error) {
      exportStatus.value = 'error'
    }
  }

  // 导出pptist文件（特有 .pptist 后缀文件）
  const exportSpecificFile = (_slides: Slide[]) => {
    const blob = new Blob([encrypt(JSON.stringify(_slides))], { type: '' })
    saveAs(blob, `${title.value}.pptist`)
  }

  // api 需要的json
  const exportApiToJSON = (value: any, dataReplace?: boolean) => {
    const slides = JSON.parse(JSON.stringify(value))
    slideDataToNewJson(slides, dataReplace)
    let presentations = presentation.value
    if (!presentations) {
      presentations = {
        name: '未命名演示文稿.pptx',
        width: 960,
        height: 540,
        tags: {
          normal: [],
          custom: {},
        },
        docTheme: {
          themeColors: {},
        },
      }
    }

    if (
      sceneData?.value?.scene &&
      !presentations.tags.normal.find((item: any) => item.key === 'TAG_SCENE')
    ) {
      const obj = {
        key: 'TAG_SCENE',
        value: sceneData.value.scene,
      }
      presentations.tags.normal.push(obj)
    }

    if (
      sceneData?.value?.special &&
      !presentations.tags.normal.find((item: any) => item.key === 'TAG_SPECIAL')
    ) {
      const obj = {
        key: 'TAG_SPECIAL',
        value: sceneData.value.special,
      }
      presentations.tags.normal.push(obj)
    }

    presentations.name = title.value
    presentations.docTheme.themeColors = themeColorList?.value
    const data = {
      presentation: presentations,
      slides,
    }

    return data
  }

  // 导出JSON文件
  const exportJSON = (value: any) => {
    const slides = JSON.parse(JSON.stringify(value))
    slideDataToNewJson(slides)
    let presentations = presentation.value
    const timerData = mainStore.saveTimerData
    if (!presentations) {
      presentations = {
        name: '未命名演示文稿.pptx',
        width: 960,
        height: 540,
        tags: {
          normal: [],
          custom: {},
        },
        docTheme: {
          themeColors: {},
        },
      }
    }

    if (
      sceneData?.value?.scene &&
      !presentations.tags.normal.find((item: any) => item.key === 'TAG_SCENE')
    ) {
      const obj = {
        key: 'TAG_SCENE',
        value: sceneData.value.scene,
      }
      presentations.tags.normal.push(obj)
    }

    if (
      sceneData?.value?.special &&
      !presentations.tags.normal.find((item: any) => item.key === 'TAG_SPECIAL')
    ) {
      const obj = {
        key: 'TAG_SPECIAL',
        value: sceneData.value.special,
      }
      presentations.tags.normal.push(obj)
    }
    presentations.name = title.value
    presentations.docTheme.themeColors = themeColorList?.value
    const data = {
      presentation: presentations,
      slides,
      timerData,
    }
    const blob = new Blob([JSON.stringify(data)], { type: '' })
    saveAs(blob, `${title.value}.json`)
  }

  // 格式化颜色值为 透明度 + HexString，供pptxgenjs使用
  const formatColor = (_color: any) => {
    const value = initColor(_color)
    const c = tinycolor(value)
    const alpha = c.getAlpha()
    const color = alpha === 0 ? '#ffffff' : c.setAlpha(1).toHexString()
    return {
      alpha,
      color,
    }
  }

  type FormatColor = ReturnType<typeof formatColor>

  // 将HTML字符串格式化为pptxgenjs所需的格式
  // 核心思路：将HTML字符串按样式分片平铺，每个片段需要继承祖先元素的样式信息，遇到块级元素需要换行
  const formatHTML = (html: string) => {
    const ast = toAST(html)
    let bulletFlag = false
    let indent = 0

    const slices: pptxgen.TextProps[] = []
    const parse = (
      obj: AST[],
      baseStyleObj: { [key: string]: string } = {}
    ) => {
      for (const item of obj) {
        const isBlockTag =
          'tagName' in item && ['div', 'li', 'p'].includes(item.tagName)

        if (isBlockTag && slices.length) {
          const lastSlice = slices[slices.length - 1]
          if (!lastSlice.options) lastSlice.options = {}
          lastSlice.options.breakLine = true
        }

        const styleObj = { ...baseStyleObj }
        const styleAttr =
          'attributes' in item
            ? item.attributes.find((attr) => attr.key === 'style')
            : null
        if (styleAttr && styleAttr.value) {
          const styleArr = styleAttr.value.split(';')
          for (const styleItem of styleArr) {
            const [_key, _value] = styleItem.split(': ')
            const [key, value] = [trim(_key), trim(_value)]
            if (key && value) styleObj[key] = value
          }
        }

        if ('tagName' in item) {
          if (item.tagName === 'em') {
            styleObj['font-style'] = 'italic'
          }
          if (item.tagName === 'strong') {
            styleObj['font-weight'] = 'bold'
          }
          if (item.tagName === 'sup') {
            styleObj['vertical-align'] = 'super'
          }
          if (item.tagName === 'sub') {
            styleObj['vertical-align'] = 'sub'
          }
          if (item.tagName === 'a') {
            const attr = item.attributes.find((attr) => attr.key === 'href')
            styleObj['href'] = attr?.value || ''
          }
          if (item.tagName === 'ul') {
            styleObj['list-type'] = 'ul'
          }
          if (item.tagName === 'ol') {
            styleObj['list-type'] = 'ol'
          }
          if (item.tagName === 'li') {
            bulletFlag = true
          }
          if (item.tagName === 'p') {
            if ('attributes' in item) {
              const dataIndentAttr = item.attributes.find(
                (attr) => attr.key === 'data-indent'
              )
              if (dataIndentAttr && dataIndentAttr.value) {
                indent = +dataIndentAttr.value
              }
            }
          }
        }

        if ('tagName' in item && item.tagName === 'br') {
          slices.push({ text: '', options: { breakLine: true } })
        } else if ('content' in item) {
          const text = item.content
            .replace(/&nbsp;/g, ' ')
            .replace(/&gt;/g, '>')
            .replace(/&lt;/g, '<')
            .replace(/&amp;/g, '&')
            .replace(/\n/g, '')
          const options: pptxgen.TextPropsOptions = {}
          if (styleObj['font-size']) {
            options.fontSize =
              parseInt(styleObj['font-size']) / ratioPx2Pt.value

            options.fontSize =
              options.fontSize > 24
                ? parseInt(options.fontSize) - 2
                : options.fontSize
          }
          if (styleObj['color']) {
            options.color = formatColor(styleObj['color']).color
          }
          if (styleObj['background-color']) {
            options.highlight = formatColor(styleObj['background-color']).color
          }
          if (styleObj['text-decoration-line']) {
            if (styleObj['text-decoration-line'].indexOf('underline') !== -1) {
              options.underline = {
                color: options.color || '#000000',
                style: 'sng',
              }
            }
            if (
              styleObj['text-decoration-line'].indexOf('line-through') !== -1
            ) {
              options.strike = 'sngStrike'
            }
          }

          if (styleObj['text-decoration']) {
            if (styleObj['text-decoration'].indexOf('underline') !== -1) {
              options.underline = {
                color: options.color || '#000000',
                style: 'sng',
              }
            }
            if (styleObj['text-decoration'].indexOf('line-through') !== -1) {
              options.strike = 'sngStrike'
            }
          }
          if (styleObj['vertical-align']) {
            if (styleObj['vertical-align'] === 'super') {
              options.superscript = true
            }
            if (styleObj['vertical-align'] === 'sub') options.subscript = true
          }
          if (styleObj['text-align']) {
            options.align = styleObj['text-align'] as pptxgen.HAlign
          }
          if (styleObj['font-weight']) {
            options.bold = styleObj['font-weight'] === 'bold'
          }
          if (styleObj['font-style']) {
            options.italic = styleObj['font-style'] === 'italic'
          }
          if (styleObj['font-family']) {
            options.fontFace = styleObj['font-family']
          }
          if (styleObj['href']) options.hyperlink = { url: styleObj['href'] }

          if (bulletFlag && styleObj['list-type'] === 'ol') {
            options.bullet = {
              type: 'number',
              indent: (options.fontSize || 20) * 1.25,
            }
            options.paraSpaceBefore = 0.1
            bulletFlag = false
          }
          if (styleObj['margin-top']) {
            options.paraSpaceBefore = parseInt(styleObj['margin-top'])
          }
          if (styleObj['margin-bottom']) {
            options.paraSpaceAfter = parseInt(styleObj['margin-bottom'])
          }
          if (styleObj['line-height']) {
            options.lineSpacingMultiple = parseFloat(styleObj['line-height'])
          }
          if (bulletFlag && styleObj['list-type'] === 'ul') {
            options.bullet = { indent: (options.fontSize || 20) * 1.25 }
            options.paraSpaceBefore = 0.1
            bulletFlag = false
          }
          if (indent) {
            options.indentLevel = indent
            indent = 0
          }

          slices.push({ text, options })
        } else if ('children' in item) parse(item.children, styleObj)
      }
    }
    parse(ast)
    return slices
  }

  type Points = Array<
    | { x: number; y: number; moveTo?: boolean }
    | {
        x: number
        y: number
        curve: {
          type: 'arc'
          hR: number
          wR: number
          stAng: number
          swAng: number
        }
      }
    | {
        x: number
        y: number
        curve: { type: 'quadratic'; x1: number; y1: number }
      }
    | {
        x: number
        y: number
        curve: { type: 'cubic'; x1: number; y1: number; x2: number; y2: number }
      }
    | { close: true }
  >

  // 将SVG路径信息格式化为pptxgenjs所需要的格式
  const formatPoints = (points: SvgPoints, scale = { x: 1, y: 1 }): Points => {
    return points.map((point) => {
      if (point.close !== undefined) {
        return { close: true }
      } else if (point.type === 'M') {
        return {
          x: (point.x / ratioPx2Inch.value) * scale.x,
          y: (point.y / ratioPx2Inch.value) * scale.y,
          moveTo: true,
        }
      } else if (point.curve) {
        if (point.curve.type === 'cubic') {
          return {
            x: (point.x / ratioPx2Inch.value) * scale.x,
            y: (point.y / ratioPx2Inch.value) * scale.y,
            curve: {
              type: 'cubic',
              x1: ((point.curve.x1 as number) / ratioPx2Inch.value) * scale.x,
              y1: ((point.curve.y1 as number) / ratioPx2Inch.value) * scale.y,
              x2: ((point.curve.x2 as number) / ratioPx2Inch.value) * scale.x,
              y2: ((point.curve.y2 as number) / ratioPx2Inch.value) * scale.y,
            },
          }
        } else if (point.curve.type === 'quadratic') {
          return {
            x: (point.x / ratioPx2Inch.value) * scale.x,
            y: (point.y / ratioPx2Inch.value) * scale.y,
            curve: {
              type: 'quadratic',
              x1: ((point.curve.x1 as number) / ratioPx2Inch.value) * scale.x,
              y1: ((point.curve.y1 as number) / ratioPx2Inch.value) * scale.y,
            },
          }
        }
      }
      return {
        x: (point.x / ratioPx2Inch.value) * scale.x,
        y: (point.y / ratioPx2Inch.value) * scale.y,
      }
    })
  }

  // 获取阴影配置
  const getShadowOption = (shadow: PPTElementShadow): pptxgen.ShadowProps => {
    const c = formatColor(shadow.color)
    const { h, v } = shadow

    let offset = 4
    let angle = 45

    if (h === 0 && v === 0) {
      offset = 4
      angle = 45
    } else if (h === 0) {
      if (v > 0) {
        offset = v
        angle = 90
      } else {
        offset = -v
        angle = 270
      }
    } else if (v === 0) {
      if (h > 0) {
        offset = h
        angle = 1
      } else {
        offset = -h
        angle = 180
      }
    } else if (h > 0 && v > 0) {
      offset = Math.max(h, v)
      angle = 45
    } else if (h > 0 && v < 0) {
      offset = Math.max(h, -v)
      angle = 315
    } else if (h < 0 && v > 0) {
      offset = Math.max(-h, v)
      angle = 135
    } else if (h < 0 && v < 0) {
      offset = Math.max(-h, -v)
      angle = 225
    }

    return {
      type: 'outer',
      color: c.color.replace('#', ''),
      opacity: c.alpha,
      blur: shadow.blur / ratioPx2Pt.value,
      offset,
      angle,
    }
  }

  // 获取边框配置
  const getOutlineOption = (
    outline: PPTElementOutline
  ): pptxgen.ShapeLineProps => {
    const c = formatColor(outline?.color || '#000000')
    return {
      color: c.color,
      transparency: (1 - c.alpha) * 100,
      width: (outline.width || 1) / ratioPx2Pt.value,
      dashType: outline.style === 'solid' ? 'solid' : 'dash',
    }
  }

  // 获取超链接配置
  const getLinkOption = (
    link: PPTElementLink
  ): pptxgen.HyperlinkProps | null => {
    const { type, target } = link
    if (type === 'web') return { url: target }
    if (type === 'slide') {
      const index = slides.value.findIndex((slide) => slide.id === target)
      if (index !== -1) return { slide: index + 1 }
    }

    return null
  }

  // 判断是否为Base64图片地址
  const isBase64Image = (url: string) => {
    const regex = /^data:image\/[^;]+;base64,/
    return url.match(regex) !== null
  }

  const isExportPPTX = ref(false)
  // ppt导出
  const exportPPTXApi = async () => {
    exporting.value = true
    exportStatus.value = 'wating'
    isExportPPTX.value = true

    const json = exportApiToJSON(slides.value)
    await slideBaese64ImgToFile(json.slides)

    const blob = new Blob([JSON.stringify(json)], {
      type: 'application/json',
    })
    const file = new File([blob], `${title.value}.json`, {
      type: 'application/json',
    })

    let type = 'onlineEditorJson'

    const res: any = await onUploads(file, type)
    if (!res?.url) {
      exportPPTX(slides.value, true, true)
    } else {
      let params: any = { url: res.url }

      const ppt: any = await json2ppt(params)
      if (ppt.code === 200) {
        const url = ppt.data.pptx_url
        if (jsBridge.inApp) {
          jsBridge.fs.exist(
            'fs://file/chat_ppt_download/',
            (succ: any, msg: any) => {
              if (succ) {
                // 存在
                downloadAppPPT(url)
              } else {
                // 不存在
                jsBridge.fs.mkdir(
                  'fs://file/chat_ppt_download/',
                  (succ: any, msg: any) => {
                    if (succ) {
                      downloadAppPPT(url)
                    } else {
                      exporting.value = false
                      exportStatus.value = succ ? 'success' : 'error'
                    }
                  }
                )
              }
            }
          )

          return
        }
        const isIOS =
          /iPad|iPhone|iPod/.test(navigator.userAgent) ||
          (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
        if (isIOS) {
          downloadFile(`${title.value}.pptx`, url)
        } else {
          saveAs(url, `${title.value}.pptx`)
        }

        exporting.value = false
        exportStatus.value = 'success'
      } else {
        exportPPTX(slides.value, true, true)
      }
    }
  }

  const downloadAppPPT = (url: string) => {
    const urlList = url.split('/')
    const fileName = urlList[urlList.length - 1]
    exportPPTXFile.value = `fs://file/chat_ppt_download/${fileName}`
    jsBridge.fs.download(
      {
        url: url,
        path: exportPPTXFile.value,
        force: true,
        autoOpen: false,
      },
      (succ: any, msg: any) => {
        exporting.value = false
        exportStatus.value = succ ? 'success' : 'error'
      }
    )
  }
  const openAppFile = () => {
    if (jsBridge.inApp) {
      jsBridge.fs.open(exportPPTXFile.value, (succ: any, msg: any) => {
        if (!succ) {
          alert(msg)
        }
      })
    }
  }
  const downloadFile = (filename: string, url: string) => {
    const a: any = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }
  // 导出PPTX文件
  const exportPPTX = async (
    _slides: Slide[],
    masterOverwrite: boolean,
    ignoreMedia: boolean,
    isUpload?: boolean
  ) => {
    exporting.value = true
    exportStatus.value = 'wating'
    try {
      const pptx = new pptxgen()
      if (viewportRatio.value === 0.625) pptx.layout = 'LAYOUT_16x10'
      else if (viewportRatio.value === 0.75) pptx.layout = 'LAYOUT_4x3'
      else if (viewportRatio.value === 0.70710678) {
        pptx.defineLayout({ name: 'A3', width: 10, height: 7.0710678 })
        pptx.layout = 'A3'
      } else if (viewportRatio.value === 1.41421356) {
        pptx.defineLayout({ name: 'A3_V', width: 10, height: 14.1421356 })
        pptx.layout = 'A3_V'
      } else pptx.layout = 'LAYOUT_16x9'

      if (masterOverwrite) {
        const { color: bgColor, alpha: bgAlpha } = formatColor(
          theme.value.backgroundColor
        )
        pptx.defineSlideMaster({
          title: 'CHATPPT',
          background: { color: bgColor, transparency: (1 - bgAlpha) * 100 },
        })
      }

      for (const slide of _slides) {
        const pptxSlide = pptx.addSlide()

        if (slide.background) {
          const background = slide.background
          if (background.type === 'image' && background.image) {
            background.image.src = background.image.src.replace(
              'http://',
              'https://'
            )
            if (isBase64Image(background.image.src)) {
              pptxSlide.background = { data: background.image.src }
            } else pptxSlide.background = { path: background.image.src }
          } else if (background.type === 'solid' && background.color) {
            const c = formatColor(background.color)
            pptxSlide.background = {
              color: c.color,
              transparency: (1 - c.alpha) * 100,
            }
          } else if (background.type === 'gradient' && background.gradient) {
            const colors = background.gradient.colors
            const color1 = colors[0].color
            const color2 = colors[colors.length - 1].color
            const color = tinycolor.mix(color1, color2).toHexString()
            const c = formatColor(color)
            pptxSlide.background = {
              color: c.color,
              transparency: (1 - c.alpha) * 100,
            }
          }
        }
        if (slide.remark) pptxSlide.addNotes(slide.remark)

        if (!slide.elements) continue

        for (const el of slide.elements) {
          if (el.type === 'text') {
            const textProps = formatHTML(el.content)

            const options: pptxgen.TextPropsOptions = {
              x: el.left / ratioPx2Inch.value,
              y: el.top / ratioPx2Inch.value,
              w: el.width / ratioPx2Inch.value,
              h: el.height / ratioPx2Inch.value,
              fontSize: 20 / ratioPx2Pt.value,
              fontFace: '微软雅黑',
              color: '#000000',
              valign: 'top',
              margin: 10 / ratioPx2Pt.value,
              paraSpaceBefore: 5 / ratioPx2Pt.value,
              lineSpacingMultiple: 1.5 / 1.25,
              autoFit: true,
            }
            if (el.rotate) options.rotate = el.rotate
            if (el.fill) {
              const c = formatColor(el.fill)
              const opacity = el.opacity === undefined ? 1 : el.opacity
              options.fill = {
                color: c.color,
                transparency: (1 - c.alpha * opacity) * 100,
              }
            }
            if (el.verticalAlign) {
              switch (el.verticalAlign) {
                case 'top':
                case 'bottom':
                  options.valign = el.verticalAlign
                  break
                case 'center':
                  options.valign = 'middle'
                  break
                default:
                  break
              }
            }

            if (el.defaultColor) {
              options.color = formatColor(el.defaultColor).color
            }
            if (el.defaultFontName) options.fontFace = el.defaultFontName
            if (el.shadow && el.shadow?.openShow !== 'none') {
              options.shadow = getShadowOption(el.shadow)
            }
            if (el.outline?.width && el.outline?.style !== 'none') {
              options.line = getOutlineOption(el.outline)
            }
            if (el.opacity !== undefined) {
              options.transparency = (1 - el.opacity) * 100
            }
            // 段落间距
            if (el.paragraphSpace !== undefined) {
              options.paraSpaceBefore = el.paragraphSpace / ratioPx2Pt.value
            }

            if (textProps?.length && textProps[0]?.options?.paraSpaceBefore) {
              options.paraSpaceBefore = textProps[0]?.options?.paraSpaceBefore
            }

            if (textProps?.length && textProps[0]?.options?.paraSpaceAfter) {
              options.paraSpaceAfter = textProps[0]?.options?.paraSpaceAfter
            }
            // 字间距
            if (el.wordSpace) {
              options.charSpacing = el.wordSpace / ratioPx2Pt.value
            }
            // 行间距
            if (el.lineHeight) {
              options.lineSpacingMultiple = el.lineHeight / 1.25
            }
            if (
              textProps?.length &&
              textProps[0]?.options?.lineSpacingMultiple
            ) {
              options.lineSpacingMultiple =
                textProps[0]?.options?.lineSpacingMultiple
            }
            if (el.vertical) options.vert = 'eaVert'
            pptxSlide.addText(textProps, options)
          } else if (el.type === 'image') {
            const options: pptxgen.ImageProps = {
              x: el.left / ratioPx2Inch.value,
              y: el.top / ratioPx2Inch.value,
              w: el.width / ratioPx2Inch.value,
              h: el.height / ratioPx2Inch.value,
            }
            if (isBase64Image(el.src)) options.data = el.src
            else options.path = el.src

            if (el.flipH) options.flipH = el.flipH
            if (el.flipV) options.flipV = el.flipV
            if (el.rotate) options.rotate = el.rotate
            if (el.link) {
              const linkOption = getLinkOption(el.link)
              if (linkOption) options.hyperlink = linkOption
            }
            if (el.filters?.opacity) {
              options.transparency = 100 - parseInt(el.filters?.opacity)
            }

            if (el?.opacity) {
              const opacity = el?.opacity < 0 ? el?.opacity * 100 : el?.opacity
            }
            if (el.clip) {
              if (el.clip.shape === 'ellipse') options.rounding = true
              if (el.clip.path || CLIPPATHS[el.clip.shape]) {
                let path = el.clip.path
                if (CLIPPATHS[el.clip.shape] && !el.clip.path) {
                  const shapes: any = CLIPPATHS[el.clip.shape]
                  path = shapes?.createPath
                    ? shapes.createPath(el.width, el.height)
                    : ''
                }
                if (path) {
                  const imgUrl = await setCanvasImg(path, el)
                  if (imgUrl) {
                    const base64SVG = imgUrl
                    options.data = base64SVG
                    delete options.path
                  }
                }
              } else {
                const [start, end] = el.clip.range
                const [startX, startY] = start
                const [endX, endY] = end

                const originW =
                  el.width / ((endX - startX) / ratioPx2Inch.value)
                const originH =
                  el.height / ((endY - startY) / ratioPx2Inch.value)

                options.w = originW / ratioPx2Inch.value
                options.h = originH / ratioPx2Inch.value

                options.sizing = {
                  type: 'crop',
                  x:
                    ((startX / ratioPx2Inch.value) * originW) /
                    ratioPx2Inch.value,
                  y:
                    ((startY / ratioPx2Inch.value) * originH) /
                    ratioPx2Inch.value,
                  w:
                    (((endX - startX) / ratioPx2Inch.value) * originW) /
                    ratioPx2Inch.value,
                  h:
                    (((endY - startY) / ratioPx2Inch.value) * originH) /
                    ratioPx2Inch.value,
                }
              }
            }
            pptxSlide.addImage(options)
          } else if (el.type === 'shape') {
            if (
              el.special ||
              el.fillPicture ||
              el.gradient ||
              (el?.fill?.type === 'noFill' && el?.outline?.gradient)
            ) {
              const svgRef = document.querySelector(
                `.base-element-${el.id} svg`
              ) as HTMLElement
              if (svgRef) {
                if (svgRef.clientWidth < 1 || svgRef.clientHeight < 1) {
                  continue
                } // 临时处理（导入PPTX文件带来的异常数据）
                let base64SVG

                if (
                  el.fillPicture ||
                  (el?.fill?.type === 'noFill' && el?.outline?.gradient)
                ) {
                  if (el?.fill?.type === 'noFill' && el?.outline?.gradient) {
                    base64SVG = await svg2Base64(svgRef)
                  } else {
                    base64SVG = await svgImgBase64(svgRef)
                  }
                  const div = document.createElement('div')
                  div.className = 'isToPPTTempDom'
                  div.style.background = 'transparent'
                  div.innerHTML = `<img src="${base64SVG}"/>`
                  document.body.append(div)
                  try {
                    const canvas = await html2canvas(div, {
                      width: el.width,
                      height: el.height,
                      backgroundColor: null,
                    })
                    base64SVG = canvas.toDataURL('image/png')
                    const elements =
                      document.querySelectorAll('.isToPPTTempDom')
                    elements.forEach(function (element) {
                      element.remove()
                    })
                  } catch (error) {
                    // 假设要查找并移除的类名为 'my-class'
                    const elements =
                      document.querySelectorAll('.isToPPTTempDom')
                    elements.forEach(function (element) {
                      element.remove()
                    })
                  }
                } else {
                  base64SVG = svg2Base64(svgRef)
                }

                const options: pptxgen.ImageProps = {
                  data: base64SVG,
                  x: el.left / ratioPx2Inch.value,
                  y: el.top / ratioPx2Inch.value,
                  w: el.width / ratioPx2Inch.value,
                  h: el.height / ratioPx2Inch.value,
                }

                if (el.gradient) {
                  if (el.flipH) options.flipH = true
                }

                if (el.flipV) options.flipV = el.flipV
                if (el.shadow && el.shadow?.openShow !== 'none') {
                  options.shadow = getShadowOption(el.shadow)
                }
                if (el.rotate) options.rotate = el.rotate
                if (el.link) {
                  const linkOption = getLinkOption(el.link)
                  if (linkOption) options.hyperlink = linkOption
                }

                pptxSlide.addImage(options)
              }
            } else {
              const scale = {
                x: el.width / el.viewBox[0],
                y: el.height / el.viewBox[1],
              }
              const points = formatPoints(toPoints(el.path), scale)

              let fillColor = formatColor(el.fill)
              if (el.gradient) {
                const colors = el.gradient.colors
                const color1 = initColor(colors[0].color)
                const color2 = initColor(colors[colors.length - 1].color)
                const color = tinycolor.mix(color1, color2).toHexString()
                fillColor = formatColor(color)
              }
              const opacity = el.opacity === undefined ? 1 : el.opacity

              const options: pptxgen.ShapeProps = {
                x: el.left / ratioPx2Inch.value,
                y: el.top / ratioPx2Inch.value,
                w: el.width / ratioPx2Inch.value,
                h: el.height / ratioPx2Inch.value,
                fill: {
                  color: fillColor.color,
                  transparency: (1 - fillColor.alpha * opacity) * 100,
                },
                points,
              }

              if (el.flipH) options.flipH = el.flipH
              if (el.flipV) options.flipV = el.flipV
              if (el.shadow && el.shadow?.openShow !== 'none') {
                options.shadow = getShadowOption(el.shadow)
              }
              if (el.outline?.width && el.outline?.style !== 'none') {
                options.line = getOutlineOption(el.outline)
              }
              if (el.rotate) options.rotate = el.rotate
              if (el.link) {
                const linkOption = getLinkOption(el.link)
                if (linkOption) options.hyperlink = linkOption
              }

              pptxSlide.addShape('custGeom' as pptxgen.ShapeType, options)
            }
            if (el.text) {
              const textProps = formatHTML(el.text.content)

              const options: pptxgen.TextPropsOptions = {
                x: el.left / ratioPx2Inch.value,
                y: el.top / ratioPx2Inch.value,
                w: el.width / ratioPx2Inch.value,
                h: el.height / ratioPx2Inch.value,
                fontSize: 20 / ratioPx2Pt.value,
                fontFace: '微软雅黑',
                color: '#000000',
                paraSpaceBefore: 5 / ratioPx2Pt.value,
                valign: el.text.align,
              }
              if (el.rotate) options.rotate = el.rotate
              if (el.text.defaultColor) {
                options.color = formatColor(el.text.defaultColor).color
              }
              if (el.text.defaultFontName) {
                options.fontFace = el.text.defaultFontName
              }

              pptxSlide.addText(textProps, options)
            }
          } else if (el.type === 'line') {
            const path = getLineElementPath(el)
            const points = formatPoints(toPoints(path))
            const { minX, maxX, minY, maxY } = getElementRange(el)
            const c = formatColor(el.color)

            const options: pptxgen.ShapeProps = {
              x: el.left / ratioPx2Inch.value,
              y: el.top / ratioPx2Inch.value,
              w: (maxX - minX) / ratioPx2Inch.value,
              h: (maxY - minY) / ratioPx2Inch.value,
              line: {
                color: c.color,
                transparency: (1 - c.alpha) * 100,
                width: el.width / ratioPx2Pt.value,
                dashType: el.style === 'solid' ? 'solid' : 'dash',
                beginArrowType: el.points[0] ? 'arrow' : 'none',
                endArrowType: el.points[1] ? 'arrow' : 'none',
              },
              points,
            }
            if (el.shadow && el.shadow?.openShow !== 'none') {
              options.shadow = getShadowOption(el.shadow)
            }

            pptxSlide.addShape('custGeom' as pptxgen.ShapeType, options)
          } else if (el.type === 'chart') {
            const chartData = []
            for (let i = 0; i < el.data.series.length; i++) {
              const item = el.data.series[i]
              chartData.push({
                name: `系列${i + 1}`,
                labels: el.data.labels,
                values: item,
              })
            }

            let chartColors: string[] = []
            if (el.themeColors.length === 10) {
              chartColors = el.themeColors.map(
                (color) => formatColor(color).color
              )
            } else if (el.themeColors.length === 1) {
              chartColors = tinycolor(initColor(el.themeColors[0]))
                .analogous(10)
                .map((color) => formatColor(color.toHexString()).color)
            } else {
              const len = el.themeColors.length
              const supplement = tinycolor(initColor(el.themeColors[len - 1]))
                .analogous(10 + 1 - len)
                .map((color) => color.toHexString())
              chartColors = [
                ...initColor(el.themeColors.slice(0, len - 1)),
                ...supplement,
              ].map((color) => formatColor(color).color)
            }

            const options: pptxgen.IChartOpts = {
              x: el.left / ratioPx2Inch.value,
              y: el.top / ratioPx2Inch.value,
              w: el.width / ratioPx2Inch.value,
              h: el.height / ratioPx2Inch.value,
              chartColors:
                el.chartType === 'pie' || el.chartType === 'ring'
                  ? chartColors
                  : chartColors.slice(0, el.data.series.length),
            }

            const textColor = formatColor(el.textColor || '#000000').color
            options.catAxisLabelColor = textColor
            options.valAxisLabelColor = textColor

            const fontSize = 14 / ratioPx2Pt.value
            options.catAxisLabelFontSize = fontSize
            options.valAxisLabelFontSize = fontSize

            if (el.fill || el.outline) {
              const plotArea: pptxgen.IChartPropsFillLine = {}
              if (el.fill) {
                plotArea.fill = { color: formatColor(el.fill).color }
              }
              if (el.outline) {
                plotArea.border = {
                  pt: el.outline.width! / ratioPx2Pt.value,
                  color: formatColor(el.outline.color!).color,
                }
              }
              options.plotArea = plotArea
            }

            if (
              (el.data.series.length > 1 && el.chartType !== 'scatter') ||
              el.chartType === 'pie' ||
              el.chartType === 'ring'
            ) {
              options.showLegend = true
              options.legendPos = 'b'
              options.legendColor = textColor
              options.legendFontSize = fontSize
            }

            let type = pptx.ChartType.bar
            if (el.chartType === 'bar') {
              type = pptx.ChartType.bar
              options.barDir = 'col'
              if (el.options?.stack) options.barGrouping = 'stacked'
            } else if (el.chartType === 'column') {
              type = pptx.ChartType.bar
              options.barDir = 'bar'
              if (el.options?.stack) options.barGrouping = 'stacked'
            } else if (el.chartType === 'line') {
              type = pptx.ChartType.line
              if (el.options?.lineSmooth) options.lineSmooth = true
            } else if (el.chartType === 'area') {
              type = pptx.ChartType.area
            } else if (el.chartType === 'radar') {
              type = pptx.ChartType.radar
            } else if (el.chartType === 'scatter') {
              type = pptx.ChartType.scatter
              options.lineSize = 0
            } else if (el.chartType === 'pie') {
              type = pptx.ChartType.pie
            } else if (el.chartType === 'ring') {
              type = pptx.ChartType.doughnut
              options.holeSize = 60
            }

            pptxSlide.addChart(type, chartData, options)
          } else if (el.type === 'table') {
            const hiddenCells = []
            for (let i = 0; i < el.data.length; i++) {
              const rowData = el.data[i]

              for (let j = 0; j < rowData.length; j++) {
                const cell = rowData[j]
                if (cell.colspan > 1 || cell.rowspan > 1) {
                  for (let row = i; row < i + cell.rowspan; row++) {
                    for (
                      let col = row === i ? j + 1 : j;
                      col < j + cell.colspan;
                      col++
                    ) {
                      hiddenCells.push(`${row}_${col}`)
                    }
                  }
                }
              }
            }

            const tableData = []

            const theme = el.theme
            let themeColor: FormatColor | null = null
            let subThemeColors: FormatColor[] = []
            if (theme) {
              themeColor = formatColor(theme.color)
              subThemeColors = getTableSubThemeColor(themeColor.color).map(
                (item) => formatColor(item)
              )
            }

            for (let i = 0; i < el.data.length; i++) {
              const row = el.data[i]
              const _row = []

              for (let j = 0; j < row.length; j++) {
                const cell: any = row[j]
                if (cell?.content) {
                  const doc = new DOMParser().parseFromString(
                    cell.content,
                    'text/html'
                  )
                  cell.text = doc.body.textContent || ''
                }

                const cellOptions: pptxgen.TableCellProps = {
                  colspan: cell.colspan,
                  rowspan: cell.rowspan,
                  bold: cell.style?.bold || false,
                  italic: cell.style?.em || false,
                  underline: { style: cell.style?.underline ? 'sng' : 'none' },
                  align: cell.style?.align || 'left',
                  valign: 'middle',
                  fontFace: cell.style?.fontname || '微软雅黑',
                  fontSize:
                    (cell.style?.fontsize
                      ? parseInt(cell.style?.fontsize)
                      : 14) / ratioPx2Pt.value,
                }
                if (theme && themeColor) {
                  let c: FormatColor
                  if (i % 2 === 0) c = subThemeColors[1]
                  else c = subThemeColors[0]

                  if (theme.rowHeader && i === 0) c = themeColor
                  else if (theme.rowFooter && i === el.data.length - 1) {
                    c = themeColor
                  } else if (theme.colHeader && j === 0) c = themeColor
                  else if (theme.colFooter && j === row.length - 1) {
                    c = themeColor
                  }

                  cellOptions.fill = {
                    color: c.color,
                    transparency: (1 - c.alpha) * 100,
                  }
                }
                if (cell.style?.backcolor) {
                  const c = formatColor(cell.style.backcolor)
                  cellOptions.fill = {
                    color: c.color,
                    transparency: (1 - c.alpha) * 100,
                  }
                }
                if (cell.style?.color) {
                  cellOptions.color = formatColor(cell.style.color).color
                }

                if (!hiddenCells.includes(`${i}_${j}`)) {
                  _row.push({
                    text: cell.text,
                    options: cellOptions,
                  })
                }
              }
              if (_row.length) tableData.push(_row)
            }

            const options: pptxgen.TableProps = {
              x: el.left / ratioPx2Inch.value,
              y: el.top / ratioPx2Inch.value,
              w: el.width / ratioPx2Inch.value,
              h: el.height / ratioPx2Inch.value,
              colW: el.colWidths.map(
                (item) => (el.width * item) / ratioPx2Inch.value
              ),
            }
            if (el.theme) options.fill = { color: '#ffffff' }
            if (el.outline.width && el.outline.color) {
              options.border = {
                type: el.outline.style === 'solid' ? 'solid' : 'dash',
                pt: el.outline.width / ratioPx2Pt.value,
                color: formatColor(el.outline.color).color,
              }
            }

            pptxSlide.addTable(tableData, options)
          } else if (el.type === 'latex') {
            const svgRef = document.querySelector(
              `.thumbnail-list .base-element-${el.id} svg`
            ) as HTMLElement
            const base64SVG = svg2Base64(svgRef)

            const options: pptxgen.ImageProps = {
              data: base64SVG,
              x: el.left / ratioPx2Inch.value,
              y: el.top / ratioPx2Inch.value,
              w: el.width / ratioPx2Inch.value,
              h: el.height / ratioPx2Inch.value,
            }
            if (el.link) {
              const linkOption = getLinkOption(el.link)
              if (linkOption) options.hyperlink = linkOption
            }

            pptxSlide.addImage(options)
          } else if (
            !ignoreMedia &&
            (el.type === 'video' || el.type === 'audio')
          ) {
            const options: pptxgen.MediaProps = {
              x: el.left / ratioPx2Inch.value,
              y: el.top / ratioPx2Inch.value,
              w: el.width / ratioPx2Inch.value,
              h: el.height / ratioPx2Inch.value,
              path: el.src,
              type: el.type,
            }
            if (el.type === 'video' && el.poster) options.cover = el.poster

            const extMatch = el.src.match(/\.([a-zA-Z0-9]+)(?:[\?#]|$)/)
            if (extMatch && extMatch[1]) options.extn = extMatch[1]
            else if (el.ext) options.extn = el.ext

            const videoExts = ['avi', 'mp4', 'm4v', 'mov', 'wmv']
            const audioExts = ['mp3', 'm4a', 'mp4', 'wav', 'wma']
            if (
              options.extn &&
              [...videoExts, ...audioExts].includes(options.extn)
            ) {
              pptxSlide.addMedia(options)
            }
          }
        }
      }
      exporting.value = false
      if (isUpload) {
        return new Promise((resolve, reject) => {
          pptx
            .write({ outputType: 'blob' })
            .then((data) => {
              // 将Blob对象转换为File对象
              const file = new File([data], `${title.value}.pptx`, {
                type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
              })
              resolve(file)
            })
            .catch((err) => {
              reject(err)
            })
        })
      }

      setTimeout(() => {
        pptx
          .writeFile({ fileName: `${title.value}.pptx` })
          .then(() => {
            exporting.value = false
            exportStatus.value = 'success'
          })
          .catch(() => {
            exporting.value = false
            message.error(t('dowload.error2'))
            exportStatus.value = 'error'
          })
      }, 200)
    } catch (error) {
      exporting.value = false
      exportStatus.value = 'error'
      message.error(t('dowload.error2'))
    }
  }
  const exportPDF = async (dom: any) => {
    exporting.value = true
    exportStatus.value = 'wating'
    const w = 1600
    const h = 900
    try {
      const config: ExportImageConfig = {
        quality: 1,
        width: w,
        fontEmbedCSS: '',
      }

      const pdf = new jsPDF({
        orientation: 'l',
        unit: 'px',
        format: [w, h],
      })
      const domList = dom.querySelectorAll('.save-thumbnail')
      let pageCount = 0
      for (const page of domList) {
        await replaceImagesWithBase64(page)
        const svgImgList = $(page).find('svg').find('image')
        if (svgImgList?.length) {
          const list = Array.from(svgImgList)
          for (const imgDom of list) {
            const dom = $(imgDom).parents('svg')
            if (dom?.length) {
              const parent = dom.parent()
              const base64SVG = await svgImgBase64(dom[0])
              $(parent).prepend(`<img src="${base64SVG}"/>`)
              $(dom).remove()
            }
          }
        }

        const iframeList = $(page).find('.iframe-content')

        const imgUrl = await toPng(page, config)

        if (imgUrl) {
          if (pageCount > 0) {
            pdf.addPage()
          }
          pdf.addImage(imgUrl, 'PNG', 0, 0, w, h)
        }

        pageCount++
      }
      exportStatus.value = 'success'
      pdf.save(`${title.value}.pdf`)
      exporting.value = false
    } catch (error) {
      exporting.value = false
      exportStatus.value = 'error'
      message.error(t('dowload.error2'))
    }
  }

  return {
    formatHTML,
    slideTextContentReplace,
    slideDataToNewJson,
    htmlToJsonData,
    slideTextContentToData,
    exportImage,
    exportJSON,
    exportApiToJSON,
    exportSpecificFile,
    exportPPTX,
    exportPPTXApi,
    exportPDF,
    openAppFile,
    exportPPTXFile,
    exporting,
    exportStatus,
  }
}
