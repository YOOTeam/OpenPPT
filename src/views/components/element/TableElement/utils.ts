import type { CSSProperties } from 'vue'
import type { TableCellStyle } from '@/types/slides'
import useColor from '@/hooks/useColor'

/**
 * 计算单元格文本样式
 * @param style 单元格文本样式原数据
 */
export const getTextStyle = (style?: TableCellStyle): CSSProperties => {
  const { initColor } = useColor()
  if (!style) return {}
  const {
    bold,
    em,
    underline,
    strikethrough,
    color,
    backcolor,
    fontsize,
    fontname,
    align,
  } = style

  const colorlist: any = color
  const bgColorlist: any = backcolor
  const colors: any = initColor(colorlist)
  const backcolors: any = backcolor ? initColor(bgColorlist) : ''
  let textDecoration = `${underline ? 'underline' : ''} ${
    strikethrough ? 'line-through' : ''
  }`
  if (textDecoration === ' ') textDecoration = 'none'

  return {
    fontWeight: bold ? 'bold' : 'normal',
    fontStyle: em ? 'italic' : 'normal',
    textDecoration,
    color: colors || '#000',
    backgroundColor: backcolors || '',
    fontSize: fontsize || '14px',
    fontFamily: fontname || '微软雅黑',
    textAlign: align || 'left',
  }
}

export const formatText = (text: string) => {
  return text.replace(/\n/g, '</br>').replace(/ /g, '&nbsp;')
}
