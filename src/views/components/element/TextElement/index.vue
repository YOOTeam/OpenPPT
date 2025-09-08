<template>
  <div
    class="editable-element-text"
    :class="{ lock: elementInfo.lock }"
    :style="{
      top: elementInfo.top + 'px',
      left: elementInfo.left + 'px',
      width: elementInfo.width + 'px',
      height: elementInfo.height + 'px',
    }"
  >
    <div
      class="rotate-wrapper"
      :style="{ transform: `rotate(${elementInfo.rotate}deg)` }"
    >
      <div
        class="element-content"
        ref="elementRef"
        data-key="68df251594547faf"
        :class="[elementInfo.verticalAlign]"
        :style="{
          width: elementInfo.vertical ? 'auto' : elementInfo.width + 'px',
          height: elementInfo.height + 'px',
          backgroundColor: initColor(elementInfo.fill),
          opacity: elementInfo.opacity,
          textShadow: shadowStyle,
          lineHeight: elementInfo.lineHeight,
          letterSpacing: (elementInfo.wordSpace || 0) + 'px',
          color: initColor(elementInfo.defaultColor),
          fontFamily: elementInfo.defaultFontName,
          writingMode: elementInfo.vertical ? 'vertical-rl' : 'horizontal-tb',
        }"
        v-contextmenu="contextmenus"
        @mousedown="($event) => handleInitSelect($event)"
        @touchstart="($event) => handleInitSelect($event)"
      >
        <ElementOutline
          :width="elementInfo.width"
          :height="elementInfo.height"
          :outline="elementInfo.outline"
          :id="elementInfo.id"
          :softEdge="elementInfo.softEdge"
        />
        <ProsemirrorEditor
          ref="prosemirrorEditorRefText"
          :id="`eidtor-text-${elementInfo.id}`"
          class="text"
          :elementId="elementInfo.id"
          :ace="ace"
          :defaultColor="initColor(elementInfo.defaultColor)"
          :defaultFontName="elementInfo.defaultFontName"
          :editable="CanEditable"
          :value="elementInfo.content"
          :isPlaceHolder="elementInfo.isPlaceHolder"
          :style="{
            '--paragraphSpace': `${
              elementInfo.paragraphSpace === undefined
                ? 0
                : elementInfo.paragraphSpace
            }px`,
            cursor: drageTextCursor
              ? drageTextCursor
              : !CanEditable && !elementInfo.lock
              ? 'default'
              : 'text',
          }"
          @removerPlaceHolder="updatePlaceholder"
          @update="(value) => updateContent(value)"
          @mousedown="($event) => handleTextSelect($event)"
          @touchstart="($event) => handleTextSelect($event)"
        />
        <div v-if="drageElement" class="isdisableMark"></div>
        <!-- 当字号过大且行高较小时，会出现文字高度溢出的情况，导致拖拽区域无法被选中，因此添加了以下节点避免该情况 -->
        <div class="drag-handler top"></div>
        <div class="drag-handler bottom"></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { debounce } from 'lodash'
import { useMainStore, useSlidesStore } from '@/store'
import type { PPTTextElement } from '@/types/slides'
import type { ContextmenuItem } from '@/components/Contextmenu/types'
import useElementShadow from '@/views/components/element/hooks/useElementShadow'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import { isPC } from '@/utils/common'
import ElementOutline from '@/views/components/element/ElementOutline.vue'
import ProsemirrorEditor from '@/views/components/element/ProsemirrorEditor.vue'
import useColor from '@/hooks/useColor'
import emitter, { EmitterEvents } from '@/utils/emitter'
const props = defineProps<{
  elementInfo: PPTTextElement
  selectElement: (
    e: MouseEvent | TouchEvent,
    element: PPTTextElement,
    canMove?: boolean
  ) => void
  dragElement: (e: MouseEvent | TouchEvent, element: PPTTextElement) => void
  contextmenus: () => ContextmenuItem[] | null
}>()

const prosemirrorEditorRefText = ref<InstanceType<typeof ProsemirrorEditor>>()
const isFirstClick = ref(false)
const CanEditable = ref(false)
const ace = ref('')
const { initColor } = useColor()
const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const {
  handleElementId,
  handleElement,
  isScaling,
  activeElementIdList,
  activeGroupElementId,
  drageTextCursor,
  drageElement,
} = storeToRefs(mainStore)

const { addHistorySnapshot } = useHistorySnapshot()

const elementRef = ref<HTMLElement>()

const shadow = computed(() => props.elementInfo.shadow)

const { shadowStyle } = useElementShadow(shadow)

// "handleTextSelect" 框体内部文本框点击事件捕捉
// "handleInitSelect" 框体剩余部分点击事件捕捉
const handleTextSelect = (event: any) => {
  if (props.elementInfo.lock) {
    return
  }

  event.stopPropagation()

  if (
    handleElementId.value !== props.elementInfo.id ||
    (activeElementIdList.value?.length > 1 && !activeGroupElementId.value)
  ) {
    props.selectElement(event, props.elementInfo, false)
  }

  if (CanEditable.value) {
    return
  }

  // 为document注册 鼠标监听事件
  const ok = props.dragElement(event, props.elementInfo)
  if (ok) {
    // 获取先前的 onmouseup 事件处理逻辑
    const beforeOnmouseup = document.onmouseup

    const isTouchEvent = !(event instanceof MouseEvent)
    const startPageX = isTouchEvent
      ? event.changedTouches[0].pageX
      : event.pageX
    const startPageY = isTouchEvent
      ? event.changedTouches[0].pageY
      : event.pageY

    const wrapFunc = (event_: MouseEvent | TouchEvent) => {
      beforeOnmouseup.call(document, event_)

      const currentPageX =
        event_ instanceof MouseEvent
          ? event_.pageX
          : event_.changedTouches[0].pageX
      const currentPageY =
        event_ instanceof MouseEvent
          ? event_.pageY
          : event_.changedTouches[0].pageY

      const sorptionRange = 5

      // 如果点击位置和抬起位置之间横纵坐标绝对值小于 sorptionRange , 表示当次操作为点选事件
      const isClickOperation =
        Math.abs(startPageX - currentPageX) < sorptionRange &&
        Math.abs(startPageY - currentPageY) < sorptionRange

      if (
        (activeElementIdList.value?.length == 1 ||
          activeGroupElementId.value === props.elementInfo.id) &&
        isClickOperation
      ) {
        CanEditable.value = true
        if (isPC()) {
          prosemirrorEditorRefText.value.focus()
        } else {
          emitter.emit(EmitterEvents.RICH_TEXT_COMMAND, {
            action: { command: 'cursor2tail' },
          })
        }
      }
    }
    // 覆盖先前的 onmouseup 事件处理逻辑
    document.onmouseup = wrapFunc
  }
}

const handleInitSelect = (event: any) => {
  if (props.elementInfo.lock) {
    return
  }

  event.stopPropagation()
  if (
    handleElementId.value !== props.elementInfo.id ||
    (activeElementIdList.value?.length > 1 && !activeGroupElementId.value)
  ) {
    props.selectElement(event, props.elementInfo, false)
  }
  CanEditable.value = false
  props.dragElement(event, props.elementInfo)
}

const isCursorVisible = () => {
  const selection = window.getSelection()
  if (!selection.rangeCount) return false

  const range = selection.getRangeAt(0)
  const editableDiv = document.querySelector('.ProseMirror')
  return editableDiv.contains(range.commonAncestorContainer)
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.ctrlKey && e.key === 'm') {
    ace.value = '593e4bed4963d8d8'
  }
}

// 监听文本元素的尺寸变化，当高度变化时，更新高度到vuex
// 如果高度变化时正处在缩放操作中，则等待缩放操作结束后再更新
const realHeightCache = ref(-1)
const realWidthCache = ref(-1)

watch(handleElementId, (value) => {
  if (value !== props.elementInfo.id) {
    CanEditable.value = false
  }
})

watch(isScaling, () => {
  if (handleElementId.value !== props.elementInfo.id) return

  if (!isScaling.value) {
    if (!props.elementInfo.vertical && realHeightCache.value !== -1) {
      slidesStore.updateElement({
        id: props.elementInfo.id,
        props: { height: realHeightCache.value },
      })
      realHeightCache.value = -1
    }

    if (props.elementInfo.vertical && realWidthCache.value !== -1) {
      slidesStore.updateElement({
        id: props.elementInfo.id,
        props: { width: realWidthCache.value },
      })
      realWidthCache.value = -1
    }
  }
})

const updateTextElementHeight = (entries: ResizeObserverEntry[]) => {
  const contentRect = entries[0].contentRect

  if (!elementRef.value) return
  let realHeight = contentRect.height + 10
  const realWidth = contentRect.width + 6

  if (props.elementInfo.autoSize === 'shapeFitText') {
    const child = entries[0]?.target?.children
    const childList = Array.from(child)
    const content: any = childList.find(
      (item: any) =>
        item.className &&
        typeof item.className === 'string' &&
        item?.className?.indexOf('prosemirror') > -1
    )

    if (content?.offsetHeight) {
      realHeight = content?.offsetHeight + 10
    }
  }

  if (!props.elementInfo.vertical && props.elementInfo.height !== realHeight) {
    if (!isScaling.value && realHeight) {
      slidesStore.updateElement({
        id: props.elementInfo.id,
        props: { height: realHeight },
      })
    } else realHeightCache.value = realHeight
  }
  if (props.elementInfo.vertical && props.elementInfo.width !== realWidth) {
    if (!isScaling.value) {
      slidesStore.updateElement({
        id: props.elementInfo.id,
        props: { width: realWidth },
      })
    } else realWidthCache.value = realWidth
  }
}
const resizeObserver = new ResizeObserver(updateTextElementHeight)

onMounted(() => {
  if (elementRef.value) resizeObserver.observe(elementRef.value)
})
onUnmounted(() => {
  if (elementRef.value) resizeObserver.unobserve(elementRef.value)
})
document.addEventListener('keydown', handleKeyDown)
const fontSizeList = ref([])
const updateContent = (content: string) => {
  let height = props.elementInfo.height
  if (props.elementInfo.autoSize === 'shapeFitText') {
    const dom: any = elementRef.value.children[0]
    if (dom) {
      height = dom?.offsetHeight + 16
    }
  } else if (props.elementInfo.autoSize === 'textFitShape') {
    const dom: any = elementRef.value.children[0]
    if (height < dom.offsetHeight) {
      const fontSizeHeight = dom.offsetHeight
      const boxH = props.elementInfo.height - 16
      // 1.二分法向下找出小于文本框高度的第一个值。        当前字体/2,当前字体文本框高度/2
      // 2.(文本框最大高度 - 二分法之后的文本框最大高度)/(最大字号 - 二分法之后的字号)=1个字号对应的高度
      // 3.(文本框的高度-二分法之后的文本框最大高度)/1个字号对应的高度=字号差值
      // 4.二分法之后的字号+字号差值
      fontSizeList.value = []
      getFontSize(dom)
      const fontSize = Math.max(...fontSizeList.value)
      let halfFontSize = fontSize,
        halfFontSizeHeight = fontSizeHeight

      while (halfFontSizeHeight > boxH && boxH > 0) {
        halfFontSize = Math.floor(halfFontSize / 2)
        halfFontSizeHeight = halfFontSizeHeight / 2
      }

      const autoHeight = parseInt(
        (fontSizeHeight - halfFontSizeHeight) / (fontSize - halfFontSize)
      )
      const autoFontSize = parseInt((boxH - halfFontSizeHeight) / autoHeight)
      const newFontSize = halfFontSize + autoFontSize

      getFontSize(dom.children[0], newFontSize)
      const nodeList = Array.from(dom.children[0].children)

      let str = ''
      nodeList.forEach((node: any) => {
        if (node.childNodes.length === 1) {
          const child = node.childNodes[0]
          if (child.nodeType === 3) {
            node.style.fontSize = `${newFontSize}px`
          }
        }
        str += node.outerHTML
      })
      if (str) {
        content = str
      }
    }
  }

  slidesStore.updateElement({
    id: props.elementInfo.id,
    props: { content, height },
  })

  addHistorySnapshot()
}

const getFontSize = (element?: any, reduceValue?: any) => {
  // 获取当前元素的字体大小
  const fontSize = window.getComputedStyle(element).fontSize
  if (reduceValue) {
    element.style.fontSize = `${reduceValue}px`
  } else {
    fontSizeList.value.push(parseFloat(fontSize))
  }

  // 遍历当前元素的所有子元素
  element.childNodes.forEach((child) => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      // 确保是元素节点
      getFontSize(child, reduceValue) // 递归调用
    }
  })
}
const updatePlaceholder = () => {
  slidesStore.updateElement({
    id: props.elementInfo.id,
    props: { isPlaceHolder: false, content: '' },
  })
  addHistorySnapshot()
}

const checkEmptyText = debounce(
  function () {
    const pureText = props.elementInfo?.content?.replace(/<[^>]+>/g, '')
    if (!pureText) slidesStore.deleteElement(props.elementInfo.id)
  },
  600,
  { trailing: true }
)

const isHandleElement = computed(
  () => handleElementId.value === props.elementInfo.id
)
watch(isHandleElement, () => {
  if (!isHandleElement.value) checkEmptyText()
})
</script>

<style lang="scss" scoped>
.editable-element-text {
  position: absolute;
  .isdisableMark {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    cursor: move;
  }

  &.lock .element-content {
    cursor: default;
  }

  .element-content {
    display: flex;
    flex-direction: column;

    &.editable {
      pointer-events: all;
    }

    &.top {
      justify-content: flex-start;
    }
    &.center {
      justify-content: center;
    }
    &.bottom {
      justify-content: flex-end;
    }
  }
}
.rotate-wrapper {
  width: 100%;
  height: 100%;
}
.moveBox {
  .ProseMirror {
    user-select: none !important;
  }
}
.element-content {
  position: relative;
  padding: 5px 10px;
  line-height: 1.5;
  word-break: break-word;

  .text {
    position: relative;
  }

  ::v-deep(a) {
    cursor: text;
  }
}
.drag-handler {
  height: 5px;
  position: absolute;
  left: 0;
  right: 0;

  &.top {
    top: 0;
  }
  &.bottom {
    bottom: 0;
  }
}
</style>
