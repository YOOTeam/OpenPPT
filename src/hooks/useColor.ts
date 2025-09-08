import { storeToRefs } from 'pinia'
import { useSlidesStore } from '@/store'
import tinycolor from 'tinycolor2'
export default () => {
  const slidesStore = useSlidesStore()
  const { slides, currentSlide, theme, themeColorList } =
    storeToRefs(slidesStore)

  const initColor = (value: any) => {
    if (!value) return 'rgba(0,0,0,0)'
    let color = ''
    let colorList = value?.templateThemeColors
      ? value.templateThemeColors
      : themeColorList?.value
    if (!colorList) {
      colorList = {
        text1: '#1726c7',
        bg1: '#FFFFFF',
        text2: '#0714a8',
        bg2: '#3C1514',
        accent1: '#3C0EFF ',
        accent2: '#C74141',
        accent3: '#CB663D',
        accent4: '#C66868',
        accent5: '#C85858',
        accent6: '#CA6C6C',
      }
    }
    if (typeof value === 'object') {
      if (value.type === 'themeColor') {
        color = colorList[value.value]
      } else if (value.type === 'rgb') {
        color = value.value
      } else if (value.type === 'noFill') {
        return 'rgba(0,0,0,0)'
      }

      if (value.transparent === 0 || value.transparent < 1) {
        const rgba = tinycolor(color)
        const num = parseFloat(value.transparent)
        color = rgba.setAlpha(num).toRgbString()
      }

      if (value.brightness) {
        const hsl = tinycolor(color).toHsl()

        const l = Math.trunc(hsl.l * 100)
        let newLight = 0
        if (value.brightness > 0) {
          newLight = ((100 - l) * value.brightness) / 100 + l
        } else {
          newLight = (l * (100 - Math.abs(value.brightness))) / 100
        }
        newLight = Math.round(newLight) / 100
        hsl.l = newLight

        if (hsl.a < 1) {
          color = tinycolor(hsl).toHex8String().toUpperCase()
        } else {
          color = tinycolor(hsl).toHexString().toUpperCase()
        }
      }
    } else {
      color = value === 'noFill' ? 'rgba(0,0,0,0)' : value
    }

    return color
  }

  const rgbaToHex = (rgba: any) => {
    // 将RGBA字符串拆分

    const arr = rgba.split('(')[1].split(')')[0].split(',')
    if (!arr?.length) return rgba
    // 转换RGBA值为16进制
    let r = parseInt(arr[0], 10).toString(16)
    let g = parseInt(arr[1], 10).toString(16)
    let b = parseInt(arr[2], 10).toString(16)
    let a = Math.round(parseFloat(arr[3]) * 255).toString(16)

    // 补齐16进制值，确保每个值都是两位数字
    r = r.length === 2 ? r : '0' + r
    g = g.length === 2 ? g : '0' + g
    b = b.length === 2 ? b : '0' + b
    a = a.length === 2 ? a : '0' + a

    // 返回16进制颜色值
    return '#' + r + g + b + a
  }

  const setColorLight = (color: any, brightness: any) => {
    // 将颜色转换为RGB
    const rgb = hexToRgb(color)

    if (!rgb) return null // 如果转换失败，则返回null

    // 计算亮暗度调整
    const adjustment = brightness / 100
    const newR = rgb.r + (255 - rgb.r) * adjustment
    const newG = rgb.g + (255 - rgb.g) * adjustment
    const newB = rgb.b + (255 - rgb.b) * adjustment

    // 返回调整后的RGBA颜色字符串
    return `rgba(${Math.round(newR)}, ${Math.round(newG)}, ${Math.round(
      newB
    )}, ${rgb.a || '1'})`
  }

  const hexToRgb = (hex: string) => {
    // 简化的十六进制颜色转RGB的函数
    const result =
      /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
          a: result[4] ? parseInt(result[4], 16) / 255 : null,
        }
      : null
  }

  return {
    initColor,
    rgbaToHex,
  }
}
