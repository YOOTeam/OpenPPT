<template>
  <div
    class="editable-element-shape"
    :class="{
      lock: elementInfo.lock,
      'format-painter': shapeFormatPainter,
    }"
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
        :style="{
          opacity: elementInfo.opacity,
          filter: shadowStyle ? `drop-shadow(${shadowStyle})` : '',
          transform: flipStyle,
          color: initColor(text.defaultColor),
          fontFamily: text.defaultFontName,
        }"
        v-contextmenu="contextmenus"
        @mousedown="($event) => handleSelectElement($event)"
        @mouseup="execFormatPainter()"
        @touchstart="($event) => handleSelectElement($event)"
        @dblclick="startEdit()"
      >
        <svg
          overflow="visible"
          :width="elementInfo.width"
          :height="elementInfo.height"
        >
          <defs
            v-if="
              elementInfo.gradient ||
              elementInfo.fillPicture ||
              elementInfo?.softEdge ||
              elementInfo?.outline?.gradient
            "
          >
            <GradientDefs
              v-if="elementInfo.gradient"
              :id="`editabel-gradient-${elementInfo.id}`"
              :type="elementInfo.gradient.type"
              :colors="elementInfo.gradient.colors"
              :rotate="elementInfo.gradient.rotate"
              :radialGradient="elementInfo.gradient?.fillToRect"
            />
            <FillPictureDefs
              v-if="elementInfo.fillPicture"
              :id="`editabel-fillPicture-${elementInfo.id}`"
              :src="elementInfo.fillPicture.src"
              :viewW="elementInfo.viewBox[0]"
              :viewY="elementInfo.viewBox[1]"
              :imgFillType="elementInfo.imgFillType"
              :fillPicture="elementInfo.fillPicture"
            />

            <filter
              :id="`editabel-blurFilter-${elementInfo.id}`"
              v-if="elementInfo.softEdge"
            >
              <feGaussianBlur
                in="SourceGraphic"
                :stdDeviation="elementInfo.softEdge"
              />
            </filter>

            <GradientDefs
              v-if="elementInfo?.outline?.gradient"
              :id="`shape-outline-${elementInfo.id}`"
              :type="elementInfo?.outline?.gradient?.type"
              :colors="elementInfo?.outline?.gradient?.colors"
              :rotate="elementInfo?.outline?.gradient?.rotate"
              :radialGradient="elementInfo?.outline?.gradient?.fillToRect"
            />
          </defs>
          <g
            :transform="`scale(${(
              elementInfo.width / elementInfo.viewBox[0]
            ).toFixed(3)}, ${scaleY}) translate(0,0) matrix(1,0,0,1,0,0)`"
          >
            <template v-if="typeof elementInfo.path === 'object'">
              <path
                class="shape-path"
                vector-effect="non-scaling-stroke"
                stroke-linecap="butt"
                stroke-miterlimit="8"
                v-for="(path, index) in elementInfo.path"
                :key="path"
                :d="path"
                :fill="fillStyle"
                :filter="
                  elementInfo?.softEdge
                    ? `url(#editabel-blurFilter-${elementInfo.id})`
                    : ''
                "
                :stroke="
                  elementInfo?.outline?.gradient
                    ? `url(#shape-outline-${elementInfo.id})`
                    : outlineColor
                "
                :stroke-width="
                  elementInfo.outline && elementInfo.outline.style != 'none'
                    ? outlineWidth
                    : 0
                "
                :stroke-dasharray="strokeDashArray"
                v-bind="computedAttrs(index)"
              ></path>
            </template>
            <path
              v-else
              class="shape-path"
              vector-effect="non-scaling-stroke"
              stroke-linecap="butt"
              stroke-miterlimit="8"
              :filter="
                elementInfo.softEdge
                  ? `url(#editabel-blurFilter-${elementInfo.id})`
                  : ''
              "
              :d="elementInfo.path"
              :fill="fillStyle"
              :stroke="
                elementInfo?.outline?.gradient
                  ? `url(#shape-outline-${elementInfo.id})`
                  : outlineColor
              "
              :stroke-width="
                elementInfo.outline && elementInfo.outline.style != 'none'
                  ? outlineWidth
                  : 0
              "
              :stroke-dasharray="strokeDashArray"
              v-bind="computedAttrs(0)"
            ></path>
          </g>
        </svg>

        <div
          class="shape-text"
          :class="[text.align, { editable: editable || text.content }]"
          :style="{
            lineHeight: text?.lineHeight,
            letterSpacing: (text?.wordSpace || 0) + 'px',
          }"
        >
          <ProsemirrorEditor
            ref="prosemirrorEditorRef"
            v-if="editable || text.content"
            :elementId="elementInfo.id"
            :isPlaceHolder="elementInfo.isPlaceHolder"
            :style="{
              '--paragraphSpace': `${
                text.paragraphSpace === undefined ? 0 : text.paragraphSpace
              }px`,
              cursor: drageTextCursor
                ? drageTextCursor
                : !CanEditable && !elementInfo.lock
                ? 'default'
                : 'text',
            }"
            :defaultColor="initColor(text.defaultColor)"
            :defaultFontName="text.defaultFontName"
            :editable="CanEditable"
            :value="text.content"
            @update="(value) => updateText(value)"
            @blur="checkEmptyText()"
            @mousedown="($event) => handleTextSelect($event)"
          />
          <div v-if="drageElement" class="isdisableMark"></div>
        </div>
      </div>
    </div>

    <div v-if="showMark" class="mark-shape">
      <div class="spinner-box">
        <div class="spinner-border"></div>
        <div class="spinner"></div>
      </div>
      <p class="spinner-tips" v-if="elementInfo.width > 80">
        {{ $t('canvas.imgLoading') }}
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import type { PPTShapeElement } from '@/types/slides'
import type { ContextmenuItem } from '@/components/Contextmenu/types'
import useElementOutline from '@/views/components/element/hooks/useElementOutline'
import useElementShadow from '@/views/components/element/hooks/useElementShadow'
import useElementFlip from '@/views/components/element/hooks/useElementFlip'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import FillPictureDefs from './FillPictureDefs.vue'
import GradientDefs from './GradientDefs.vue'
import ProsemirrorEditor from '@/views/components/element/ProsemirrorEditor.vue'
import useColor from '@/hooks/useColor'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const props = defineProps<{
  elementInfo: any
  selectElement: (
    e: MouseEvent | TouchEvent,
    element: PPTShapeElement,
    canMove?: boolean
  ) => void
  dragElement: (e: MouseEvent | TouchEvent, element: PPTShapeElement) => void
  contextmenus: () => ContextmenuItem[] | null
}>()

const showMark = computed(() => {
  return (
    props.elementInfo.isApi ||
    props.elementInfo.iconResect ||
    props.elementInfo.imgResect
  )
})

const computedAttrs = computed((value?: any) => (value?: any) => {
  let obj = {}
  if (props.elementInfo?.attrArry?.length > 0) {
    obj = props.elementInfo?.attrArry[value]
  }
  return obj
})
const { initColor } = useColor()
const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const {
  handleElementId,
  shapeFormatPainter,
  activeElementIdList,
  activeGroupElementId,
  drageTextCursor,
  drageElement,
} = storeToRefs(mainStore)

const { addHistorySnapshot } = useHistorySnapshot()
const CanEditable = ref(false)
const isFirstClick = ref(false)
const handleTextSelect = (event: any) => {
  if (
    props.elementInfo.lock ||
    (activeElementIdList.value?.length > 1 && !activeGroupElementId.value)
  ) {
    return
  }
  event.stopPropagation()
  if (handleElementId.value !== props.elementInfo.id) {
    isFirstClick.value = true
    CanEditable.value = false
    handleSelectElement(event)
    return
  }
  const oldX = event.clientX
  let isMove = false
  document.onmousemove = (e) => {
    isMove = true
    const newX = e.clientX
    if (Math.abs(oldX - newX) > 5) {
      // 拖动
      if (!CanEditable.value) {
        handleSelectElement(event)
      }
    } else {
      // 点击
      CanEditable.value = true
      handleSelectElement(event, false)
      setTimeout(() => {
        prosemirrorEditorRef.value.focus()
      }, 100)
    }
  }
  document.onmouseup = () => {
    if (!isMove) {
      CanEditable.value = true
      handleSelectElement(event, false)
      setTimeout(() => {
        prosemirrorEditorRef.value.focus()
      }, 100)
    }
    document.onmousemove = null
    document.onmouseup = null
  }
}

const handleSelectElement = (e: MouseEvent | TouchEvent, canMove = true) => {
  if (props.elementInfo.lock) return
  e.stopPropagation()

  props.selectElement(e, props.elementInfo, canMove)
}

const execFormatPainter = () => {
  if (!shapeFormatPainter.value) return
  const { keep, ...newProps } = shapeFormatPainter.value

  slidesStore.updateElement({
    id: props.elementInfo.id,
    props: newProps,
  })

  addHistorySnapshot()
  if (!keep) mainStore.setShapeFormatPainter(null)
}
const scaleY = computed(() => {
  return isNaN(props.elementInfo.height / props.elementInfo.viewBox[1]) ||
    props.elementInfo.height / props.elementInfo.viewBox[1] === Infinity
    ? 0
    : (props.elementInfo.height / props.elementInfo.viewBox[1]).toFixed(3)
})
const fillStyle = computed(() => {
  let resule = ''
  if (props.elementInfo.gradient) {
    resule = `url(#editabel-gradient-${props.elementInfo.id})`
  } else if (props.elementInfo.fillPicture) {
    resule = `url(#editabel-fillPicture-${props.elementInfo.id})`
  } else if (props.elementInfo.fill === 'noFill') {
    resule = 'none'
  } else {
    resule = initColor(props.elementInfo.fill)
  }

  return resule
})

const outline = computed(() => props.elementInfo.outline)
const { outlineWidth, outlineColor, strokeDashArray, outlineId } =
  useElementOutline(outline)

const shadow = computed(() => props.elementInfo.shadow)
const { shadowStyle } = useElementShadow(shadow)

const flipH = computed(() => props.elementInfo.flipH)
const flipV = computed(() => props.elementInfo.flipV)
const { flipStyle } = useElementFlip(flipH, flipV)

const editable = ref(false)

watch(handleElementId, () => {
  if (handleElementId.value !== props.elementInfo.id) {
    if (editable.value) editable.value = false
    CanEditable.value = false
  }
})

const text = computed(() => {
  const defaultText: any = {
    content: '',
    defaultFontName: '微软雅黑',
    defaultColor: {
      type: 'themeColor',
      value: 'text1',
      transparent: 1,
    },
    align: 'center',
  }
  if (!props.elementInfo.text) return defaultText

  return props.elementInfo.text
})

const updateText = (content: string) => {
  const _text = { ...text.value, content }
  slidesStore.updateElement({
    id: props.elementInfo.id,
    props: { text: _text },
  })

  addHistorySnapshot()
}

const checkEmptyText = () => {
  if (!props.elementInfo.text) return
  const pureText = props.elementInfo.text.content.replace(/<[^>]+>/g, '')
  if (!pureText) {
    slidesStore.removeElementProps({
      id: props.elementInfo.id,
      propName: 'text',
    })
    addHistorySnapshot()
  }
}

const prosemirrorEditorRef = ref<InstanceType<typeof ProsemirrorEditor>>()
const startEdit = () => {
  editable.value = true
  CanEditable.value = true
  nextTick(
    () => prosemirrorEditorRef.value && prosemirrorEditorRef.value.focus()
  )
}
</script>

<style lang="scss" scoped>
.editable-element-shape {
  position: absolute;
  pointer-events: none;
  .isdisableMark {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    cursor: move;
  }
  .mark-shape {
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #f2effa;
    border-radius: 10rem;
    .spinner-tips {
      font-size: 12px;
      color: #1a1a1a;
      margin: 10rem 0;
    }
    .spinner-box {
      position: relative;
      width: 40rem;
      height: 40rem;
      margin-bottom: 10rem;

      .spinner-border {
        position: absolute;
        margin: auto;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
        width: 40rem;
        height: 40rem;
        border: 10rem solid #eadffa;
        border-radius: 50%;
      }

      .spinner {
        position: absolute;
        margin: auto;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
        width: 40rem;
        height: 40rem;
        background: linear-gradient(#f2effa, #f2effa),
          linear-gradient(270deg, #6040fc 15%, #e750e6 100%);
        background-clip: padding-box, border-box;
        border: 6rem solid transparent;
        border-top-color: #eadffa;
        border-left-color: #eadffa;
        border-right-color: #eadffa;
        border-radius: 50%;
        animation: spinner 0.8s linear infinite;
      }
      @keyframes spinner {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    }
  }

  &.lock .element-content {
    cursor: default;
  }
  &.format-painter .element-content {
    cursor: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzQiIGhlaWdodD0iMTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTIuNzUgMTMuNzY0VjEuNDIxYS4zLjMgMCAwMS40NDgtLjI2bDEwLjkxIDYuMTk3YS4zLjMgMCAwMS0uMTE2LjU1OWwtNC4xOTYuNDQyIDIuNTgyIDQuNDcyYS4zLjMgMCAwMS0uMTEuNDFsLTMuMTg0IDEuODM4YS4zLjMgMCAwMS0uNDEtLjExbC0yLjU4MS00LjQ3Mi0yLjgxIDMuNDU2YS4zLjMgMCAwMS0uNTMzLS4xODl6IiBmaWxsPSIjZmZmIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48cGF0aCBkPSJNMjYgMTQuNWw0LjUtNC41LTYtNmMtMiAyLTMgMi01LjUgMi41LjQgMy4yIDQuODMzIDYuNjY3IDcgOHptNC41ODgtNC40OTRhLjMuMyAwIDAwLjQyNCAwbC42OC0uNjhhMS41IDEuNSAwIDAwMC0yLjEyMUwzMC4zNCA1Ljg1MmwyLjAyNi0xLjU4MmExLjYyOSAxLjYyOSAwIDEwLTIuMjgtMi4yOTZsLTEuNjAzIDIuMDIxLTEuMzU3LTEuMzU2YTEuNSAxLjUgMCAwMC0yLjEyIDBsLS42ODEuNjhhLjMuMyAwIDAwMCAuNDI0bDYuMjYzIDYuMjYzeiIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik0yNC41NDMgMy45NjFzLTEuMDMgMS4yMDItMi40OTQgMS44OTFjLTEuMDA2LjQ3NC0yLjE4MS41ODUtMi43MzQuNjI3LS4yLjAxNC0uMzQ0LjIwOS0uMjc3LjM5OC4yOTMuODIgMS4xMTIgMi44MDEgMi42NTggNC4zNDcgMi4xMjYgMi4xMjYgMy42NTkgMi45NjggNC4xNDIgMy4yMDIuMS4wNDguMjE1LjAzLjI5OS0uMDQxLjM4NS0uMzI2IDEuNS0xLjI3NyAyLjIxLTEuOTg2Ljg5MS0uODkgMi4xODYtMi40NDggMi4xODYtMi40NDhtLjQ4LjA1NWEuMy4zIDAgMDEtLjQyNSAwbC02LjI2My02LjI2M2EuMy4zIDAgMDEwLS40MjRsLjY4LS42OGExLjUgMS41IDAgMDEyLjEyMiAwbDEuMzU2IDEuMzU2IDEuNjA0LTIuMDIxYTEuNjI5IDEuNjI5IDAgMTEyLjI3OSAyLjI5NkwzMC4zNCA1Ljg1MmwxLjM1MyAxLjM1M2ExLjUgMS41IDAgMDEwIDIuMTIxbC0uNjguNjh6IiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=)
        2 5,
      default !important;
  }
}
.rotate-wrapper {
  width: 100%;
  height: 100%;
}
.element-content {
  width: 100%;
  height: 100%;
  position: relative;
  cursor: move;

  svg {
    transform-origin: 0 0;
    overflow: visible;
  }

  .shape-path {
    pointer-events: all;
  }
}
.shape-text {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  padding: 5px 10px;
  line-height: 1.2;
  word-break: break-word;
  pointer-events: none;

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
</style>
