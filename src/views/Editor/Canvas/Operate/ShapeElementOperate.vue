<template>
  <div class="shape-element-operate">
    <BorderLine
      class="operate-border-line"
      v-for="line in borderLines"
      :key="line.type"
      :type="line.type"
      :style="line.style"
      @mousedown.stop="clearSelect()"
    />
    <template v-if="handlerVisible">
      <template v-for="point in resizeHandlers" :key="point.direction">
        <template
          v-if="
            ((point.direction === 'left' || point.direction === 'right') &&
              scaleHeight > 34) ||
            point.direction === 'left-top' ||
            point.direction === 'right-top' ||
            point.direction === 'left-bottom' ||
            point.direction === 'right-bottom' ||
            ((point.direction === 'top' || point.direction === 'bottom') &&
              scaleWidth > 34)
          "
        >
          <ResizeHandler
            class="operate-resize-handler"
            :type="point.direction"
            :rotate="elementInfo.rotate"
            :style="point.style"
            @mousedown.stop="
              ($event) => scaleElement($event, elementInfo, point.direction)
            "
          />
        </template>
      </template>
      <RotateHandler
        class="operate-rotate-handler"
        :style="{
          left: scaleWidth / 2 + 'px',
          bottom: `-${scaleHeight + 40}px`,
        }"
        @mousedown.stop="($event) => rotateElement($event, elementInfo)"
      />
      <div
        class="operate-keypoint-handler"
        v-for="(keypoint, index) in keypoints"
        :key="index"
        :style="keypoint.styles"
        @mousedown.stop="
          ($event) => moveShapeKeypoint($event, elementInfo, index)
        "
      ></div>
      <ToobarOperate
        v-show="!showLoadingMarks && !drageElement"
        :style="{
          top: tooberTop,
          left: scaleWidth / 2 - 70 + 'px',
          transform: `rotate(${-rotate}deg)`,
        }"
        :elementType="'shape'"
      />
    </template>
  </div>
</template>

<script lang="ts">
export default {
  inheritAttrs: false,
}
</script>

<script lang="ts" setup>
import { computed, type CSSProperties } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import type { PPTShapeElement } from '@/types/slides'
import type { OperateResizeHandlers } from '@/types/edit'
import { SHAPE_PATH_FORMULAS } from '@/configs/shapes'
import useCommonOperate from '../hooks/useCommonOperate'
import ToobarOperate from './ToobarOperate.vue'
import RotateHandler from './RotateHandler.vue'
import ResizeHandler from './ResizeHandler.vue'
import BorderLine from './BorderLine.vue'

const props = defineProps<{
  elementInfo: PPTShapeElement
  handlerVisible: boolean
  rotateElement: (e: MouseEvent, element: PPTShapeElement) => void
  scaleElement: (
    e: MouseEvent,
    element: PPTShapeElement,
    command: OperateResizeHandlers
  ) => void
  moveShapeKeypoint: (
    e: MouseEvent,
    element: PPTShapeElement,
    index: number
  ) => void
}>()

const { canvasScale, showLoadingMarks, drageElement } = storeToRefs(
  useMainStore()
)

const scaleWidth = computed(() => props.elementInfo.width * canvasScale.value)
const scaleHeight = computed(() => props.elementInfo.height * canvasScale.value)
const { resizeHandlers, borderLines } = useCommonOperate(
  scaleWidth,
  scaleHeight
)

const tooberTop = computed(() => {
  let top = ''
  if (props.elementInfo.top < 0) {
    const bottom = resizeHandlers.value.find(
      (item) => item.direction === 'bottom'
    )
    if (bottom) {
      top = parseInt(bottom.style.top) + 4 + 'px'
    }
  } else {
    top = '-60px'
  }
  return top
})
const rotate = computed(() =>
  'rotate' in props.elementInfo ? props.elementInfo.rotate : 0
)
const clearSelect = () => {
  const selection = window.getSelection()
  selection.removeAllRanges()
}
const keypoints = computed(() => {
  if (
    !props.elementInfo.pathFormula ||
    props.elementInfo.keypoints === undefined
  ) {
    return []
  }
  const pathFormula = SHAPE_PATH_FORMULAS[props.elementInfo.pathFormula]

  return props.elementInfo.keypoints.map((keypoint, index) => {
    const getBaseSize = pathFormula.getBaseSize![index]
    const relative = pathFormula.relative![index]
    const keypointPos =
      getBaseSize(props.elementInfo.width, props.elementInfo.height) * keypoint

    let styles: CSSProperties = {}
    if (relative === 'left') {
      styles = { left: keypointPos * canvasScale.value + 'px' }
    } else if (relative === 'right') {
      styles = {
        left:
          (props.elementInfo.width - keypointPos) * canvasScale.value + 'px',
      }
    } else if (relative === 'center') {
      styles = {
        left:
          ((props.elementInfo.width - keypointPos) / 2) * canvasScale.value +
          'px',
      }
    } else if (relative === 'top') {
      styles = { top: keypointPos * canvasScale.value + 'px' }
    } else if (relative === 'bottom') {
      styles = {
        top:
          (props.elementInfo.height - keypointPos) * canvasScale.value + 'px',
      }
    } else if (relative === 'left_bottom') {
      styles = {
        left: keypointPos * canvasScale.value + 'px',
        top: props.elementInfo.height * canvasScale.value + 'px',
      }
    } else if (relative === 'right_bottom') {
      styles = {
        left:
          (props.elementInfo.width - keypointPos) * canvasScale.value + 'px',
        top: props.elementInfo.height * canvasScale.value + 'px',
      }
    } else if (relative === 'top_right') {
      styles = {
        left: props.elementInfo.width * canvasScale.value + 'px',
        top: keypointPos * canvasScale.value + 'px',
      }
    } else if (relative === 'bottom_right') {
      styles = {
        left: props.elementInfo.width * canvasScale.value + 'px',
        top:
          (props.elementInfo.height - keypointPos) * canvasScale.value + 'px',
      }
    }

    return {
      keypoint,
      styles,
    }
  })
})
</script>

<style lang="scss" scoped>
.operate-keypoint-handler {
  position: absolute;
  width: 10px;
  height: 10px;
  left: 0;
  top: 0;
  margin: -5px 0 0 -5px;
  border: 1px solid $themeColor;
  background-color: #ffe873;
  border-radius: 1px;
}
</style>
