<template>
  <div class="mobile-editor" :class="viewTemlpate.show ? 'viewThemeMark' : ''">
    <Header :changeMode="changeMode" @click="handleClickBlankArea()" />
    <div
      class="content"
      ref="contentRef"
      :style="{
        height: boxHeight + 'px',
      }"
      :class="isAllDisableEdit ? 'allDisableEdit' : ''"
      @touchstart="handleClickBlankArea()"
    >
      <div class="viewport-wrapper" :style="viewportStyles">
        <template v-if="!viewTemlpate.show">
          <div class="background" :style="backgroundStyle"></div>
          <template v-if="!isAllDisableEdit">
            <AlignmentLine
              v-for="(line, index) in alignmentLines"
              :key="index"
              :type="line.type"
              :axis="line.axis"
              :length="line.length"
              :canvasScale="canvasScale"
            />
            <template v-for="element in elementList" :key="element.id">
              <MobileOperate
                v-if="element.type !== 'line'"
                :elementInfo="element"
                :isSelected="activeElementIdList.includes(element.id)"
                :canvasScale="canvasScale"
                :scaleElement="scaleElement"
                :rotateElement="rotateElement"
                :opcationElement="opcationElement"
              />
            </template>
          </template>

          <div
            class="viewport"
            ref="viewportRef"
            :style="{ transform: `scale(${canvasScale})` }"
          >
            <MobileEditableElement
              v-for="(element, index) in elementList"
              :key="element.id"
              :elementInfo="element"
              :elementIndex="index + 1"
              :selectElement="selectElement"
              :dragElement="dragElement"
              v-show="!hiddenElementIdList.includes(element.id)"
            />
          </div>
        </template>
        <template v-else>
          <ThumbnailSlide
            class="thumbnail allViewThumbnail"
            :slide="viewSlide"
            :size="viewportStyles.size"
          >
            <template #top>
              <div
                class="allViewPageTips"
                v-if="viewTemlpate.type === 'allView'"
              >
                正在进行AI深度全文美化-逐页应用...{{ slideIndex }}/{{
                  slides.length
                }}页
              </div>
              <div
                class="aciton-paction"
                v-if="viewTemlpate.action === 'start'"
              >
                <img src="@/assets/image/beautify.gif" alt="" />
              </div>
            </template>
          </ThumbnailSlide>
          <div class="allViewBtn">
            <template v-if="viewTemlpate.type === 'allView'">
              <div class="allViewStop" @click="handleCloseBeautify">
                停止美化
              </div>
              <div class="allViewTips">(预计总美化时间需要0.4 ~1.2分钟)</div>
            </template>
            <!-- <template v-else>
              <div class="allViewTips">正在进行AI排版与实时预览...</div>
            </template> -->
          </div>
        </template>

        <CreateLoading
          v-if="createLoading?.showLoading"
          :style="{
            width: viewportSize + 'px',
            height: viewportSize * viewportRatio + 'px',
            transform: `scale(${canvasScale})`,
            transformOrigin: '0 0',
          }"
        />
      </div>
    </div>

    <SlideToolbar
      :openLayoutAI="handleOpenLayout"
      :addElement="handleElementAdd"
      :elementStyle="handleElementStyle"
      :changeMode="changeMode"
    />
    <ElementAddToolbar v-if="showAdd" />
    <ElementLinkUrl v-if="openLink" @close="openLink = false" />
    <ElementToolbar v-if="mobileEditor" />
    <AILayoutTheme
      :isChatAI="ChatAIData"
      v-if="mobileLayout && !handleElement"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watchEffect, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore, useScreenStore } from '@/store'
import type { PPTElement } from '@/types/slides'
import type { AlignmentLineProps } from '@/types/edit'
import type { Mode } from '@/types/mobile'
import ThumbnailSlide from '@/views/components/ThumbnailSlide/index.vue'
import useSlideBackgroundStyle from '@/hooks/useSlideBackgroundStyle'
import useDragElement from '@/views/Editor/Canvas/hooks/useDragElement'
import useScaleElement from '@/views/Editor/Canvas/hooks/useScaleElement'
import useRotateElement from '@/views/Editor/Canvas/hooks/useRotateElement'
import ElementAddToolbar from '@/views/Mobile/MobileEditor/ElementAddToolbar.vue'
import ElementLinkUrl from '@/views/Mobile/MobileEditor/ElementLinkUrl.vue'
import AlignmentLine from '@/views/Editor/Canvas/AlignmentLine.vue'
import MobileEditableElement from './MobileEditableElement.vue'
import MobileOperate from './MobileOperate.vue'
import SlideToolbar from './SlideToolbar.vue'
import ElementToolbar from './ElementToolbar.vue'
import AILayoutTheme from './AILayoutTheme.vue'
import Header from './Header.vue'
import CreateLoading from '@/components/CreateLoading.vue'
defineProps<{
  changeMode: (mode: Mode, back?: string) => void
}>()

const { rem } = storeToRefs(useScreenStore())
const slidesStore = useSlidesStore()
const mainStore = useMainStore()
const { slideIndex, slides, currentSlide, viewportRatio, viewportSize } =
  storeToRefs(slidesStore)
const {
  activeElementIdList,
  handleElement,
  handleElementId,
  hiddenElementIdList,
  mobileLayout,
  viewTemlpate,
  mobileChatResule,
  isAllDisableEdit,
  createLoading,
  mobileEditor,
} = storeToRefs(mainStore)
const contentRef = ref<HTMLElement>()
const viewportRef = ref<HTMLElement>()

const alignmentLines = ref<AlignmentLineProps[]>([])
const boxHeight = computed(() => {
  const box = document.body.clientHeight
  return mobileLayout.value
    ? box - (420 + 160) * rem.value
    : box - 310 * rem.value
})

const viewSlide = computed(() => {
  return viewTemlpate.value?.data
})
const background = computed(() => currentSlide.value?.background)
const { backgroundStyle } = useSlideBackgroundStyle(background)

const canvasScale = computed(() => {
  if (!contentRef.value) return 1
  const contentWidth = contentRef.value.clientWidth
  const contentheight = contentRef.value.clientHeight

  const contentRatio = contentheight / contentWidth
  if (contentRatio >= viewportRatio.value) {
    return (contentWidth - 20) / viewportSize.value
  }
  return (contentheight - 20) / viewportRatio.value / viewportSize.value
})

onMounted(() => {
  if (activeElementIdList.value.length) mainStore.setActiveElementIdList([])
  if (slideIndex.value !== 0) slidesStore.updateSlideIndex(0)
})

const viewportStyles = computed(() => ({
  width: viewportSize.value * canvasScale.value + 'px',
  height: viewportSize.value * viewportRatio.value * canvasScale.value + 'px',
  size: viewportSize.value * canvasScale.value,
}))

const elementList = ref<PPTElement[]>([])
const setLocalElementList = () => {
  elementList.value = currentSlide.value
    ? JSON.parse(JSON.stringify(currentSlide.value.elements))
    : []
}
watchEffect(setLocalElementList)

const { dragElement } = useDragElement(elementList, alignmentLines, canvasScale)
const { scaleElement } = useScaleElement(
  elementList,
  alignmentLines,
  canvasScale
)
const { rotateElement } = useRotateElement(
  elementList,
  viewportRef,
  canvasScale
)

const selectElement = (
  e: TouchEvent,
  element: PPTElement,
  startMove = true
) => {
  if (!activeElementIdList.value.includes(element.id)) {
    mainStore.setActiveElementIdList([element.id])
    mainStore.setHandleElementId(element.id)
  }
  if (startMove) dragElement(e, element)
}

const handleOpenLayout = () => {
  ChatAIData.value = null
  mainStore.setMobileLayout(true)
  mainStore.setActiveElementIdList([])
}
const handleClickBlankArea = () => {
  mainStore.setActiveElementIdList([])
  mainStore.setMobileLayout(false)
  ChatAIData.value = null
  showAdd.value = false
  mainStore.setMobileEditor(false)
  openLink.value = false
}

const showAdd = ref(false)
const handleElementAdd = () => {
  showAdd.value = true
  mainStore.setMobileEditor(false)
}

const handleElementStyle = () => {
  mainStore.setMobileEditor(true)
}

const openLink = ref(false)
const opcationElement = (e: any, data: any, type: string) => {
  if (type === 'style') {
    mainStore.setMobileEditor(true)
    openLink.value = false
    if (data.type === 'text') {
      const dom = document.getElementById(`eidtor-text-${data.id}`)
      dom.blur()
    }
  } else if (type === 'link') {
    openLink.value = true
    mainStore.setMobileEditor(false)
  } else if (type === 'editor') {
    setTimeout(() => {
      const editorRef: HTMLElement | null = document.querySelector(
        `#eidtor-text-${handleElementId.value} .ProseMirror`
      )
      if (editorRef) editorRef.focus()
    }, 400)
  }
}

const handleCloseBeautify = () => {
  ChatAIData.value = null
  mainStore.setMobileLayout(false)
  mainStore.setShowCarpSlide({ show: false, isAllSlide: false })
  setTimeout(() => {
    mainStore.updateViewTemplate({ show: false, data: null })
  }, 200)
  //
}
const ChatAIData = ref(null)
const handleChatAI = (data: any) => {
  const type = data.type
  ChatAIData.value = data.action
  mainStore.setMobileLayout(true)
  mainStore.setActiveElementIdList([])
}

watch(handleElementId, () => {
  mainStore.setMobileEditor(false)
  openLink.value = false
  ChatAIData.value = null
  mainStore.setMobileLayout(false)
  showAdd.value = false
})

watch(
  mobileChatResule,
  (newVal, onlValue) => {
    if (newVal !== onlValue && newVal) {
      handleChatAI(newVal)
    }
  },
  {
    immediate: true,
  }
)
</script>

<style lang="scss" scoped>
.mobile-editor {
  padding-top: 4rem;
  height: 100%;
  position: relative;
}
.viewThemeMark {
  position: relative;
  width: 100%;
  height: 100%;
  .content {
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
    }
  }

  .mobile-editor-header {
    &::after {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 999;
    }
  }
  .slide-toolbar {
    &::after {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 99999;
    }
  }
}
.content {
  height: calc(100% - 280rem);
  display: flex;
  justify-content: center;
  align-items: center;
  transition: height 0.5s;
}

.allDisableEdit {
  position: relative;
  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: 99;
  }
}
.viewport {
  transform-origin: 0 0;
}
.viewport-wrapper {
  position: relative;
  box-shadow: 0 0 15rem 0 rgba(0, 0, 0, 0.1);
}
.background {
  width: 100%;
  height: 100%;
  background-position: center;
  position: absolute;
  border-radius: 10rem;
}

.allViewThumbnail {
  background: transparent;
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
  top: -50rem;
  left: 50%;
  transform: translateX(-50%);
}
.allViewBtn {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.allViewTips,
.allViewPageTips {
  color: #fff;
  font-size: 14rem;
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
</style>
