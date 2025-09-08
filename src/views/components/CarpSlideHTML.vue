<template>
  <div
    class="carp_html"
    :style="{ zIndex: showCarpSlide?.markNum ? showCarpSlide?.markNum : -1 }"
  >
    <div class="thumbnails-view">
      <div class="thumbnails" ref="imageThumbnailsRef">
        <!-- <template v-if="showCarpSlide.isAllSlide"> -->
        <ThumbnailSlide
          class="save-thumbnail"
          v-for="item in slides"
          :key="item.id"
          :slide="item"
          :size="_isPC ? 1600 : 400"
          :id="`save-${item.id}`"
        />
        <!-- </template> -->
        <!-- <template v-else>
          <template v-if="showCarpSlide.showPageNum">
            <ThumbnailSlide
              class="save-thumbnail"
              v-for="item in [slides[showCarpSlide.index]]"
              :key="item.id"
              :slide="item"
              :size="_isPC ? 900 : 400"
              :id="`save-${item.id}`"
            />
          </template>
          <template v-else-if="showCarpSlide.slideData">
            <ThumbnailSlide
              class="save-thumbnail"
              :slide="showCarpSlide.slideData"
              :size="_isPC ? 900 : 400"
              :id="`save-${showCarpSlide.slideData.id}`"
            />
          </template>
          <template v-else>
            <ThumbnailSlide
              class="save-thumbnail"
              :slide="currentSlide"
              :size="_isPC ? 900 : 400"
              :id="`save-${currentSlide.id}`"
            />
          </template>
        </template> -->
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { onMounted, ref, nextTick, onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import ThumbnailSlide from '@/views/components/ThumbnailSlide/index.vue'
import { isPC } from '@/utils/common'
const _isPC = isPC()
const slidesStore = useSlidesStore()
const mainStore = useMainStore()
const { showCarpSlide } = storeToRefs(mainStore)
const { slides, currentSlide } = storeToRefs(slidesStore)
</script>
<style lang="scss" scope>
.carp_html {
  opacity: 0;
  position: fixed;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  z-index: -1;
}
.thumbnails-view {
  @include absolute-0();
  opacity: 0;

  &::after {
    @include absolute-0();
  }
}
</style>
