<template>
  <div
    class="mobile-operate"
    :style="{
      top: elementInfo.top * canvasScale + 'px',
      left: elementInfo.left * canvasScale + 'px',
      transform: `rotate(${rotate}deg)`,
      transformOrigin: `${(elementInfo.width * canvasScale) / 2}px ${
        (elementInfo.height * canvasScale) / 2
      }px`,
    }"
  >
    <template v-if="isSelected">
      <BorderLine
        class="operate-border-line"
        v-for="line in borderLines"
        :key="line.type"
        :type="line.type"
        :style="line.style"
        @mousedown.stop
      />
      <ResizeHandler
        class="operate-resize-handler"
        v-for="point in resizeHandlers"
        :key="point.direction"
        :type="point.direction"
        :rotate="elementInfo.rotate"
        :style="point.style"
        @touchstart.stop="
          ($event) => scaleElement($event, elementInfo, point.direction)
        "
      />
      <!-- <RotateHandler
        class="operate-rotate-handler"
        :style="{
          left: scaleWidth / 2 + 'px',
          bottom: `-${elementInfo.height+5}px`,
        }"
        v-if="!cannotRotate"
        @touchstart.stop="$event => rotateElement($event, elementInfo as CanRotatePPTElement)"
      /> -->

      <div class="isOperate-btn" :style="{ left: -8 + 'px' }">
        <!-- <div
          class="menu-item"
          v-if="elementInfo.type === 'text'"
          @touchstart.stop="
            ($event) => opcationElement($event, elementInfo, 'editor')
          "
        >
          <IconEdit class="icon" />
        </div> -->
        <div class="menu-item" @touchstart.stop="copyElement()">
          <IconCopy class="icon" />
        </div>

        <div
          class="menu-item"
          @touchstart.stop="
            ($event) => opcationElement($event, elementInfo, 'link')
          "
        >
          <IconLinkOne class="icon" />
        </div>
        <div
          class="menu-item"
          @touchstart.stop="
            ($event) => opcationElement($event, elementInfo, 'style')
          "
        >
          <IconTextStyleOne class="icon" v-if="elementInfo.type === 'text'" />
          <IconSettingConfig class="icon" v-else />
        </div>
        <div class="menu-item" @touchstart.stop="deleteElement()">
          <IconDelete class="icon" />
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import type {
  PPTElement,
  PPTLineElement,
  PPTChartElement,
  PPTVideoElement,
  PPTAudioElement,
} from '@/types/slides'
import useCommonOperate from '@/views/Editor/Canvas/hooks/useCommonOperate'
import type { OperateResizeHandlers } from '@/types/edit'

import BorderLine from '@/views/Editor/Canvas/Operate/BorderLine.vue'
import ResizeHandler from '@/views/Editor/Canvas/Operate/ResizeHandler.vue'
import RotateHandler from '@/views/Editor/Canvas/Operate/RotateHandler.vue'

import useDeleteElement from '@/hooks/useDeleteElement'
import useAddSlidesOrElements from '@/hooks/useAddSlidesOrElements'
type CanRotatePPTElement = Exclude<
  PPTElement,
  PPTChartElement | PPTLineElement | PPTVideoElement | PPTAudioElement
>

const mainStore = useMainStore()
const { handleElement } = storeToRefs(mainStore)

const props = defineProps<{
  elementInfo: Exclude<PPTElement, PPTLineElement>
  isSelected: boolean
  canvasScale: number
  scaleElement: (
    e: MouseEvent,
    element: Exclude<PPTElement, PPTLineElement>,
    command: OperateResizeHandlers
  ) => void
  rotateElement: (e: MouseEvent, element: CanRotatePPTElement) => void
  opcationElement: (
    e: MouseEvent,
    element: Exclude<PPTElement, PPTLineElement>,
    type: string
  ) => void
}>()

const rotate = computed(() =>
  'rotate' in props.elementInfo ? props.elementInfo.rotate : 0
)

const { addElementsFromData } = useAddSlidesOrElements()
const { deleteElement } = useDeleteElement()

const copyElement = () => {
  const element: PPTElement = JSON.parse(JSON.stringify(handleElement.value))
  addElementsFromData([element])
}

const scaleWidth = computed(() => props.elementInfo.width * props.canvasScale)
const scaleHeight = computed(() => props.elementInfo.height * props.canvasScale)
const {
  borderLines,
  resizeHandlers: _resizeHandlers,
  textElementResizeHandlers,
} = useCommonOperate(scaleWidth, scaleHeight)

const resizeHandlers =
  props.elementInfo.type === 'text' || props.elementInfo.type === 'table'
    ? textElementResizeHandlers
    : _resizeHandlers

const cannotRotate = computed(() =>
  ['chart', 'video', 'audio'].includes(props.elementInfo.type)
)
</script>

<style lang="scss" scoped>
.mobile-operate {
  position: absolute;
  z-index: 100;
  user-select: none;
}

.isOperate-btn {
  position: absolute;
  display: flex;
  border-radius: 10rem;
  padding: 2rem;
  background: #fff;
  box-shadow: 0 0 15rem 0 rgba(0, 0, 0, 0.1);
  top: -46rem;
  span {
    min-width: 35rem;
    font-size: 20rem;
    cursor: pointer;
    text-align: center;
    padding: 8rem 0;
  }
}
</style>
