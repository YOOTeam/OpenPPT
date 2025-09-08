import type { SlideTheme } from '@/types/slides'

export const theme: SlideTheme = {
  themeColor: {
    type: 'themeColor', // 类型：themeColor、rgb
    value: 'accent1', // 颜色值，如果是themeColor，则为id；否则为十六进制色值
    transparent: 1, // 不透明度0~1
  },
  fontColor: '#333333',
  fontName: 'Microsoft Yahei',
  backgroundColor: {
    type: 'themeColor', // 类型：themeColor、rgb
    value: 'bg1', // 颜色值，如果是themeColor，则为id；否则为十六进制色值
    transparent: 1, // 不透明度0~1
  },

  shadow: {
    h: 3,
    v: 3,
    blur: 2,
    color: {
      type: 'rgb', // 类型：themeColor、rgb
      value: '#808080', // 颜色值，如果是themeColor，则为id；否则为十六进制色值
      transparent: 1, // 不透明度0~1
    },
    openShow: 'none',
  },
  outline: {
    width: 2,
    color: {
      type: 'themeColor', // 类型：themeColor、rgb
      value: 'accent1', // 颜色值，如果是themeColor，则为id；否则为十六进制色值
      transparent: 1, // 不透明度0~1
    },
    style: 'none',
  },
}
