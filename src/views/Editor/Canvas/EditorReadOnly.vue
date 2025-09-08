<template>
  <div
    class="canvas"
    ref="canvasRef"
    @wheel="($event) => handleMousewheelCanvas($event)"
  >
    <div
      class="viewport-wrapper"
      :style="{
        width: viewportStyles.width * canvasScale + 'px',
        height: viewportStyles.height * canvasScale + 'px',
        left: viewportStyles.left + 'px',
        top: viewportStyles.top + 'px',
      }"
    >
      <div class="operates">
        <ViewportBackground />
      </div>
      <div
        class="viewport"
        ref="viewportRef"
        :style="{ transform: `scale(${canvasScale})` }"
      >
        <ThumbnailElement
          v-for="(element, index) in elementList"
          :key="element.id"
          :elementInfo="element"
          :elementIndex="index + 1"
          v-show="!hiddenElementIdList.includes(element.id)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  nextTick,
  onMounted,
  onUnmounted,
  provide,
  ref,
  watch,
  watchEffect,
} from 'vue'
import { throttle } from 'lodash'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore, useKeyboardStore } from '@/store'
import type { PPTElement } from '@/types/slides'
import { injectKeySlideScale } from '@/types/injectKey'
import { KEYS } from '@/configs/hotkey'
import useSlideHandler from '@/hooks/useSlideHandler'
import useViewportSize from './hooks/useViewportSize'
import useDropImageOrText from './hooks/useDropImageOrText'
import useScaleCanvas from '@/hooks/useScaleCanvas'
import ThumbnailElement from '@/views/components/ThumbnailSlide/ThumbnailElement.vue'
import ViewportBackground from './ViewportBackground.vue'
const { updateSlideIndex } = useSlideHandler()
const mainStore = useMainStore()
const {
  activeElementIdList,
  handleElementId,
  hiddenElementIdList,
  canvasScale,
  textFormatPainter,
  toolbarData,
} = storeToRefs(mainStore)

const { currentSlide } = storeToRefs(useSlidesStore())
const { ctrlKeyState } = storeToRefs(useKeyboardStore())

const viewportRef = ref<HTMLElement>()

watch(activeElementIdList, () => {
  if (
    activeElementIdList.value.length === 0 &&
    toolbarData.value.useact === 'update'
  ) {
    mainStore.setShowToolbar(false)
    mainStore.setOpenNoTokenToobal(false)
  }
})
watch(handleElementId, () => {
  mainStore.setActiveGroupElementId('')
})

const elementList = ref<PPTElement[]>([])
const setLocalElementList = () => {
  elementList.value = currentSlide.value
    ? JSON.parse(JSON.stringify(currentSlide.value.elements))
    : []
}
watchEffect(setLocalElementList)

const canvasRef = ref<HTMLElement>()
const { viewportStyles } = useViewportSize(canvasRef)

useDropImageOrText(canvasRef)

// 组件渲染时，如果存在元素焦点，需要清除
// 这种情况存在于：有焦点元素的情况下进入了放映模式，再退出时，需要清除原先的焦点（因为可能已经切换了页面）
onMounted(() => {
  if (activeElementIdList.value.length) {
    nextTick(() => mainStore.setActiveElementIdList([]))
  }
})

// 画布注销时清空格式刷状态
onUnmounted(() => {
  if (textFormatPainter.value) mainStore.setTextFormatPainter(null)
})

// 滚动鼠标
const { scaleCanvas } = useScaleCanvas()
const throttleScaleCanvas = throttle(scaleCanvas, 100, {
  leading: true,
  trailing: false,
})
const throttleUpdateSlideIndex = throttle(updateSlideIndex, 300, {
  leading: true,
  trailing: false,
})

const isScrollAtBottom = () => {
  // 当前窗口的高度
  const clientHeight = canvasRef.value.clientHeight
  // 文档的总高度
  const documentHeight = canvasRef.value.scrollHeight
  // 当前滚动的位置
  const scrollPosition = canvasRef.value.scrollTop

  // 如果滚动位置加上窗口高度等于文档高度，说明已经滚动到底部
  return clientHeight + scrollPosition >= documentHeight
}

const handleMousewheelCanvas = (e: WheelEvent) => {
  // 按住Ctrl键时：缩放画布
  if (ctrlKeyState.value) {
    if (e.deltaY > 0) throttleScaleCanvas('-')
    else if (e.deltaY < 0) throttleScaleCanvas('+')
  }
  // 上下翻页
  else {
    if (canvasRef.value.clientHeight < canvasRef.value.scrollHeight) {
      if (isScrollAtBottom() && canvasRef.value.scrollTop) {
        if (e.deltaY > 0) throttleUpdateSlideIndex(KEYS.DOWN)
      } else if (!isScrollAtBottom() && canvasRef.value.scrollTop === 0) {
        if (e.deltaY < 0) throttleUpdateSlideIndex(KEYS.UP)
      }
    } else {
      if (e.deltaY > 0) throttleUpdateSlideIndex(KEYS.DOWN)
      else if (e.deltaY < 0) throttleUpdateSlideIndex(KEYS.UP)
    }
  }
}

provide(injectKeySlideScale, canvasScale)
</script>

<style lang="scss" scoped>
.canvas {
  height: 100%;
  user-select: none;
  overflow: hidden;
  position: relative;
}
.drag-mask {
  cursor: grab;
  @include absolute-0();
}
.viewport-wrapper {
  position: absolute;
  border-radius: 10px;
  box-shadow: 0 0 15px 0 rgba(0, 0, 0, 0.1);
}
.viewport {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
}

.thumbnail {
  border-radius: 14rem;
}

.allViewThumbnail {
  position: relative;
  overflow: visible;
  ::v-deep(.elements) {
    overflow: hidden;
    border-radius: 15rem;
  }
}

.aciton-paction {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 10rem;
  background: rgba(0, 0, 0, 0.8);
  z-index: 999999;
  display: flex;
  justify-content: center;
  align-items: center;
  img {
    height: 100%;
  }
}
.allViewPageTips {
  position: absolute;
  text-align: center;
  top: -30rem;
  left: 50%;
  transform: translateX(-50%);
}
.allViewBtn {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.allViewStop {
  color: #cca90a;
  font-size: 16rem;
  padding: 20rem;
  cursor: pointer;
  text-decoration: underline;
  &:hover {
    color: #7d690d;
  }
  &:active {
    color: #cca90a;
  }
}
.allViewTips,
.allViewPageTips {
  color: #fff;
  font-size: 14rem;
}
.singleTips {
  &::after {
    content: '正在进行AI排版与实时预览...';
    color: #fff;
    position: absolute;
    bottom: -50rem;
    left: 50%;
    transform: translateX(-50%);
    border-radius: 10rem;
    padding: 0rem 15rem;
    height: 40rem;
    line-height: 40rem;
    font-size: 14rem;
  }
}
</style>
