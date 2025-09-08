<template>
  <div
    class="mobile-player"
    :style="{
      width: playerBoxSize.width + 'px',
      height: playerBoxSize.height + 'px',
      transform: `rotate(90deg) translateY(-${playerBoxSize.height}px)`,
    }"
  >
    <div
      class="screen-slide-list"
      :style="{ width: isBasePlayer ? '100%' : 'calc(100% - 240rem)' }"
      @dblclick="($event) => handleNextPage($event)"
      @click="toolVisible = !toolVisible"
      @touchstart="($event) => touchStartListener($event)"
      @touchend="($event) => touchEndListener($event)"
    >
      <div
        :class="[
          'slide-item',
          `turning-mode-${slide.turningMode || 'slideY'}`,
          {
            current: index === slideIndex,
            before: index < slideIndex,
            after: index > slideIndex,
            hide:
              (index === slideIndex - 1 || index === slideIndex + 1) &&
              slide.turningMode !== currentSlide.turningMode,
          },
        ]"
        v-for="(slide, index) in slides"
        :key="slide.id"
      >
        <div
          class="slide-content"
          :style="{
            width: slideSize.width + 'px',
            height: slideSize.height + 'px',
            borderRadius: isBasePlayer ? 0 : '10rem',
            overflow: 'hidden',
          }"
          v-if="Math.abs(slideIndex - index) < 2"
        >
          <ThumbnailSlide :slide="slide" :size="slideSize.width" />
        </div>
      </div>
    </div>
    <div v-if="!isBasePlayer" class="remark-player">
      <div class="remark-box">
        <div class="header-remark">演讲备注</div>
        <div class="remark-player-content" v-html="currentSlidepxark"></div>
      </div>
    </div>

    <template v-if="toolVisible">
      <div class="header">
        <div class="taggle">
          <span @click="handleToggleModle">
            <template v-if="isBasePlayer">
              <i
                class="iconfont icon-yanjiangzhemoshi"
                style="margin-right: 5rem"
              ></i>
              <span> 切换演讲模式</span>
            </template>
            <template v-else>
              <i
                class="iconfont icon-putongshitumoshi"
                style="margin-right: 5rem"
              ></i>
              <span>切换普通模式</span>
            </template>
          </span>
          <span>时间：{{ ti }} </span>
        </div>
        <div class="back" @click="changeMode('preview')">
          <IconLogout /> 退出播放
        </div>
      </div>
      <MobileThumbnails
        class="thumbnails"
        :style="{ width: isBasePlayer ? '100%' : 'calc(100% - 220rem)' }"
      />
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, onBeforeUnmount, nextTick, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore } from '@/store'
import type { Mode } from '@/types/mobile'
import { parseText2Paragraphs } from '@/utils/textParser'
import ThumbnailSlide from '@/views/components/ThumbnailSlide/index.vue'
import MobileThumbnails from './MobileThumbnails.vue'
import { returnRem } from '@/utils/common'

defineProps<{
  changeMode: (mode: Mode) => void
}>()

const seconds = ref(0)
const hour = ref(0)
const minutes = ref(0)
const ti = ref('00:00:00')
const startTimer = () => {
  seconds.value += 1
  if (seconds.value >= 60) {
    seconds.value = 0
    minutes.value = minutes.value + 1
  }
  if (minutes.value >= 60) {
    minutes.value = 0
    hour.value = hour.value + 1
  }
  ti.value =
    (hour.value < 10 ? '0' + hour.value : hour.value) +
    ':' +
    (minutes.value < 10 ? '0' + minutes.value : minutes.value) +
    ':' +
    (seconds.value < 10 ? '0' + seconds.value : seconds.value)
}

const slidesStore = useSlidesStore()
const { slides, slideIndex, currentSlide, viewportRatio } =
  storeToRefs(slidesStore)
const toolVisible = ref(false)
const playerSize = ref({ width: 0, height: 0 })
const playerBoxSize = ref({ width: 0, height: 0 })
const isBasePlayer = ref(true)
const currentSlidepxark = computed(() => {
  return parseText2Paragraphs(currentSlide.value.remark || '暂无备注')
})

const handleToggleModle = () => {
  isBasePlayer.value = !isBasePlayer.value
  slidesStore.updateSlideIndex(0)
  if (isBasePlayer.value) {
    playerSize.value = {
      width: document.body.clientHeight,
      height: document.body.clientWidth,
    }
  } else {
    const remarkWidth = 240 * returnRem()
    playerSize.value = {
      width: document.body.clientHeight - remarkWidth,
      height: document.body.clientWidth,
    }
  }
}
const startTimerb = ref(null)
onMounted(() => {
  startTimerb.value = setInterval(startTimer, 1000)
  if (slideIndex.value !== 0) slidesStore.updateSlideIndex(0)

  playerSize.value = {
    width: document.body.clientHeight,
    height: document.body.clientWidth,
  }

  playerBoxSize.value = {
    width: document.body.clientHeight,
    height: document.body.clientWidth,
  }
})

onBeforeUnmount(() => {
  clearInterval(startTimerb.value)
  startTimerb.value = null
})

const slideSize = computed(() => {
  const playerRatio = playerSize.value.height / playerSize.value.width

  let slideWidth = 0
  let slideHeight = 0

  if (playerRatio >= viewportRatio.value) {
    slideWidth = playerSize.value.width
    slideHeight = slideWidth * viewportRatio.value
  } else {
    slideHeight = playerSize.value.height
    slideWidth = slideHeight / viewportRatio.value
  }

  return {
    width: slideWidth,
    height: slideHeight,
  }
})

const handleNextPage = (event: any) => {
  const target = event.target

  let isLink = false
  if (
    target.closest('.link') ||
    target.closest('.video-player') ||
    target.closest('.i-icon-play-one') ||
    target.closest('.i-icon-volume-small') ||
    target.closest('.base-element-audio')
  ) {
    isLink = true
  }

  if (toolVisible.value || isLink) return
  if (slideIndex.value < slides.value.length - 1) {
    slidesStore.updateSlideIndex(slideIndex.value + 1)
  }
}

const touchInfo = ref<{ x: number; y: number } | null>(null)

const touchData = ref({
  startX: 0,
  startY: 0,
  endX: 0,
  endY: 0,
})
const touchStartListener = (e: TouchEvent) => {
  const touch = e.touches[0]
  touchData.value.startX = touch.clientX
  touchData.value.startY = touch.clientY
}
const touchEndListener = (e: TouchEvent) => {
  const touch = e.changedTouches[0]
  touchData.value.endX = touch.clientX
  touchData.value.endY = touch.clientY

  handleSwipe()
}

const handleSwipe = () => {
  const deltaX = touchData.value.endX - touchData.value.startX
  const deltaY = touchData.value.endY - touchData.value.startY

  // 判断滑动方向
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    // 水平滑动
    if (deltaX > 0) {
      // 执行向右滑动的操作
      if (slideIndex.value < slides.value.length - 1) {
        slidesStore.updateSlideIndex(slideIndex.value + 1)
      }
    } else {
      // 执行向左滑动的操作
      if (slideIndex.value > 0) {
        slidesStore.updateSlideIndex(slideIndex.value - 1)
      }
    }
  } else {
    // 垂直滑动
    if (deltaY > 0) {
      // 上一页
      if (slideIndex.value > 0) {
        slidesStore.updateSlideIndex(slideIndex.value - 1)
      }
    } else {
      // 下一页
      if (slideIndex.value < slides.value.length - 1) {
        slidesStore.updateSlideIndex(slideIndex.value + 1)
      }
    }
  }
}

watch(slideIndex, () => {
  if (toolVisible.value) {
    nextTick(() => {
      const element = document.getElementById(
        `slide-bar-${currentSlide.value.id}`
      )
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    })
  }
})
</script>

<style lang="scss" scoped>
.mobile-player {
  transform-origin: 0 0;
  background-color: #1d1d1d;
  position: relative;
  display: flex;
}

.remark-player {
  width: 240rem;
  padding: 0rem 20rem;
  font-size: 14rem;
  color: #ffffff85;
  line-height: 1.2;
  word-break: break-all;
  .header-remark {
    font-size: 18rem;
    margin-bottom: 10rem;
    color: #fff;
  }

  .remark-box {
    padding: 30rem 10rem 10rem;
    height: 100%;
    border-left: 1rem solid #ffffff63;
  }
}
.screen-slide-list {
  position: relative;
  width: 100%;
  height: 100%;
}
.slide-item {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  &.current {
    z-index: 2;
  }

  &.hide {
    opacity: 0;
  }

  &.turning-mode-no {
    &.before {
      transform: translateY(-100%);
    }
    &.after {
      transform: translateY(100%);
    }
  }
  &.turning-mode-fade {
    transition: opacity 0.75s;
    &.before {
      pointer-events: none;
      opacity: 0;
    }
    &.after {
      pointer-events: none;
      opacity: 0;
    }
  }
  &.turning-mode-slideX {
    transition: transform 0.35s;
    &.before {
      transform: translateX(-100%);
    }
    &.after {
      transform: translateX(100%);
    }
  }
  &.turning-mode-slideY {
    transition: transform 0.35s;
    &.before {
      transform: translateY(-100%);
    }
    &.after {
      transform: translateY(100%);
    }
  }
}
.slide-content {
  background-color: #fff;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  justify-content: center;
  align-items: center;
}

.header {
  width: 100%;
  height: 40px;
  line-height: 40px;
  padding: 0 15px;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 99;
  background-color: rgba($color: #1d1d1d, $alpha: 0.7);
  text-align: right;
  font-size: 14rem;
  color: #fff;
  animation: slideInDown 0.15s;

  display: flex;
  justify-content: space-between;
  .taggle {
    display: flex;
    align-items: center;
    span {
      margin-right: 40rem;
      display: flex;
      align-items: center;
    }
  }
  .back {
    height: 100%;
  }
}
.thumbnails {
  width: 100%;
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: 99;
  background-color: rgba($color: #1d1d1d, $alpha: 0.7);
  overflow: auto !important;
  animation: slideInUp 0.15s;
}

@keyframes slideInUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
@keyframes slideInDown {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>
