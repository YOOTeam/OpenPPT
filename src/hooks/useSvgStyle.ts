import { storeToRefs } from 'pinia'
import { useSlidesStore, useMainStore } from '@/store'
import { getSvgPathRange } from '@/utils/svgPathParser'
import { SHAPE_PATH_FORMULAS } from '@/configs/shapes'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import tinycolor from 'tinycolor2'
import useColor from '@/hooks/useColor'
export default () => {
  const { addHistorySnapshot } = useHistorySnapshot()
  const mainStore = useMainStore()
  const { handleElement, handleElementId } = storeToRefs(mainStore)
  const slidesStore = useSlidesStore()
  const { themeColorList } = storeToRefs(slidesStore)
  const { initColor } = useColor()
  const returnSvgPath = (
    svgPath: string,
    color?: string,
    isBeautify = false
  ) => {
    const svgString = svgPath
    const parser = new DOMParser()
    const svgDoc = parser.parseFromString(svgString, 'image/svg+xml')
    const svgdom: any = svgDoc.querySelector('svg')

    // 1. 删除所有 clipPath 元素
    const clipPaths = svgdom.querySelectorAll('clipPath')
    if (clipPaths?.length) {
      clipPaths.forEach((clipPath: any) => {
        clipPath.parentNode.removeChild(clipPath)
      })
    }

    const viewBoxStr = svgdom.getAttribute('viewBox')
    let viewBox: any = []
    if (viewBoxStr) {
      const arr = viewBoxStr?.split(' ')
      viewBox = [arr[2], arr[3]]
    } else {
      const width = svgdom.getAttribute('width')
      const height = svgdom.getAttribute('height')
      if (width && height) {
        viewBox = [width, height]
      }
    }

    const paths = svgDoc.querySelectorAll('path')
    const dAttributes = Array.from(paths).map((path) => path.getAttribute('d'))
    const attrArry: any = []
    paths.forEach((path) => {
      // 获取所有属性的名称
      const attributeNames = path.getAttributeNames()
      const obj: any = {}
      const noAttr = [
        'd',
        'width',
        'height',
        'x',
        'y',
        'vewBox',
        'class',
        'filter',
        'stroke-miterlimit',
        'vector-effect',
        'stroke-linecap',
        'key',
        'id',
        'style',
      ]
      // 遍历属性名称并获取属性值
      for (let i = 0; i < attributeNames.length; i++) {
        const attrName = attributeNames[i]
        const attrValue = path.getAttribute(attrName)
        if (!noAttr.includes(attrName) && attrValue) {
          obj[attrName] = attrValue
        }
      }
      if (JSON.stringify(obj) !== '{}') {
        attrArry.push(obj)
      }
    })

    if (attrArry.length > 0) {
      // 如果颜色都一样就根据主题色渲染 不一样就根据属性渲染
      if (isBeautify) {
        // 1.fill 没有透明的 边框也有 fill 是主题色  边框是text2
        // 2.fill 有透明的 边框没有 fill 是主题色  边框是text2

        const hasFill = attrArry.some(
          (obj: any) => obj.fill && obj.fill !== 'none'
        )
        const hasStroke = attrArry.some((obj: any) => obj.stroke)
        let fillColor = ''
        let strokeColor = ''
        const dipeColor = {
          type: 'themeColor',
          value: 'accent1',
          transparent: 1,
          brightness: 60,
        }

        if (hasFill && hasStroke) {
          //  1.fill 没有透明的 边框也有 fill 是主题色  边框是text2
          fillColor = themeColorList?.value.accent1
          strokeColor = initColor(dipeColor)
        } else if (hasFill && !hasStroke) {
          fillColor = initColor(dipeColor)
        } else if (!hasFill && hasStroke) {
          strokeColor = initColor(dipeColor)
        } else if (!hasFill && !hasStroke) {
          fillColor = themeColorList?.value.accent1
        }

        attrArry.forEach((item: any) => {
          if (!item.fill) {
            item.fill = '#00000000'
          } else {
            item.fill = fillColor || themeColorList?.value.accent1
          }

          if (item['stroke-width'] === '4') {
            item['stroke-width'] = 2
          }
          if (item.stroke) {
            const isLight = tinycolor(themeColorList?.value.accent1).isLight()
            if (isLight) {
              dipeColor.brightness = -15
              strokeColor = initColor(dipeColor)
            }
            item.stroke = strokeColor || themeColorList?.value.text2
          }
        })
      } else {
        if (color) {
          attrArry.forEach((item: any) => {
            if (item.fill) {
              item.fill = color
            }
            if (item.fill === '#FFFFFF' && item.stroke === 'white') {
              item.stroke = themeColorList?.value.accent1
            }
          })
        } else {
          attrArry.forEach((item: any) => {
            if (!item.fill) {
              item.fill = '#00000000'
            }
          })
        }
      }
    }
    return { dAttributes, viewBox, attrArry }
  }

  function isStraightPath(path: any) {
    const commands = path.match(/[A-Za-z][^A-Za-z]*/g) || []

    // 检查所有命令是否都是直线命令
    const validCommands = new Set([
      'M',
      'L',
      'H',
      'V',
      'Z',
      'm',
      'l',
      'h',
      'v',
      'z',
    ])
    if (!commands.every((cmd) => validCommands.has(cmd[0]))) return false

    // 提取所有点
    const points = []
    let currentX = 0,
      currentY = 0

    for (const cmd of commands) {
      const type = cmd[0]
      const args = cmd
        .slice(1)
        .trim()
        .split(/[\s,]+/)
        .map(Number)

      switch (type.toUpperCase()) {
        case 'M':
        case 'L':
          if (args.length >= 2) {
            currentX = args[0]
            currentY = args[1]
            points.push([currentX, currentY])
          }
          break
        case 'H':
          currentX = args[0]
          points.push([currentX, currentY])
          break
        case 'V':
          currentY = args[0]
          points.push([currentX, currentY])
          break
      }
    }

    // 少于2个点不是有效直线
    if (points.length < 2) return false

    // 检查所有点是否共线
    if (points.length > 2) {
      const [x1, y1] = points[0]
      const [x2, y2] = points[1]
      const A = y2 - y1
      const B = x1 - x2
      const C = x2 * y1 - x1 * y2

      const tolerance = 1e-6
      return points
        .slice(2)
        .every(([x, y]) => Math.abs(A * x + B * y + C) < tolerance)
    }

    return true
  }

  const areAllPathsStraight = (paths: any) => {
    return paths.every(isStraightPath)
  }

  const returnNewShape = (
    dataURL: string,
    color?: string,
    isBeautify = false
  ) => {
    if (!dataURL || dataURL.trim() === '') {
      return
    }
    let path: any = ''
    const data = returnSvgPath(dataURL, color, isBeautify)
    const dAttributes: any = data.dAttributes
    const leng = dAttributes.length
    const attrArry = data.attrArry
    if (leng === 1) {
      path = dAttributes[0]
    } else if (leng > 1) {
      path = dAttributes
    }
    const originWidth = 1
    const originHeight = 1
    const { maxX, maxY } = getSvgPathRange(dAttributes[0])
    const viewBox = data.viewBox || [maxX || originWidth, maxY || originHeight]

    const shape: any = {
      path,
      viewBox,
    }
    if (attrArry?.length > 0) {
      shape.attrArry = attrArry
    }
    return shape
  }

  // 根据模版数据更新形状
  const CreatShape = (item: any, shape: any) => {
    const { width, height }: any = item
    const props: any = {
      viewBox: shape.viewBox,
      path: shape.path,
      special: shape.special,
    }
    if (shape?.attrArry?.length) {
      props.attrArry = shape.attrArry
    } else {
      props.attrArry = []
    }

    if (!props.viewBox?.length) {
      props.viewBox = item.viewBox ? item.viewBox : [width, height]
    }

    if (shape.pathFormula) {
      props.pathFormula = shape.pathFormula
      props.viewBox = [width, height]

      const pathFormula = SHAPE_PATH_FORMULAS[shape.pathFormula]
      if ('editable' in pathFormula) {
        props.path = pathFormula.formula(
          width,
          height,
          pathFormula.defaultValue
        )
        props.keypoints = pathFormula.defaultValue
      } else props.path = pathFormula.formula(width, height)
    } else {
      props.pathFormula = undefined
      props.keypoints = undefined
    }

    item = { ...item, ...props }

    return item
  }

  // 修改形状
  const changeShape = (shape: any, color?: string) => {
    const { width, height }: any = handleElement.value
    const props: any = {
      viewBox: shape.viewBox,
      path: shape.path,
      special: shape.special,
    }
    if (shape?.attrArry?.length) {
      props.attrArry = shape.attrArry
    } else {
      props.attrArry = []
    }
    if (shape.pathFormula) {
      props.pathFormula = shape.pathFormula
      props.viewBox = [width, height]

      const pathFormula = SHAPE_PATH_FORMULAS[shape.pathFormula]
      if ('editable' in pathFormula) {
        props.path = pathFormula.formula(
          width,
          height,
          pathFormula.defaultValue
        )
        props.keypoints = pathFormula.defaultValue
      } else props.path = pathFormula.formula(width, height)
    } else {
      props.pathFormula = undefined
      props.keypoints = undefined
    }

    if (color) {
      props.fill = color
    }

    slidesStore.updateElement({ id: handleElementId.value, props })
    addHistorySnapshot()
  }
  return {
    returnSvgPath,
    returnNewShape,
    changeShape,
    CreatShape,
  }
}
