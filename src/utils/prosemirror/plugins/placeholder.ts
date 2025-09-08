import type { EditorState } from 'prosemirror-state'
import { Plugin, PluginKey, AllSelection } from 'prosemirror-state'
import { Fragment } from 'prosemirror-model'
import type { EditorView } from 'prosemirror-view'
import type { MarkSpec, MarkType, Node } from 'prosemirror-model'
import { selectAll } from 'prosemirror-commands'

export const PLACEHOLDER_PLUGIN_KEY = new PluginKey('prosemirror-placeholder')

export type Options = {
  className: string
}

const defaultOptions: Options = {
  className: 'prosemirror-placeholder-mark',
}

function nodeHasMark(node: Node, markType: MarkType) {
  return (
    node &&
    node.marks &&
    node.marks.filter((mark) => mark.type === markType).length > 0
  )
}

function CreateMark(options?: Options): MarkSpec {
  options = { ...defaultOptions, ...options }

  return {
    parseDOM: [{ tag: `span.${options.className}` }],
    toDOM: () => {
      const className = options!.className
      return ['span', { class: className }, 0]
    },
  }
}

function initState(view: EditorView, markType: MarkType) {
  // 将当前文本框内容转换为占位符
  selectAll(view.state, view.dispatch)
  const { $from, $to } = view.state.selection
  view.dispatch(view.state.tr.addMark($from.pos, $to.pos, markType.create()))

  const pluginState = PLACEHOLDER_PLUGIN_KEY.getState(view.state)
  pluginState.active = true
  pluginState.originalDoc = view.state.doc.cut(0)
}

function placeholderPlugin(markType: MarkType) {
  // 判断doc内容是否为空
  function isEmptyDoc(state: EditorState) {
    const doc = state.doc
    if (doc.content.size === 0) return true
    if (
      doc.content.content.length === 1 &&
      doc.content.content[0].content === Fragment.empty
    ) {
      return true
    }

    return false
  }

  // 判断doc是否只包含一个PlaceHolder
  function isPlaceHolderDoc(state: EditorState) {
    const doc = state.doc
    let isPlaceHolder_
    let stop: boolean = false

    doc.descendants((node) => {
      if (!stop && node.isInline) {
        isPlaceHolder_ = nodeHasMark(node, markType)
        if (!isPlaceHolder_) {
          // 如果有任一节点不为placeholder，则停止遍历
          stop = true
        }
      }
    })

    return isPlaceHolder_ === undefined ? false : isPlaceHolder_
  }

  return new Plugin({
    state: {
      init(config, instance) {
        return { active: false, originalDoc: instance.doc.copy() }
      },
      apply(tr, value, oldState, newState) {
        if (!value.active) return value
        if (!(isEmptyDoc(newState) || isPlaceHolderDoc(newState))) {
          value.active = false
        }
        return value
      },
    },
    props: {
      handleDOMEvents: {
        focus(view, event) {
          if (this.getState(view.state)?.active) {
            let tr = view.state.tr
            tr = tr.setSelection(new AllSelection(tr.doc))
            tr = tr.deleteSelection()

            let storedMarks
            let node: Node | null = view.state.doc

            while (node !== null) {
              if (node.isInline) {
                storedMarks = node.marks
                break
              }
              node = node.maybeChild(0)
            }

            if (storedMarks) {
              storedMarks = storedMarks.filter((value) => {
                return value.type !== markType
              })
              tr.ensureMarks(storedMarks)
            }

            view.dispatch(tr.scrollIntoView())
          }
        },
        blur(view, event) {
          const { active, originalDoc } = this.getState(view.state)!

          if (active) {
            let tr = view.state.tr
            tr = tr.setSelection(new AllSelection(tr.doc))
            tr = tr.replaceSelectionWith(originalDoc, false)

            view.dispatch(tr.scrollIntoView())
          }
        },
      },
    },
    key: PLACEHOLDER_PLUGIN_KEY,
  })
}

export { placeholderPlugin, CreateMark, initState }
