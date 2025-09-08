<template>
  <div
    class="thumbnail-slide"
    :style="{
      width: size + 'px',
      height: size * viewportRatio + 'px',
    }"
  >
    <slot name="top"> </slot>
    <div
      class="elements"
      :style="{
        width: viewportSize + 'px',
        height: viewportSize * viewportRatio + 'px',
        transform: `scale(${scale})`,
      }"
      v-if="visible"
    >
      <div class="background" :style="backgroundStyle"></div>
      <ThumbnailElement
        v-for="(element, index) in slide.elements"
        :key="element.id"
        :elementInfo="element"
        :elementIndex="index + 1"
        v-show="!hiddenElementIdList.includes(element.id)"
      />
    </div>
    <div class="placeholder" v-else>AI渲染排版中...</div>
    <CreateLoading
      v-if="createLoading?.showLoading && slide?.id === currentSlide?.id"
      :style="{
        width: viewportSize + 'px',
        height: viewportSize * viewportRatio + 'px',
        transform: `scale(${scale})`,
        transformOrigin: '0 0',
      }"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, provide } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore, useMainStore } from '@/store'
import type { Slide } from '@/types/slides'
import { injectKeySlideScale } from '@/types/injectKey'
import useSlideBackgroundStyle from '@/hooks/useSlideBackgroundStyle'

import ThumbnailElement from './ThumbnailElement.vue'
import CreateLoading from '@/components/CreateLoading.vue'
const mainStore = useMainStore()
const slideStore = useSlidesStore()
const { slideIndex } = storeToRefs(slideStore)
const { hiddenElementIdList, createLoading } = storeToRefs(mainStore)

const props = withDefaults(
  defineProps<{
    slide: Slide
    size: number
    visible?: boolean
  }>(),
  {
    visible: true,
  }
)

const { viewportRatio, viewportSize, currentSlide } = storeToRefs(
  useSlidesStore()
)
const background = computed(() => props.slide.background)
const { backgroundStyle } = useSlideBackgroundStyle(background)

const scale = computed(() => props.size / viewportSize.value)
provide(injectKeySlideScale, scale)
</script>

<style lang="scss" scoped>
.thumbnail-slide {
  overflow: hidden;
  user-select: none;
}
.elements {
  transform-origin: 0 0;
}
.background {
  width: 100%;
  height: 100%;
  background-position: center;
  position: absolute;
}
.placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
