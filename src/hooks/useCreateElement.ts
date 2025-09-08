import { storeToRefs } from 'pinia'
import { nanoid } from 'nanoid'
import { useMainStore, useSlidesStore } from '@/store'
import { getImageSize } from '@/utils/image'
import { onUploads } from '@/utils/upload'
import { base64ToFile } from '@/utils/common'

import type {
  PPTLineElement,
  PPTElement,
  TableCell,
  TableCellStyle,
  PPTShapeElement,
  ChartType,
} from '@/types/slides'
import { type ShapePoolItem, SHAPE_PATH_FORMULAS } from '@/configs/shapes'
import type { LinePoolItem } from '@/configs/lines'
import { CHART_DEFAULT_DATA } from '@/configs/chart'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'

interface CommonElementPosition {
  top: number
  left: number
  width: number
  height: number
}

interface LineElementPosition {
  top: number
  left: number
  start: [number, number]
  end: [number, number]
}

interface CreateTextData {
  content?: string
  vertical?: boolean
}

export default () => {
  const mainStore = useMainStore()
  const slidesStore = useSlidesStore()
  const { creatingElement, userToken } = storeToRefs(mainStore)

  const { theme, viewportRatio, viewportSize } = storeToRefs(slidesStore)

  const { addHistorySnapshot } = useHistorySnapshot()

  // 创建（插入）一个元素并将其设置为被选中元素
  const createElement = (element: PPTElement, callback?: () => void) => {
    slidesStore.addElement(element)
    mainStore.setActiveElementIdList([element.id])

    if (creatingElement.value) mainStore.setCreatingElement(null)

    setTimeout(() => {
      mainStore.setEditorareaFocus(true)
    }, 0)

    if (callback) callback()
    addHistorySnapshot()
  }
  /**
   * 创建网页元素
   *
   */
  const createWebElement = (
    src: string,
    setWidth: any,
    setHeight: any,
    style: any
  ) => {
    createElement({
      name: `网页 ${nanoid(5)}`,
      type: 'iframe',
      id: nanoid(10),
      style,
      src,
      width: setWidth,
      height: setHeight,
      left: (viewportSize.value - setWidth) / 2,
      top: (viewportSize.value * viewportRatio.value - setHeight) / 2,
      fixedRatio: true,
      rotate: 0,
    })
  }

  /**
   * 创建图片元素
   * @param src 图片地址
   */
  const createImageElement = (src: string, setWidth?: any, setHeight?: any) => {
    getImageSize(src).then(async ({ width, height }) => {
      const scale = height / width

      if (scale < viewportRatio.value && width > viewportSize.value) {
        width = viewportSize.value
        height = width * scale
      } else if (height > viewportSize.value * viewportRatio.value) {
        height = viewportSize.value * viewportRatio.value
        width = height / scale
      }
      const imageW = setWidth || width

      const imageH = setHeight || height

      if (userToken.value) {
        if (src.indexOf('data:image/png') > -1) {
          const file = base64ToFile(src, '复制的图片' + nanoid(5))
          const res: any = await onUploads(file, 'image')
          if (res.url) {
            src = res.url
          }
        }
      }

      createElement({
        name: `图片 ${nanoid(5)}`,
        type: 'image',
        id: nanoid(10),
        src,
        width: imageW,
        height: imageH,
        left: (viewportSize.value - imageW) / 2,
        top: (viewportSize.value * viewportRatio.value - imageH) / 2,
        fixedRatio: true,
        rotate: 0,
      })
    })
  }

  /**
   * 创建图表元素
   * @param chartType 图表类型
   */
  const defaultData = CHART_DEFAULT_DATA()
  const createChartElement = (type: ChartType) => {
    try {
      createElement({
        name: `图表 ${nanoid(5)}`,
        type: 'chart',
        id: nanoid(10),
        chartType: type,
        left: 300,
        top: 81.25,
        width: 400,
        height: 400,
        rotate: 0,
        themeColors: [
          {
            type: 'themeColor', // 类型：themeColor、rgb
            value: 'accent1', // 颜色值，如果是themeColor，则为id；否则为十六进制色值
            transparent: 1, // 不透明度0~1
          },
        ],
        textColor: {
          type: 'themeColor', // 类型：themeColor、rgb
          value: 'text1', // 颜色值，如果是themeColor，则为id；否则为十六进制色值
          transparent: 1, // 不透明度0~1
        },
        data: defaultData[type],
      })
    } catch (error) {}
  }

  /**
   * 创建表格元素
   * @param row 行数
   * @param col 列数
   */
  const createTableElement = (row: number, col: number) => {
    const style: TableCellStyle = {
      fontname: theme.value.fontName,
      color: theme.value.fontColor,
    }
    const data: TableCell[][] = []
    for (let i = 0; i < row; i++) {
      const rowCells: TableCell[] = []
      for (let j = 0; j < col; j++) {
        rowCells.push({
          id: nanoid(10),
          colspan: 1,
          rowspan: 1,
          text: '',
          style,
        })
      }
      data.push(rowCells)
    }

    const DEFAULT_CELL_WIDTH = 100
    const DEFAULT_CELL_HEIGHT = 36

    const colWidths: number[] = new Array(col).fill(1 / col)

    const width = col * DEFAULT_CELL_WIDTH
    const height = row * DEFAULT_CELL_HEIGHT

    createElement({
      name: `表格 ${nanoid(5)}`,
      type: 'table',
      id: nanoid(10),
      width,
      height,
      colWidths,
      rotate: 0,
      data,
      left: (viewportSize.value - width) / 2,
      top: (viewportSize.value * viewportRatio.value - height) / 2,
      outline: {
        width: 1,
        style: 'solid',
        color: {
          type: 'themeColor', // 类型：themeColor、rgb
          value: 'accent1', // 颜色值，如果是themeColor，则为id；否则为十六进制色值
          transparent: 1,
        },
      },
      theme: {
        color: {
          type: 'themeColor', // 类型：themeColor、rgb
          value: 'accent1', // 颜色值，如果是themeColor，则为id；否则为十六进制色值
          transparent: 1,
        },
        rowHeader: false,
        rowFooter: false,
        colHeader: false,
        colFooter: false,
      },
      tableStyle: 'threeTable',
      cellMinHeight: 36,
    })
  }

  /**
   * 创建文本元素
   * @param position 位置大小信息
   * @param content 文本内容
   */
  const createTextElement = (
    position: CommonElementPosition,
    data?: CreateTextData
  ) => {
    const { left, top, width, height } = position
    const content = data?.content || ''
    const vertical = data?.vertical || false

    const id = nanoid(10)
    let isPlaceHolder = false
    if (content.indexOf('请在此处输入') > -1) {
      isPlaceHolder = true
    }
    createElement(
      {
        name: `文本 ${nanoid(5)}`,
        type: 'text',
        id,
        left,
        top,
        width,
        height,
        content,
        rotate: 0,
        isPlaceHolder: isPlaceHolder,
        defaultFontName: theme.value.fontName,
        defaultColor: {
          type: 'themeColor', // 类型：themeColor、rgb
          value: 'accent1', // 颜色值，如果是themeColor，则为id；否则为十六进制色值
          transparent: 1,
        },
        autoSize: 'shapeFitText', // 默认框适合文本大小
        lineHeight: 1,
        vertical,
      },
      () => {}
    )
  }

  /**
   * 创建形状元素
   * @param position 位置大小信息
   * @param data 形状路径信息
   */
  const createShapeElement = (
    position: CommonElementPosition,
    data: ShapePoolItem,
    supplement: Partial<PPTShapeElement> = {}
  ) => {
    const { left, top, width, height } = position
    const newElement: PPTShapeElement = {
      name: `图形 ${nanoid(5)}`,
      type: 'shape',
      id: nanoid(10),
      left,
      top,
      width,
      height,
      viewBox: data.viewBox,
      path: data.path,
      fill: {
        type: 'themeColor', // 类型：themeColor、rgb
        value: 'accent1', // 颜色值，如果是themeColor，则为id；否则为十六进制色值
        transparent: 1,
      },
      fixedRatio: false,
      rotate: 0,
      ...supplement,
    }
    if (data.special) newElement.special = true
    if (data.pathFormula) {
      newElement.pathFormula = data.pathFormula
      newElement.viewBox = [width, height]

      const pathFormula = SHAPE_PATH_FORMULAS[data.pathFormula]
      if ('editable' in pathFormula && pathFormula.editable) {
        newElement.path = pathFormula.formula(
          width,
          height,
          pathFormula.defaultValue!
        )
        newElement.keypoints = pathFormula.defaultValue
      } else newElement.path = pathFormula.formula(width, height)
    }
    createElement(newElement)
  }

  /**
   * 创建线条元素
   * @param position 位置大小信息
   * @param data 线条的路径和样式
   */
  const createLineElement = (
    position: LineElementPosition,
    data: LinePoolItem
  ) => {
    const { left, top, start, end } = position

    const newElement: PPTLineElement = {
      name: `线条 ${nanoid(5)}`,
      type: 'line',
      id: nanoid(10),
      left,
      top,
      start,
      end,
      points: data.points,
      color: {
        type: 'themeColor', // 类型：themeColor、rgb
        value: 'accent1', // 颜色值，如果是themeColor，则为id；否则为十六进制色值
        transparent: 1,
      },
      style: data.style,
      width: 2,
    }
    if (data.isBroken) {
      newElement.broken = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2]
    }
    if (data.isBroken2) {
      newElement.broken2 = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2]
    }
    if (data.isCurve) {
      newElement.curve = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2]
    }
    if (data.isCubic) {
      newElement.cubic = [
        [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2],
        [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2],
      ]
    }
    createElement(newElement)
  }

  /**
   * 创建LaTeX元素
   * @param svg SVG代码
   */
  const createLatexElement = (data: {
    path: string
    latex: string
    w: number
    h: number
  }) => {
    createElement({
      name: `公式 ${nanoid(5)}`,
      type: 'latex',
      id: nanoid(10),
      width: data.w,
      height: data.h,
      rotate: 0,
      left: (viewportSize.value - data.w) / 2,
      top: (viewportSize.value * viewportRatio.value - data.h) / 2,
      path: data.path,
      latex: data.latex,
      color: {
        type: 'themeColor', // 类型：themeColor、rgb
        value: 'accent1', // 颜色值，如果是themeColor，则为id；否则为十六进制色值
        transparent: 1,
      },
      strokeWidth: 2,
      viewBox: [data.w, data.h],
      fixedRatio: true,
    })
  }

  /**
   * 创建视频元素
   * @param src 视频地址
   */
  const createVideoElement = (src: string) => {
    createElement({
      name: `视频 ${nanoid(5)}`,
      type: 'video',
      id: nanoid(10),
      width: 500,
      height: 300,
      rotate: 0,
      left: (viewportSize.value - 500) / 2,
      top: (viewportSize.value * viewportRatio.value - 300) / 2,
      src,
      autoplay: false,
    })
  }

  /**
   * 创建音频元素
   * @param src 音频地址
   */
  const createAudioElement = (src: string) => {
    createElement({
      name: `音频 ${nanoid(5)}`,
      type: 'audio',
      id: nanoid(10),
      width: 50,
      height: 50,
      rotate: 0,
      left: (viewportSize.value - 50) / 2,
      top: (viewportSize.value * viewportRatio.value - 50) / 2,
      loop: false,
      autoplay: false,
      fixedRatio: true,
      color: {
        type: 'themeColor', // 类型：themeColor、rgb
        value: 'accent1', // 颜色值，如果是themeColor，则为id；否则为十六进制色值
        transparent: 1,
      },
      src,
    })
  }

  return {
    createImageElement,
    createChartElement,
    createTableElement,
    createTextElement,
    createShapeElement,
    createLineElement,
    createLatexElement,
    createVideoElement,
    createAudioElement,
    createWebElement,
  }
}
