<template>
  <div class="base-view" :class="{ 'laser-pen': laserPen }">
    <ScreenSlideList
      :slideWidth="slideWidth"
      :slideHeight="slideHeight"
      :animationIndex="animationIndex"
      :turnSlideToId="turnSlideToId"
      :manualExitFullscreen="manualExitFullscreen"
      @wheel="($event) => mousewheelListener($event)"
      @touchstart="($event) => touchStartListener($event)"
      @touchend="($event) => touchEndListener($event)"
      @click="($event) => handleSlideNext($event)"
      v-contextmenu="contextmenus"
    />
    <div
      class="left-slide"
      :coff="coff"
      :class="{ visible: leftSlide }"
      @mouseleave="handleLeave('leave')"
      @mouseenter="handleLeave('enter')"
    >
      <template v-if="showSlideCatalog">
        <div
          class="thumbnails-box"
          ref="thumbnailsRef"
          @wheel.prevent="($event) => handleMousewheelThumbnails($event)"
        >
          <div
            class="thumbnail"
            :class="{ active: index === slideIndex }"
            v-for="(slide, index) in slides"
            :key="slide.id"
            @click="turnSlideToIndex(index)"
          >
            <icon-caret-right class="caret-right" />
            <ThumbnailSlide
              class="thumbnail-item"
              :slide="slide"
              :size="120"
              :visible="index < slidesLoadLimit"
              @click="handleClickThumbnail(slide)"
            />
            <div class="marsk"></div>
          </div>
        </div>
        <div class="slide-tools">
          {{ $t('catalog.titleTab2') }}
          {{ slideIndex + 1 < 10 ? `0${slideIndex + 1}` : slideIndex + 1 }} /
          {{ slides?.length < 10 ? `0${slides?.length}` : slides?.length }}
          {{ $t('catalog.page') }}
        </div>
      </template>
      <div class="slide-page" @click="showSlideCatalog = true" v-else>
        <div>
          {{ slideIndex + 1 > 9 ? slideIndex + 1 : '0' + (slideIndex + 1) }}
        </div>
        <span class="page-line"></span>
        <div>
          {{ slides?.length < 10 ? `0${slides?.length}` : slides?.length }}
        </div>
      </div>
    </div>

    <WritingBoardTool
      :slideWidth="slideWidth"
      :slideHeight="slideHeight"
      v-if="writingBoardToolVisible"
      @close="writingBoardToolVisible = false"
    />

    <CountdownTimer
      :timeData="timerSetData"
      v-if="timerlVisible"
      @close="timerlVisible = false"
    />

    <div
      class="tools-right"
      :class="{ visible: rightToolsVisible }"
      @mouseenter="rightToolsVisible = true"
      @mouseleave="rightToolsVisible = false"
    >
      <ToolBar
        class="content"
        :timerlVisible="timerlVisible"
        :laserPen="laserPen"
        :animation="animation"
        :fullscreen="fullscreenState"
        :interaction="interaction"
        @exitFullscreen="manualExitFullscreen"
        @setBar="handleSetBar"
      />
      <div
        class="tools-timeSeting"
        :style="{ opacity: rightToolsVisible && timerlVisible ? 1 : 0 }"
      >
        <TimeSetting
          @action="(data) => handleTimeSeting(data)"
          v-if="timerlVisible"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore, useMainStore } from '@/store'
import { IconCaretRight } from '@arco-design/web-vue/es/icon'
import useLoadSlides from '@/hooks/useLoadSlides'
import type { ContextmenuItem } from '@/components/Contextmenu/types'
import useScreening from '@/hooks/useScreening'
import useExecPlay from './hooks/useExecPlay'
import useSlideSize from './hooks/useSlideSize'
import useFullscreen from './hooks/useFullscreen'

import ToolBar from './ToolBar.vue'
import TimeSetting from './TimeSetting.vue'
import ScreenSlideList from './ScreenSlideList.vue'
import WritingBoardTool from './WritingBoardTool.vue'
import CountdownTimer from './CountdownTimer.vue'
import ThumbnailSlide from '@/views/components/ThumbnailSlide/index.vue'
import { userEdit } from '@/api/userInfo'
import $ from 'jquery'
import { useI18n } from 'vue-i18n'
const { fullscreenState, manualExitFullscreen } = useFullscreen()
const { t } = useI18n()
const props = defineProps<{
  changeViewMode: (mode: 'base' | 'presenter') => void
}>()
const mainStore = useMainStore()
const { actionAnimation, saveTimerData } = storeToRefs(mainStore)
const timerSetData = ref(null)
const showSlideCatalog = ref(false)

const slidesStore = useSlidesStore()
const { slides, slideIndex, currentSlide } = storeToRefs(slidesStore)
const { slidesLoadLimit } = useLoadSlides()
const {
  autoPlayTimer,
  autoPlay,
  closeAutoPlay,
  autoPlayInterval,
  setAutoPlayInterval,
  loopPlay,
  setLoopPlay,
  mousewheelListener,
  touchStartListener,
  touchEndListener,
  turnPrevSlide,
  turnNextSlide,
  turnSlideToIndex,
  turnSlideToId,
  actionAnimationActive,
  animationIndex,
  throttleMassage,
} = useExecPlay()
const { slideWidth, slideHeight } = useSlideSize()
const { exitScreening } = useScreening()

const leftSlide = ref(false)
const rightToolsVisible = ref(false)
const writingBoardToolVisible = ref(false)
const timerlVisible = ref(false)
const laserPen = ref(false)
const interaction = ref(
  currentSlide.value?.actionList?.interactionType === 'focusZoom'
)
const animation = ref(
  currentSlide.value?.actionList?.interactionType === 'clickZoom'
)
const thumbnailsRef = ref<HTMLElement>()

onMounted(() => {
  if (currentSlide.value?.actionList?.interactionType === 'focusZoom') {
    interaction.value = true
  }
})
watch(
  () => slides.value,
  (newVal, oldVal) => {
    if (JSON.stringify(newVal) !== JSON.stringify(oldVal) && newVal?.length) {
      showSlideCatalog.value = true
    }
  },
  {
    immediate: true,
    deep: true,
  }
)

watch(slideIndex, () => {
  nextTick(() => {
    if (!thumbnailsRef.value) return

    const activeThumbnailRef: HTMLElement | null =
      thumbnailsRef.value.querySelector('.thumbnail.active')
    if (!activeThumbnailRef) return

    const height = thumbnailsRef.value.offsetHeight
    const offsetTop = activeThumbnailRef.offsetTop
    thumbnailsRef.value.scrollTo({
      top: offsetTop - height / 2,
      behavior: 'smooth',
    })
  })
})
const handleMousewheelThumbnails = (e: WheelEvent) => {
  if (!thumbnailsRef.value) return
  thumbnailsRef.value.scrollBy(0, e.deltaY)
}
const coff = ref('')

const handleClickThumbnail = (slide: any) => {}
const contextmenus = (): ContextmenuItem[] => {
  return [
    {
      text: t('play.upPage'),
      subText: '↑ ←',
      disable: slideIndex.value <= 0,
      handler: () => turnPrevSlide(),
    },
    {
      text: t('play.downPage'),
      subText: '↓ →',
      disable: slideIndex.value >= slides.value.length - 1,
      handler: () => turnNextSlide(),
    },
    {
      text: t('play.firstPage'),
      subText: 'HOME',
      disable: slideIndex.value === 0,
      handler: () => turnSlideToIndex(0),
    },
    {
      text: t('play.lastPage'),
      subText: 'END',
      disable: slideIndex.value === slides.value.length - 1,
      handler: () => turnSlideToIndex(slides.value.length - 1),
    },
    { divider: true },
    {
      text: autoPlayTimer.value ? t('play.noAutoPlay') : t('play.autoPlay'),
      handler: autoPlayTimer.value ? closeAutoPlay : autoPlay,
      children: [
        {
          text: `2.5${t('play.s')}`,
          subText: autoPlayInterval.value === 2500 ? '√' : '',
          handler: () => setAutoPlayInterval(2500),
        },
        {
          text: `5${t('play.s')}`,
          subText: autoPlayInterval.value === 5000 ? '√' : '',
          handler: () => setAutoPlayInterval(5000),
        },
        {
          text: `7.5${t('play.s')}`,
          subText: autoPlayInterval.value === 7500 ? '√' : '',
          handler: () => setAutoPlayInterval(7500),
        },
        {
          text: `10${t('play.s')}`,
          subText: autoPlayInterval.value === 10000 ? '√' : '',
          handler: () => setAutoPlayInterval(10000),
        },
      ],
    },
    {
      text: t('play.loopPlay'),
      subText: loopPlay.value ? '√' : '',
      handler: () => setLoopPlay(!loopPlay.value),
    },
    { divider: true },
    {
      text: t('play.showBar'),
      handler: () => (rightToolsVisible.value = true),
    },
    {
      text: t('play.writing'),
      handler: () => (writingBoardToolVisible.value = true),
    },
    {
      text: t('play.presenter'),
      handler: () => props.changeViewMode('presenter'),
    },
    {
      text: t('play.savePlayMode'),
      handler: getPlaySaveData,
    },
    { divider: true },
    {
      text: t('play.exitScreening'),
      subText: 'ESC',
      handler: exitScreening,
    },
  ]
}

const handleSlideNext = (event: any) => {
  const target = event.target
  let isLink = false

  if (actionAnimation.value) {
    isLink = true
    if (target?.className === 'background') {
      $('.online-screen')
        .find('.actionAnimationStyle')
        .removeClass('actionAnimationStyle')
      $('.online-screen')
        .find('.actionAnimationHiddent')
        .removeClass('actionAnimationHiddent')
      $('.online-screen')
        .find('.actionAnimationShow')
        .removeClass('actionAnimationShow')
    }

    if (target?.className === 'slide-item turning-mode-slideY current') {
      isLink = false
    }
  }

  if (
    target.closest('.link') ||
    target.closest('.video-player') ||
    target.closest('.i-icon-play-one') ||
    target.closest('.i-icon-volume-small') ||
    target.closest('.base-element-audio')
  ) {
    isLink = true
  }

  if (writingBoardToolVisible.value || laserPen.value || isLink) {
    return
  }

  if (slideIndex.value < slides.value.length - 1) {
    turnNextSlide()
  } else if (slideIndex.value === slides.value.length - 1) {
    throttleMassage(t('play.endMessage'))
  }
}
const handleTimeSeting = (data) => {
  timerSetData.value = data
}

const handleSetBar = (type: string) => {
  // 画笔工具
  if (type === 'pen') {
    writingBoardToolVisible.value = !writingBoardToolVisible.value
    timerlVisible.value = false
    laserPen.value = false
    interaction.value = false
    mainStore.setActionAnimation(false)
  }
  // 激光笔
  else if (type === 'laserPen') {
    laserPen.value = !laserPen.value
    writingBoardToolVisible.value = false
    timerlVisible.value = false
    interaction.value = false
    mainStore.setActionAnimation(false)
  }
  // 定时器
  else if (type === 'timer') {
    timerlVisible.value = !timerlVisible.value
    writingBoardToolVisible.value = false
    interaction.value = false
  }

  // 点击放大交互
  else if (type === 'animation') {
    animation.value = !animation.value
    if (animation.value) {
      slides.value.forEach((slide) => {
        slidesStore.updateSlide(
          {
            actionList: {
              ...slide.actionList,
              interactionType: 'clickZoom',
            },
          },
          slide.id
        )
      })
    } else {
      slides.value.forEach((slide) => {
        slidesStore.updateSlide(
          {
            actionList: {
              ...slide.actionList,
              interactionType: 'none',
            },
          },
          slide.id
        )
      })
    }
    actionAnimationActive()
    mainStore.setActionAnimation(animation.value)
    writingBoardToolVisible.value = false
    laserPen.value = false
    timerlVisible.value = false
    interaction.value = false
  }
  // 聚焦模式
  else if (type === 'interaction') {
    interaction.value = !interaction.value
    if (interaction.value) {
      slides.value.forEach((slide) => {
        slidesStore.updateSlide(
          {
            actionList: {
              ...slide.actionList,
              interactionType: 'focusZoom',
            },
          },
          slide.id
        )
      })
    } else {
      slides.value.forEach((slide) => {
        slidesStore.updateSlide(
          {
            actionList: {
              ...slide.actionList,
              interactionType: 'none',
            },
          },
          slide.id
        )
      })
    }

    actionAnimationActive()
    mainStore.setActionAnimation(interaction.value)
    timerlVisible.value = false
    laserPen.value = false
    writingBoardToolVisible.value = false
    animation.value = false
  }
  // 基础
  else if (type === 'base') {
    props.changeViewMode('base')
    mainStore.setActionAnimation(false)
  }
  // 演讲模式
  else if (type === 'presenter') {
    props.changeViewMode('presenter')
    mainStore.setActionAnimation(false)
    writingBoardToolVisible.value = false
    timerlVisible.value = false
    interaction.value = false
    laserPen.value = false
  }
}
// 获取播放保存的数据
const getPlaySaveData = async () => {
  const data = {
    key: 'play_setting',
    value: JSON.stringify({
      timerData: saveTimerData.value,
      playModal: mainStore.playModal,
    }),
  }
  const res = await userEdit(data)
}

const handleLeave = (type: string) => {
  if (!showSlideCatalog.value) return
  if (type === 'leave') {
    leftSlide.value = false
  } else {
    leftSlide.value = true
  }
}
</script>

<style lang="scss" scoped>
.base-view {
  width: 100%;
  height: 100%;

  &.laser-pen {
    cursor: url(data:image/png;base64,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)
        20 20,
      default !important;
  }
}
.slide-leave-active {
  animation: slide-out 2s ease;
}

@keyframes slide-out {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(100%);
    opacity: 0;
  }
}

.top-bar {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 0rem;
  overflow: hidden;
  background: #ffffff;
  z-index: 99;
  box-shadow: 0px 4px 30px 0px rgba(0, 0, 0, 0.21);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16rem;
  color: #767676;
  padding: 0 28rem;
  animation: showBox 0.3s ease-in forwards;
  .title-s {
    color: #1a1a1a;
  }
  .line {
    width: 1rem;
    height: 16rem;
    background: #d8d8d8;
    margin: 15rem;
  }
  .cursor {
    cursor: pointer;
    user-select: none;
    &:hover {
      color: $themeColor;
    }
  }
  .share-btn {
    background: linear-gradient(270deg, #6040fc 15%, #e750e6 100%);
    padding: 6rem 14rem;
    border-radius: 5rem;
    cursor: pointer;
    color: #fff;
    margin-right: 20rem;
    transition: background 0.5s;
    user-select: none;

    &:hover {
      background: linear-gradient(170deg, #6040fc 15%, #e750e6 100%);
    }
  }

  .light-num {
    color: $themeColor;
    font-weight: bold;
    margin: 0 3rem;
    min-width: 30rem;
    text-align: center;
  }
  .speaceBetween {
    display: flex;
    align-items: center;
    i {
      font-size: 24rem;
    }
  }
}

@keyframes showBox {
  0% {
    height: 0rem;
  }
  100% {
    height: 60rem;
  }
}
.right-bar {
  width: 50rem;
  height: 100%;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 8;
}
.bottom-bar {
  width: 100%;
  height: 120rem;
  position: fixed;
  right: 0;
  bottom: 0;
  z-index: 8;
  padding: 10rem 15rem;
  .reamrk-style {
    position: relative;
    height: 100rem;
    border-radius: 8rem;
    color: #fff;
    font-size: 16rem;
    display: flex;
    align-items: center;
    padding: 17rem;
    transform: background 0.3s ease;
    .avatar {
      position: relative;
      width: 64rem;
      height: 64rem;
      border-radius: 50%;
      overflow: hidden;
      border: 1rem solid $themeColor;
      box-shadow: 0px 4px 10px 0px rgba(0, 0, 0, 0.3);

      .audio {
        width: 100%;
        height: 23rem;
        position: absolute;
        bottom: 0;
        background: rgba(78, 62, 255, 0.7);
        .audio-visualizer {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 2rem;
        }
        .bar {
          width: 2rem;
          background: linear-gradient(to top, #6040fc, #f8ecf8);
          border-radius: 3rem;
        }
        .play-bar {
          animation: equalize 1.5s infinite ease-in-out;
        }

        /* 为每个竖线设置不同的动画延迟和高度变化 */
        .bar:nth-child(1) {
          height: 1rem;
          animation-delay: 0.1s;
        }
        .bar:nth-child(2) {
          height: 3rem;
          animation-delay: 0.7s;
        }
        .bar:nth-child(3) {
          height: 6rem;
          animation-delay: 0.3s;
        }
        .bar:nth-child(4) {
          height: 12rem;
          animation-delay: 0.5s;
        }
        .bar:nth-child(5) {
          height: 16rem;
          animation-delay: 0.2s;
        }
        .bar:nth-child(6) {
          height: 12rem;
          animation-delay: 0.4s;
        }
        .bar:nth-child(7) {
          height: 6rem;
          animation-delay: 0.6s;
        }
        .bar:nth-child(8) {
          height: 3rem;
          animation-delay: 0.3s;
        }
        .bar:nth-child(9) {
          height: 1rem;
          animation-delay: 0.7s;
        }

        @keyframes equalize {
          0%,
          100% {
            transform: scaleY(1);
          }
          50% {
            transform: scaleY(0.3);
          }
        }
      }
    }
    .remark-text {
      width: calc(100% - 80rem);
      margin-left: 15rem;
      opacity: 0;
      overflow: hidden;
      transition: all 0.3s ease-in-out;
      &:hover .remark-text-content {
        animation-play-state: paused;
      }
      .translate_remark {
        color: #aaa;
      }
      .remark-text-content {
        white-space: nowrap;
        line-height: 28rem;
        cursor: default;
        span {
          display: inline-block;
        }
      }
      .text-animation {
        animation: infinite-scroll 20s linear forwards;
        --scroll-distance: 0px;
      }
      .translate-animation {
        animation: infinite-scroll2 15s linear forwards;
        --scroll-distance: 0px;
      }
      @keyframes infinite-scroll {
        0% {
          transform: translateX(0);
        }
        100% {
          transform: translateX(var(--scroll-distance));
        }
      }
      @keyframes infinite-scroll2 {
        0% {
          transform: translateX(0);
        }
        100% {
          transform: translateX(var(--scroll-distance));
        }
      }
    }
    .remarkClass {
      opacity: 1;
    }
  }

  .controls-bar {
    position: absolute;

    top: 30rem;
    height: 60rem;
    display: flex;
    transition: all 0.3s ease-in-out;
    animation: showBar 0.3s ease-in forwards;
    .controls-bar-left {
      border-radius: 50rem;
      padding: 8rem 10rem;
      display: flex;
      align-items: center;
      background: #ffffff;
      box-shadow: 0px 4px 30px 0px rgba(0, 0, 0, 0.21);
      color: $themeColor;
    }

    i {
      font-size: 32rem;
    }
    .item-bar {
      margin: 0 9rem;
      cursor: pointer;
    }
    .process {
      pointer-events: none;
      border: 1px solid #dddaff;

      backdrop-filter: blur(10px);

      border-radius: 6px;
      opacity: 1;
      padding: 5rem 12rem;
      color: #dddaff;
    }
    .disableColor {
      color: $lightColor;
    }
    .volume {
      position: relative;
    }
    .volume-bar {
      position: absolute;
      top: -180rem;
      left: -10rem;
      width: 50rem;
      padding: 0 0;
      height: 0;
      overflow: hidden;
      border-radius: 50rem;
      background-color: #fff;
      display: flex;
      justify-content: center;
      ::v-deep(.arco-slider-track.arco-slider-track-vertical) {
        min-height: 50px;
        margin: 0;
      }
      ::v-deep(.arco-slider-track.arco-slider-track-vertical::before) {
        width: 10rem;
        border-radius: 10rem;
      }
      ::v-deep(.arco-slider-track-vertical .arco-slider-bar) {
        width: 10rem;
        border-radius: 10rem;
      }
      ::v-deep(.arco-slider-vertical) {
        min-width: auto;
      }
      ::v-deep(.arco-slider-bar) {
        background-color: $themeColor;
      }
      ::v-deep(.arco-slider-btn::after) {
        border-color: $themeColor;
        width: 18rem;
        height: 18rem;
        left: 50%;
        transform: translateX(-50%);
        box-shadow: -4px 0px 9px 0px rgba(36, 27, 142, 0.44);
      }
    }
    .volume-bar-show {
      height: 167rem;
      width: 50rem;
      padding: 16rem 0;
      top: -180rem;
    }
  }

  .remark-bg {
    background: rgba(26, 26, 26, 0.5);
    backdrop-filter: blur(10px);
    .controls-bar {
      top: -60rem;
    }
  }

  @keyframes showBar {
    0% {
      opacity: 0;
      right: -100rem;
    }
    100% {
      opacity: 1;
      right: 10rem;
    }
  }
  .audio-chat {
    width: 60rem;
    height: 60rem;
    border-radius: 50%;
    background: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-left: 13rem !important;
    margin-right: 0 !important;
    img {
      width: 30rem;
    }
  }
  .audio-question {
    margin: 0;
    position: absolute;
    z-index: 99;
    width: 430rem;
    height: 700rem;
    top: -640rem;
    right: -1999rem;
    transition: all 0.3s ease-in-out;
    background: #fff;
    border-radius: 18rem;
    box-shadow: 0 0 10rem rgba(0, 0, 0, 0.1);
  }

  .controls-bar-move {
    right: 460rem !important;
  }
  .audio-question-move {
    right: -450rem;
  }
}

.left-slide {
  z-index: 2;
  position: fixed;
  width: 50px;
  height: 100vh;
  top: 0;
  left: 0;
  padding: 20px 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  .slide-page {
    padding: 9rem 0;
    width: 37px;
    height: 73px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    color: #fff;
    font-size: 14rem;
    justify-content: space-between;
    align-items: center;
    flex-direction: column;
    cursor: pointer;
  }
  .page-line {
    width: 18rem;
    height: 1rem;
    transform: rotate(160.56deg);
    background: #fff;
  }
  .slide-tools {
    margin-left: -1000px;
    transition: margin $transitionDelay;
    font-size: 12px;
    color: #fff;
    text-align: center;
    width: 100%;
    line-height: 30px;
    background: rgba(62, 62, 62, 0.8);
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
  }

  .thumbnails-box {
    margin-left: -1000px;
    transition: margin $transitionDelay;
    position: relative;
    width: 100%;
    background: rgba(62, 62, 62, 0.8);
    overflow-y: auto;
    overflow-x: hidden;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    padding: 10px;
    max-height: 76%;
  }

  &.visible {
    width: 160px;
    .thumbnails-box,
    .slide-tools {
      margin-left: 0;
    }
    .thesie-box {
      display: block;
    }
  }

  .thumbnail {
    display: inline-block;
    outline: 1px solid #aaa;
    border-radius: 8px;
    margin-bottom: 10px;
    cursor: pointer;
    position: relative;

    .thumbnail-item {
      border-radius: 8px;
      overflow: hidden;
    }

    .marsk {
      position: absolute;
      left: 0;
      top: 0;
      z-index: 2;
      width: 100%;
      height: 100%;
      border-radius: 8px;
      background: #000;
      opacity: 0.4;
    }

    .caret-right {
      position: absolute;
      left: -13px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 16px;
      color: #fff;
      opacity: 0;
      margin-left: -4px;
      z-index: 2;
    }

    &:hover {
      outline-color: $themeColor;
    }

    &.active {
      outline-width: 2px;
      outline-color: $themeColor;
      opacity: 1;
      .caret-right {
        opacity: 1;
      }
      .marsk {
        opacity: 0;
      }
    }
  }
}
.tools-left {
  position: fixed;
  bottom: 8px;
  left: 8px;
  font-size: 25px;
  color: #666;
  z-index: 10;

  .tool-btn {
    opacity: 0.35;
    cursor: pointer;

    &:hover {
      opacity: 0.9;
    }
    & + .tool-btn {
      margin-left: 8px;
    }
  }
}
.tools-right {
  height: 66px;
  position: fixed;
  width: 500px;
  bottom: 0;
  right: 0;
  z-index: 5;
  padding: 8px;

  &.visible {
    height: 200px;
    .content {
      bottom: 16px;
    }
    .thesie-box {
      display: block;
    }

    .tools-timeSeting {
      bottom: 80px;
    }
  }

  .content,
  .tools-timeSeting {
    transition: bottom $transitionDelay;
    position: absolute;
    right: 16px;
    bottom: -77px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: $borderRadius;
    font-size: 12px;
    border-radius: 10px;
    background: rgba(62, 62, 62, 0.8);
    color: #ffffff;
    padding: 4px 12px;
    box-shadow: 0 2px 12px 0 rgb(56, 56, 56, 0.2);
  }

  .tools-timeSeting {
    padding: 10px 10px;
    bottom: -77px;
  }

  .timer {
    background: #000000;
    margin-right: 10px;
  }

  .tool-btn {
    cursor: pointer;
    justify-content: center;
    align-items: center;
    display: flex;
    padding: 6px;
    border-radius: 8px;
    .iconfont {
      font-size: 20px;
    }
    user-select: none;

    &:hover,
    &.active {
      background: #000000;
    }

    & + .tool-btn {
      margin-left: 15px;
    }
  }
  .page-number {
    font-size: 14px;
    padding: 8px 12px;
    cursor: pointer;
  }
}
</style>
