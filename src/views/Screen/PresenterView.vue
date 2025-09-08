<template>
  <div class="presenter-view">
    <div class="content">
      <div
        class="slide-list-wrap"
        :class="{ 'laser-pen': laserPen }"
        ref="slideListWrapRef"
      >
        <ScreenSlideList
          style="border-radius: 10px"
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
        <WritingBoardTool
          :slideWidth="slideWidth"
          :slideHeight="slideHeight"
          :left="10"
          :top="-64"
          v-if="writingBoardToolVisible"
          @close="writingBoardToolVisible = false"
        />
        <CountdownTimer
          v-if="timerlVisible"
          :timeData="timerSetData"
          :left="16"
          @close="timerlVisible = false"
        />
      </div>
      <div class="thumbnails-box">
        <div
          class="thumbnails"
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
            <ThumbnailSlide
              :slide="slide"
              :size="90 / viewportRatio"
              :visible="index < slidesLoadLimit"
            />
            <div class="order">
              {{ slideIndex + 1 < 10 ? `0${slideIndex + 1}` : slideIndex + 1 }}
            </div>
          </div>
        </div>
      </div>
      <div class="footer-tools">
        <div
          class="tools-timeSeting"
          :style="{ opacity: timerlVisible ? 1 : 0 }"
        >
          <TimeSetting
            @action="(data) => (timerSetData = data)"
            v-if="timerlVisible"
          />
        </div>
        <ToolBar
          :showType="'presenter'"
          class="content-tools"
          :timerlVisible="timerlVisible"
          :laserPen="laserPen"
          :animation="actionAnimation"
          :fullscreen="fullscreenState"
          :interaction="interaction"
          @exitFullscreen="manualExitFullscreen"
          @setBar="handleSetBar"
        />
      </div>
      <div class="footer-tools-right">
        <div class="btns-page-tips">
          {{ slideIndex + 1 < 10 ? `0${slideIndex + 1}` : slideIndex + 1 }} /
          {{ slides?.length < 10 ? `0${slides?.length}` : slides?.length }}
          {{ $t('catalog.page') }}
        </div>

        <span class="page-num"> </span>
        <div class="btns-page" @click="handlePage('up')">
          <IconLeftCircle :size="14" style="margin-right: 5px" />
          {{ $t('play.upPage') }}
        </div>
        <div class="btns-page" @click="handlePage('next')">
          <IconRightCircle :size="14" style="margin-right: 5px" />{{
            $t('play.downPage')
          }}
        </div>
      </div>
    </div>

    <div class="pxark">
      <div class="header">
        <!-- <span></span> -->
        {{ $t('play.remark') }}
        <!-- <span>P {{ slideIndex + 1 }} / {{ slides.length }}</span> -->
      </div>
      <div
        class="pxark-content ProseMirror-static"
        :style="{ fontSize: pxarkFontSize + 'px' }"
        v-html="currentSlidepxark"
      ></div>
      <!-- <div class="pxark-scale">
        <div
          :class="['scale-btn', { disable: pxarkFontSize === 12 }]"
          @click="setpxarkFontSize(pxarkFontSize - 2)"
        >
          <IconMinus />
        </div>
        <div
          :class="['scale-btn', { disable: pxarkFontSize === 40 }]"
          @click="setpxarkFontSize(pxarkFontSize + 2)"
        >
          <IconPlus />
        </div>
      </div> -->
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore, useMainStore, useScreenStore } from '@/store'
import type { ContextmenuItem } from '@/components/Contextmenu/types'
import { parseText2Paragraphs } from '@/utils/textParser'
import useScreening from '@/hooks/useScreening'
import useLoadSlides from '@/hooks/useLoadSlides'
import useExecPlay from './hooks/useExecPlay'
import useSlideSize from './hooks/useSlideSize'
import useFullscreen from './hooks/useFullscreen'
import { userEdit } from '@/api/userInfo'
import ToolBar from './ToolBar.vue'
import ThumbnailSlide from '@/views/components/ThumbnailSlide/index.vue'
import ScreenSlideList from './ScreenSlideList.vue'
import WritingBoardTool from './WritingBoardTool.vue'
import CountdownTimer from './CountdownTimer.vue'
import TimeSetting from './TimeSetting.vue'

import { IconLeftCircle, IconRightCircle } from '@arco-design/web-vue/es/icon'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const props = defineProps<{
  changeViewMode: (mode: 'base' | 'presenter') => void
}>()
const mainStore = useMainStore()
const screenStore = useScreenStore()
const slidesStore = useSlidesStore()
const { actionAnimation, thesisData, saveTimerData } = storeToRefs(mainStore)
const { slides, slideIndex, viewportRatio, currentSlide } =
  storeToRefs(slidesStore)
const timerSetData = ref(null)
const slideListWrapRef = ref<HTMLElement>()
const thumbnailsRef = ref<HTMLElement>()
const writingBoardToolVisible = ref(false)
const timerlVisible = ref(false)
const interaction = ref(false)
const laserPen = ref(false)
import $ from 'jquery'
const {
  mousewheelListener,
  touchStartListener,
  touchEndListener,
  turnPrevSlide,
  turnNextSlide,
  turnSlideToIndex,
  turnSlideToId,
  actionAnimationActive,
  animationIndex,
  execPrev,
  execNext,
} = useExecPlay()

const { slideWidth, slideHeight } = useSlideSize(slideListWrapRef)
const { exitScreening } = useScreening()
const { slidesLoadLimit } = useLoadSlides()
const { fullscreenState, manualExitFullscreen } = useFullscreen()

const pxarkFontSize = ref(12)

const currentSlidepxark = computed(() => {
  return parseText2Paragraphs(currentSlide.value.remark || t('play.noData'))
})

const handleMousewheelThumbnails = (e: WheelEvent) => {
  if (!thumbnailsRef.value) return
  thumbnailsRef.value.scrollBy(e.deltaY, 0)
}

const setpxarkFontSize = (fontSize: number) => {
  if (fontSize < 12 || fontSize > 40) return
  pxarkFontSize.value = fontSize
}

const handlePage = (type) => {
  if (type === 'next') {
    if (slideIndex.value >= slides.value.length - 1) {
      execNext()
      return
    }
    turnSlideToIndex(slideIndex.value + 1)
  } else {
    if (slideIndex.value <= 0) {
      execPrev()
      return
    }
    turnSlideToIndex(slideIndex.value - 1)
  }
}

watch(
  slideIndex,
  () => {
    nextTick(() => {
      if (!thumbnailsRef.value) return
      const activeThumbnailRef: HTMLElement | null =
        thumbnailsRef.value.querySelector('.thumbnail.active')
      if (!activeThumbnailRef) return

      const width = thumbnailsRef.value.offsetWidth
      const offsetLeft = activeThumbnailRef.offsetLeft
      thumbnailsRef.value.scrollTo({
        left: offsetLeft - width / 2,
        behavior: 'smooth',
      })
    })
  },
  {
    immediate: true,
  }
)

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
      text: t('play.writing'),
      handler: () => (writingBoardToolVisible.value = true),
    },
    {
      text: t('play.baseView'),
      handler: () => props.changeViewMode('base'),
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
}
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
    actionAnimation.value = !actionAnimation.value
    screenStore.setInteractionData({
      ...screenStore.interactionData,
      interactionType: 'clickZoom',
    })
    actionAnimationActive()
    mainStore.setActionAnimation(actionAnimation.value)
    writingBoardToolVisible.value = false
    laserPen.value = false
    timerlVisible.value = false
    interaction.value = false
  }
  // 聚焦模式
  else if (type === 'interaction') {
    interaction.value = !interaction.value
    screenStore.setInteractionData({
      ...screenStore.interactionData,
      interactionType: 'focusZoom',
    })
    mainStore.setActionAnimation(interaction.value)
    timerlVisible.value = false
    laserPen.value = false
    writingBoardToolVisible.value = false
    actionAnimation.value = false
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
</script>

<style lang="scss" scoped>
.presenter-view {
  width: 100%;
  height: 100%;
  display: flex;
}
.thesie-box {
  width: 35px;
  height: 35px;
  margin: 4px 4px 4px 0;
  cursor: pointer;
  overflow: hidden;
  border-radius: 6px;
  img {
    width: 100%;
  }
}
.toolbar {
  width: 70px;
  height: 100%;
  background-color: #fff;
  border-right: solid 1px #eee;
  font-size: 12px;
  margin: 20px 0;

  .tool-btn {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: pointer;

    & + .tool-btn {
      margin-top: 22px;
    }

    &:hover,
    &.active {
      color: $themeColor;
    }
  }

  .divider {
    width: 70%;
    margin: 24px 15% !important;
  }

  .tool-icon {
    margin-bottom: 8px;
    font-size: 22px;
  }
}
.content {
  width: calc(100% - 350px);
  height: 100%;
  position: relative;
}
.slide-list-wrap {
  height: calc(100% - 290px);
  margin: 20px;
  overflow: hidden;
  position: relative;
  ::v-deep(.slide-content) {
    border-radius: 10px;
  }

  ::v-deep(.slide-content .screen-slide) {
    border-radius: 10px;
  }

  &.laser-pen {
    cursor: url(data:image/png;base64,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)
        20 20,
      default !important;
  }
}
.thumbnails-box {
  width: 100%;
  padding: 25px 15px 0 15px;
  border-top: 1px solid #3a3a3a;
}
.thumbnails {
  height: 134px;
  white-space: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
}
.thumbnail {
  display: inline-block;
  border-radius: 10px;
  overflow: hidden;
  opacity: 0.5;
  cursor: pointer;
  position: relative;
  transition: opacity 0.3s;

  .order {
    font-weight: 800;
    opacity: 0;
    position: absolute;
    right: 0;
    bottom: 0;
    font-size: 12px;
    z-index: 2;
    width: 49px;
    height: 22px;
    border-top-left-radius: 15px;
    text-align: center;
    line-height: 22px;
    color: #fff;
    background: rgba(62, 62, 62, 0.8);
    transition: opacity 0.3s;
  }

  & + .thumbnail {
    margin-left: 10px;
  }

  &:hover {
    opacity: 0.9;
    outline-color: $themeColor;
  }

  &.active {
    outline-width: 3px;
    outline-color: $themeColor;
    opacity: 1;

    .order {
      opacity: 1;
    }
  }
}
.pxark {
  width: 360px;
  height: 100%;
  position: relative;
  background-color: #2a2a2a;
  border-left: solid 1px #3a3a3a;
  color: #fff;

  .header {
    height: 60px;
    padding: 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    border-bottom: 1px solid #3a3a3a;
    text-align: center;
    justify-content: center;
  }

  .pxark-content {
    height: calc(100% - 60px);
    padding: 20px;
    line-height: 1.5;
    @include overflow-overlay();
  }

  .pxark-scale {
    position: absolute;
    right: 5px;
    bottom: 5px;
    font-size: 22px;
    display: flex;
  }
  .scale-btn {
    width: 40px;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    user-select: none;
    cursor: pointer;

    &.disable {
      color: #666;
      cursor: no-drop;
    }

    &:not(.disable):hover {
      background-color: #333;
    }
  }
}

.footer-tools-right {
  position: absolute;
  bottom: 16px;
  right: 40px;
  z-index: 2;
  font-size: 12px;
  display: flex;
  align-items: center;
  .page-num {
    color: #fff;
  }
  .btns-page-tips {
    user-select: none;
    padding: 12px 15px;
    border-radius: 10px;
    background: rgba(62, 62, 62, 0.8);
    color: #fff;
    margin-left: 10px;
    font-size: 12px;
    display: flex;
    align-items: center;
  }
  .btns-page {
    user-select: none;
    padding: 12px 15px;
    border-radius: 10px;
    background: rgba(62, 62, 62, 0.8);
    color: #fff;
    margin-left: 10px;
    font-size: 12px;
    display: flex;
    align-items: center;
    &:hover {
      background: rgba(62, 62, 62, 0.4);
      cursor: pointer;
    }
  }
}
.footer-tools {
  position: fixed;
  bottom: 16px;
  left: 10px;
  border-radius: 10px;
  opacity: 1;
  .content-tools {
  }

  .content-tools,
  .tools-timeSeting {
    display: flex;
    align-items: center;
    border-radius: $borderRadius;
    font-size: 12px;
    border-radius: 10px;
    background: rgba(62, 62, 62, 0.8);
    color: #ffffff;
    padding: 4px 12px;
    margin-top: 10px;
    box-shadow: 0 2px 12px 0 rgb(56, 56, 56, 0.2);
  }
  .tools-timeSeting {
    padding: 7px 12px;
    margin-top: 0;
    margin-bottom: 20px;
  }
  .timer {
    background: #000000;
    margin-right: 10px;
  }
  .timer-editor {
    display: flex;
    justify-content: center;
    align-items: center;
    .editor-box {
      width: 30px;
      margin: 0 2px;
      outline: none;
      text-align: center;
    }
  }
  .tool-btns {
    cursor: pointer;
    justify-content: center;
    align-items: center;
    display: flex;
    padding: 4px;
    border-radius: 8px;
    .iconfont {
      font-size: 18px;
    }
    user-select: none;

    &:hover {
      background: rgba(62, 62, 62, 0.8);
    }
    &.active {
      background: #000;
    }

    & + .tool-btns {
      margin-left: 10px;
    }
  }
}

::-webkit-scrollbar {
  width: 0;
  height: 0;
}
</style>
