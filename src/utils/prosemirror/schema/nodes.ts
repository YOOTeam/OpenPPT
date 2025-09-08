import { nodes } from 'prosemirror-schema-basic'
import type { Node, NodeSpec } from 'prosemirror-model'
import { listItem as _listItem } from 'prosemirror-schema-list'

interface Attr {
  [key: string]: number | string
}

const orderedList: NodeSpec = {
  attrs: {
    order: {
      default: 1,
    },
    listStyleType: {
      default: '',
    },
    fontsize: {
      default: '',
    },
    color: {
      default: '',
    },
  },
  content: 'list_item+',
  group: 'block',
  parseDOM: [
    {
      tag: 'ol',
      getAttrs: (dom) => {
        const order =
          ((dom as HTMLElement).hasAttribute('start')
            ? (dom as HTMLElement).getAttribute('start')
            : 1) || 1
        const attr: Attr = { order: +order }

        const { listStyleType, fontSize, color } = (dom as HTMLElement).style
        if (listStyleType) attr['listStyleType'] = listStyleType
        if (fontSize) attr['fontsize'] = fontSize
        if (color) attr['color'] = color

        return attr
      },
    },
  ],
  toDOM: (node: Node) => {
    const { order, listStyleType, fontsize, color } = node.attrs
    let style = ''
    if (listStyleType) style += `list-style-type: ${listStyleType};`
    if (fontsize) style += `font-size: ${fontsize};`
    if (color) style += `color: ${color};`

    const attr: Attr = { style }
    if (order !== 1) attr['start'] = order

    return ['ol', attr, 0]
  },
}

const bulletList: NodeSpec = {
  attrs: {
    listStyleType: {
      default: '',
    },
    fontsize: {
      default: '',
    },
    color: {
      default: '',
    },
  },
  content: 'list_item+',
  group: 'block',
  parseDOM: [
    {
      tag: 'ul',
      getAttrs: (dom) => {
        const attr: Attr = {}

        const { listStyleType, fontSize, color } = (dom as HTMLElement).style
        if (listStyleType) attr['listStyleType'] = listStyleType
        if (fontSize) attr['fontsize'] = fontSize
        if (color) attr['color'] = color

        return attr
      },
    },
  ],
  toDOM: (node: Node) => {
    const { listStyleType, fontsize, color } = node.attrs
    let style = ''
    if (listStyleType) style += `list-style-type: ${listStyleType};`
    if (fontsize) style += `font-size: ${fontsize};`
    if (color) style += `color: ${color};`

    return ['ul', { style }, 0]
  },
}

const listItem: NodeSpec = {
  ..._listItem,
  content: 'paragraph block*',
  group: 'block',
}
const createKey = () => {
  function random5() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
    const rand = new Uint8Array(5)
    crypto.getRandomValues(rand)
    return Array.from(rand, (n) => chars[n & 31]).join('')
  }
  const keylist = [
    '4e818f8af7d5415c',
    '8696a8c863769700',
    '1709098fe6dc6ffc',
    '56cef5f17c3165b1',
    '85d60b66a703ff37',
    'cc23fd5f34e1d57d',
  ]
  return random5() + keylist[Math.floor(Math.random() * keylist.length)]
}

const paragraph: NodeSpec = {
  attrs: {
    align: {
      default: '',
    },
    indent: {
      default: 0,
    },
    textIndent: {
      default: 0,
    },
    textLineHeights: {
      default: 0,
    },
    textMarginTop: {
      default: 0,
    },
    textMarginBottom: {
      default: 0,
    },
  },
  content: 'inline*',
  group: 'block',
  parseDOM: [
    {
      tag: 'p',
      getAttrs: (dom) => {
        const { textAlign, textIndent, lineHeight, marginTop, marginBottom } = (
          dom as HTMLElement
        ).style
        let align =
          (dom as HTMLElement).getAttribute('align') || textAlign || ''
        align = /(left|right|center|justify)/.test(align) ? align : ''

        const textLineHeights =
          (dom as HTMLElement).getAttribute('textLineHeights') ||
          parseFloat(lineHeight)

        const textMarginTop =
          (dom as HTMLElement).getAttribute('textMarginTop') ||
          parseFloat(marginTop)

        const textMarginBottom =
          (dom as HTMLElement).getAttribute('textMarginBottom') ||
          parseFloat(marginBottom)

        let textIndentLevel = 0
        if (textIndent) {
          if (/em/.test(textIndent)) {
            textIndentLevel = parseInt(textIndent)
          } else if (/px/.test(textIndent)) {
            textIndentLevel = Math.floor(parseInt(textIndent) / 20)
            if (!textIndentLevel) textIndentLevel = 1
          }
        }

        const indent = +((dom as HTMLElement).getAttribute('data-indent') || 0)

        return {
          align,
          textLineHeights,
          textMarginTop,
          textMarginBottom,
          indent,
          textIndent: textIndentLevel,
        }
      },
    },
    {
      tag: 'img',
      ignore: true,
    },
    {
      tag: 'pre',
      skip: true,
    },
  ],
  toDOM: (node: Node) => {
    const {
      align,
      indent,
      textIndent,
      textLineHeights,
      textMarginTop,
      textMarginBottom,
    } = node.attrs
    let style = ''
    if (align && align !== 'left') style += `text-align: ${align};`
    if (textLineHeights) style += `line-height: ${textLineHeights};`
    if (textMarginTop) style += `margin-top: ${textMarginTop}px;`
    if (textMarginBottom) style += `margin-bottom: ${textMarginBottom}px;`
    if (textIndent) style += `text-indent: ${textIndent * 20}px;`

    const attr: Attr = { style }
    if (indent) attr['data-indent'] = indent
    attr['data-key'] = createKey()
    return ['p', attr, 0]
  },
}

const { doc, blockquote, text } = nodes

export default {
  doc,
  paragraph,
  blockquote,
  text,
  ordered_list: orderedList,
  bullet_list: bulletList,
  list_item: listItem,
}
