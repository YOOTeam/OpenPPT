<template>
  <div
    class="screen-element"
    :class="{
      link: elementInfo.link,
      actionAnimation:
        actionAnimation &&
        currentSlide?.actionList?.interactionType !== 'clickEmphasize' &&
        !currentSlide?.actionList?.defaultElementIds?.includes(elementInfo.id),
    }"
    :id="`screen-element-${elementInfo.id}`"
    :style="{
      zIndex: elementIndex,
      color: theme.fontColor,
      fontFamily: theme.fontName,
      visibility: needWaitAnimation ? 'hidden' : 'visible',
    }"
    :title="elementInfo.link?.target || ''"
    @click="($event) => openLink($event)"
    :groupId="elementInfo.groupId"
  >
    <component
      :is="currentElementComponent"
      :elementInfo="elementInfo"
    ></component>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore, useMainStore } from '@/store'
import { ElementTypes, type PPTElement } from '@/types/slides'
import BaseIframeElement from '@/views/components/element/IframeElement/BaseIframeElement.vue'
import BaseImageElement from '@/views/components/element/ImageElement/BaseImageElement.vue'
import BaseTextElement from '@/views/components/element/TextElement/BaseTextElement.vue'
import BaseShapeElement from '@/views/components/element/ShapeElement/BaseShapeElement.vue'
import BaseLineElement from '@/views/components/element/LineElement/BaseLineElement.vue'
import BaseChartElement from '@/views/components/element/ChartElement/BaseChartElement.vue'
import BaseTableElement from '@/views/components/element/TableElement/BaseTableElement.vue'
import BaseLatexElement from '@/views/components/element/LatexElement/BaseLatexElement.vue'
import ScreenVideoElement from '@/views/components/element/VideoElement/ScreenVideoElement.vue'
import ScreenAudioElement from '@/views/components/element/AudioElement/ScreenAudioElement.vue'
import useAnimmation from './hooks/useAnimmation'
const mainStore = useMainStore()
const { actionAnimation } = storeToRefs(mainStore)
const { currentSlide } = storeToRefs(useSlidesStore())

const props = defineProps<{
  elementInfo: PPTElement
  elementIndex: number
  animationIndex: number
  turnSlideToId: (id: string) => void
  manualExitFullscreen: () => void
}>()
const { actionAnimationActive } = useAnimmation()

const currentElementComponent = computed<unknown>(() => {
  const elementTypeMap = {
    [ElementTypes.IMAGE]: BaseImageElement,
    [ElementTypes.TEXT]: BaseTextElement,
    [ElementTypes.SHAPE]: BaseShapeElement,
    [ElementTypes.LINE]: BaseLineElement,
    [ElementTypes.CHART]: BaseChartElement,
    [ElementTypes.TABLE]: BaseTableElement,
    [ElementTypes.LATEX]: BaseLatexElement,
    [ElementTypes.VIDEO]: ScreenVideoElement,
    [ElementTypes.AUDIO]: ScreenAudioElement,
    [ElementTypes.IFRAME]: BaseIframeElement,
  }
  return elementTypeMap[props.elementInfo.type] || null
})

const { formatedAnimations, theme, slides } = storeToRefs(useSlidesStore())

// 判断元素是否需要等待执行入场动画：等待执行入场的元素需要先隐藏
const needWaitAnimation = computed(() => {
  // 该元素在本页动画序列中的位置
  const elementIndexInAnimation = formatedAnimations.value.findIndex((item) => {
    const elIds = item.animations.map((item) => item.elId)
    return elIds.includes(props.elementInfo.id)
  })

  // 该元素未设置过动画
  if (elementIndexInAnimation === -1) return false

  // 若该元素已执行过动画，都无须隐藏
  // 具体来说：若已执行的最后一个动画为入场，显然无须隐藏；若已执行的最后一个动画为退场，由于保留了退场动画结束状态，也无需额外隐藏
  if (elementIndexInAnimation < props.animationIndex) return false

  // 若该元素未执行过动画，获取其将要执行的第一个动画
  // 若将要执行的第一个动画为入场，则需要隐藏，否则无须隐藏
  const firstAnimation = formatedAnimations.value[
    elementIndexInAnimation
  ].animations.find((item) => item.elId === props.elementInfo.id)
  if (firstAnimation?.type === 'in') return true
  return false
})

// 打开元素绑定的超链接
const openLink = (e: any) => {
  if (actionAnimation.value) {
    actionAnimationActive('click', e)
    return
  }
  if ((e.target as HTMLElement).tagName === 'A') {
    props.manualExitFullscreen()
    return
  }

  const link = props.elementInfo.link
  if (!link) return

  if (link.type === 'web') {
    props.manualExitFullscreen()
    window.open(link.target)
  } else if (link.type === 'slide') {
    props.turnSlideToId(link.target)
  }
}

const handleAnimationEnd = (e: any) => {
  // 动画结束后，若该元素需要等待执行入场动画，则将其显示出来
  // 先移全文除动画类 actionAnimationStyle
  const elements = document.querySelectorAll('.actionAnimationStyle')
  elements.forEach((el) => {
    el.classList.add('actionAnimationHiddent')
    el.classList.remove('actionAnimationStyle')
  })
  const target = e.target as HTMLElement
  const parent = target.closest('.screen-element')
  const slide = parent?.closest('.screen-slide')
  let elementId = parent?.getAttribute('id')
  if (elementId) {
    elementId = elementId.replace('screen-element-', '')
  }
  const groupId = parent?.getAttribute('groupId')
  const slideId = slide?.getAttribute('id')
  // 给slide元素添加一个蒙层 突出动画效果
  // 创建一个元素 添加到slide元素上
  const slideData = slides.value.find((slide) => slide.id === slideId)

  const elementData = slideData?.elements.find((el) => el.id === elementId)

  if (groupId && slideId) {
    const sameGroup = slideData?.elements.filter((el) => el.groupId === groupId)
    //  给相同元素添加放大的样式 提高层级样式
    sameGroup?.forEach((el) => {
      const elElement = document.getElementById(`screen-element-${el.id}`)
      if (elElement) {
        elElement.style.opacity = '1'
        elElement.style.filter = 'none'
        elElement.children[0].classList.add('actionAnimationStyle')
      }
    })
  } else if (elementData?.tags?.custom?.group_index) {
    const sameGroup = slideData?.elements.filter(
      (el) =>
        el.tags?.custom?.group_index === elementData.tags?.custom?.group_index
    )
    //  给相同元素添加放大的样式 提高层级样式
    sameGroup?.forEach((el) => {
      const elElement = document.getElementById(`screen-element-${el.id}`)
      if (elElement) {
        elElement.style.opacity = '1'
        elElement.style.filter = 'none'
        elElement.children[0].classList.add('actionAnimationStyle')
      }
    })
  } else {
    let addStyle = true
    const key = [
      'decoration',
      'pagedecorate',
      'bg',
      'decoration_text',
      'school_bg',
    ]
    if (key.includes(elementData?.tags?.custom?.shape_type)) {
      addStyle = false
    }
    // 直接给当前元素添加放大的样式 提高层级样式
    const elElement = document.getElementById(`screen-element-${elementId}`)
    if (elElement && addStyle) {
      elElement.style.opacity = '1'
      elElement.style.filter = 'none'
      elElement.children[0].classList.add('actionAnimationStyle')
    }
  }
}
</script>

<style lang="scss" scoped>
.link {
  cursor: pointer;
}
.hover {
  cursor: pointer;
  animation: actionAnimation2 0.5s ease-in-out forwards;
}

.actionAnimation {
  cursor: pointer;
  opacity: 0.2;
  filter: blur(1px);
  transition: all 0.3s ease-in-out;
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
}
.actionAnimationHiddent {
  opacity: 0.2;
  filter: blur(1px);
  transition: all 0.3s ease-in-out;
}

.actionAnimationShow {
  opacity: 1;
  filter: none;
  transform: scale(1.02);
  z-index: 999;
}
.actionAnimationStyle {
  opacity: 1;
  filter: none;
  transform: scale(1.02);
  z-index: 999;
}
.actionAnimationClick {
  animation: actionAnimation 0.5s ease-in-out forwards;
}
@keyframes actionAnimation {
  from {
    transform: scale(1);
  }
  to {
    opacity: 1;
    filter: none;
    transform: scale(1.01);
    z-index: 999;
  }
}
@keyframes actionAnimation2 {
  from {
    transform: scale(1);
  }
  to {
    opacity: 1;
    filter: none;
    transform: scale(1.02);
    z-index: 999;
  }
}
</style>
