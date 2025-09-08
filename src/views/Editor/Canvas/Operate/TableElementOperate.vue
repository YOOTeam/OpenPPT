<template>
  <div class="table-element-operate">
    <BorderLine
      class="operate-border-line"
      v-for="line in borderLines"
      :key="line.type"
      :type="line.type"
      :style="line.style"
      @mousedown.stop
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
      <ToobarOperate
        v-show="!showLoadingMarks && !drageElement"
        :style="{
          top: tooberTop,
          left: scaleWidth / 2 - 70 + 'px',
          transform: `rotate(${-rotate}deg)`,
        }"
        :elementType="'table'"
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
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import type { PPTTableElement } from '@/types/slides'
import type { OperateResizeHandlers } from '@/types/edit'
import useCommonOperate from '../hooks/useCommonOperate'
import ToobarOperate from './ToobarOperate.vue'
import RotateHandler from './RotateHandler.vue'
import ResizeHandler from './ResizeHandler.vue'
import BorderLine from './BorderLine.vue'

const props = defineProps<{
  elementInfo: PPTTableElement
  handlerVisible: boolean
  rotateElement: (e: MouseEvent, element: PPTTableElement) => void
  scaleElement: (
    e: MouseEvent,
    element: PPTTableElement,
    command: OperateResizeHandlers
  ) => void
}>()

const { canvasScale, showLoadingMarks, drageElement } = storeToRefs(
  useMainStore()
)

const outlineWidth = computed(() => props.elementInfo.outline.width || 1)

const scaleWidth = computed(
  () => (props.elementInfo.width + outlineWidth.value) * canvasScale.value
)
const scaleHeight = computed(() => props.elementInfo.height * canvasScale.value)

const rotate = computed(() =>
  'rotate' in props.elementInfo ? props.elementInfo.rotate : 0
)
const { resizeHandlers, borderLines } = useCommonOperate(
  scaleWidth,
  scaleHeight
)

const tooberTop = computed(() => {
  let top = ''
  if (props.elementInfo.top < 0) {
    const height = borderLines.value.find((item) => item.type === 'left')
    if (height?.style?.height) {
      top = parseInt(height.style.height) + 4 + 'px'
    }
  } else {
    top = '-60px'
  }
  return top
})
</script>
