<template>
  <div
    class="canvas"
    ref="canvasRef"
    @wheel="($event) => handleMousewheelCanvas($event)"
    @mousedown="($event) => handleClickBlankArea($event)"
    @dblclick="($event) => handleDblClick($event)"
    v-contextmenu="contextmenus"
    v-click-outside="removeEditorAreaFocus"
  >
    <ElementCreateSelection
      v-if="creatingElement"
      @created="(data) => insertElementFromCreateSelection(data)"
    />
    <ShapeCreateCanvas
      v-if="creatingCustomShape"
      @created="(data) => insertCustomShape(data)"
    />
    <div
      v-if="showBoxHover"
      class="canvas-hover-box"
      :style="{
        width: viewportStyles.width * canvasScale + 10 + 'px',
        height: viewportStyles.height * canvasScale + 10 + 'px',
        left: viewportStyles.left - 5 + 'px',
        top: viewportStyles.top - 5 + 'px',
      }"
    ></div>

    <div
      class="viewport-wrapper"
      :style="{
        width: viewportStyles.width * canvasScale - 1 + 'px',
        height: viewportStyles.height * canvasScale + 'px',
        left: viewportStyles.left + 'px',
        top: viewportStyles.top + 'px',
      }"
    >
      <template v-if="!viewTemlpate.show">
        <div
          v-if="showElementHover.show"
          class="hover-element-box"
          :style="{
            top: showElementHover?.style?.top,
            left: showElementHover?.style?.left,
            transformOrigin: showElementHover?.style?.transformOrigin,
            transform: showElementHover?.style?.transform,
          }"
        >
          <BorderLine
            v-for="line in borderLines"
            :key="line.type"
            :type="line.type"
            :style="line.style"
            @mousedown.stop
          />
        </div>

        <div class="operates">
          <AlignmentLine
            v-for="(line, index) in alignmentLines"
            :key="index"
            :type="line.type"
            :axis="line.axis"
            :length="line.length"
            :canvasScale="canvasScale"
          />
          <MultiSelectOperate
            v-if="activeElementIdList.length > 1 && !activeGroupElementId"
            :elementList="elementList"
            :scaleMultiElement="scaleMultiElement"
          />
          <Operate
            v-for="element in elementList"
            :key="element.id"
            :elementInfo="element"
            :isSelected="activeElementIdList.includes(element.id)"
            :isActive="handleElementId === element.id"
            :isActiveGroupElement="activeGroupElementId === element.id"
            :isMultiSelect="activeElementIdList.length > 1"
            :rotateElement="rotateElement"
            :scaleElement="scaleElement"
            :openLinkDialog="openLinkDialog"
            :dragLineElement="dragLineElement"
            :moveShapeKeypoint="moveShapeKeypoint"
            v-show="!hiddenElementIdList.includes(element.id)"
          />
          <ViewportBackground />
        </div>

        <div
          class="viewport"
          ref="viewportRef"
          :style="{ transform: `scale(${canvasScale})`, ...boxStyle }"
        >
          <MouseSelection
            v-if="mouseSelectionVisible"
            :top="mouseSelection.top"
            :left="mouseSelection.left"
            :width="mouseSelection.width"
            :height="mouseSelection.height"
            :quadrant="mouseSelectionQuadrant"
          />
          <EditableElement
            v-for="(element, index) in elementList"
            :key="element.id"
            :elementInfo="element"
            :elementIndex="index + 1"
            :isMultiSelect="activeElementIdList.length > 1"
            :selectElement="selectElement"
            :dragElement="dragElement"
            :openLinkDialog="openLinkDialog"
            v-show="!hiddenElementIdList.includes(element.id)"
          />
        </div>
      </template>

      <template v-if="viewTemlpate.show">
        <ThumbnailSlide
          class="thumbnail"
          :class="[!viewTemlpate.type ? '' : 'allViewThumbnail']"
          :slide="viewSlide"
          :size="viewportStyles.width * canvasScale"
        >
          <template #top>
            <div class="allViewPageTips" v-if="viewTemlpate.type === 'allView'">
              {{ $t('lastReamrk.tips4') }}{{ slideIndex }}/{{ slides.length
              }}{{ $t('catalog.page') }}
            </div>
            <div class="aciton-paction" v-if="viewTemlpate.action === 'start'">
              <img src="@/assets/image/beautify.gif" alt="" />
            </div>
          </template>
        </ThumbnailSlide>
        <div class="allViewBtn" v-if="viewTemlpate.type === 'allView'">
          <div class="allViewStop" @click="handleCloseBeautify">
            {{ $t('lastReamrk.tips5') }}
          </div>
          <div class="allViewTips">{{ $t('lastReamrk.tips6') }}</div>
        </div>
      </template>

      <!-- -->
      <CreateLoading
        v-if="createLoading?.showLoading"
        :style="{
          width: viewportStyles.width + 'px',
          height: viewportStyles.height + 'px',
          transform: `scale(${canvasScale})`,
          transformOrigin: '0 0',
        }"
      />
    </div>
    <div class="drag-mask" v-if="spaceKeyState"></div>

    <Ruler
      :viewportStyles="viewportStyles"
      :elementList="elementList"
      v-if="showRuler"
    />

    <Modal v-model:visible="linkDialogVisible" :width="540">
      <LinkDialog @close="linkDialogVisible = false" />
    </Modal>

    <ChartModelBox></ChartModelBox>
  </div>
</template>

<script lang="ts" setup>
import {
  computed,
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
import type { ContextmenuItem } from '@/components/Contextmenu/types'
import type { PPTElement, PPTShapeElement } from '@/types/slides'
import type { AlignmentLineProps, CreateCustomShapeData } from '@/types/edit'
import { injectKeySlideScale } from '@/types/injectKey'
import { removeAllRanges } from '@/utils/selection'
import { KEYS } from '@/configs/hotkey'
import CreateLoading from '@/components/CreateLoading.vue'
import ThumbnailSlide from '@/views/components/ThumbnailSlide/index.vue'
import BorderLine from './Operate/BorderLine.vue'
import useViewportSize from './hooks/useViewportSize'
import useMouseSelection from './hooks/useMouseSelection'
import useDropImageOrText from './hooks/useDropImageOrText'
import useRotateElement from './hooks/useRotateElement'
import useScaleElement from './hooks/useScaleElement'
import useSelectAndMoveElement from './hooks/useSelectElement'
import useDragElement from './hooks/useDragElement'
import useDragLineElement from './hooks/useDragLineElement'
import useMoveShapeKeypoint from './hooks/useMoveShapeKeypoint'
import useInsertFromCreateSelection from './hooks/useInsertFromCreateSelection'

import useDeleteElement from '@/hooks/useDeleteElement'
import useCopyAndPasteElement from '@/hooks/useCopyAndPasteElement'
import useSelectElement from '@/hooks/useSelectElement'
import useScaleCanvas from '@/hooks/useScaleCanvas'
import useScreening from '@/hooks/useScreening'
import useSlideHandler from '@/hooks/useSlideHandler'
import useCreateElement from '@/hooks/useCreateElement'

import EditableElement from './EditableElement.vue'
import MouseSelection from './MouseSelection.vue'
import ViewportBackground from './ViewportBackground.vue'
import AlignmentLine from './AlignmentLine.vue'
import Ruler from './Ruler.vue'
import ElementCreateSelection from './ElementCreateSelection.vue'
import ShapeCreateCanvas from './ShapeCreateCanvas.vue'
import MultiSelectOperate from './Operate/MultiSelectOperate.vue'
import Operate from './Operate/index.vue'
import LinkDialog from './LinkDialog.vue'
import Modal from '@/components/Modal.vue'
import ChartModelBox from '@/views/Editor/Toolbar/ElementStylePanel/ChartStylePanel/ChartModelBox.vue'
import useCommonOperate from './hooks/useCommonOperate'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const mainStore = useMainStore()
const {
  activeElementIdList,
  activeGroupElementId,
  handleElementId,
  hiddenElementIdList,
  editorAreaFocus,
  gridLineSize,
  showRuler,
  creatingElement,
  creatingCustomShape,
  canvasScale,
  textFormatPainter,
  toolbarData,
  viewTemlpate,
  createLoading,
  presentation,
  showBoxHover,
  showElementHover,
} = storeToRefs(mainStore)

const { currentSlide, slides, slideIndex } = storeToRefs(useSlidesStore())
const { ctrlKeyState, spaceKeyState } = storeToRefs(useKeyboardStore())

const scaleWidth = computed(() => showElementHover.value.style.width)
const scaleHeight = computed(() => showElementHover.value.style.height)
const { borderLines } = useCommonOperate(scaleWidth, scaleHeight)

const boxStyle = computed(() => {
  const w = presentation.value?.width || 960
  const h = presentation.value?.height || 540
  return {
    width: `${w}px`,
    height: `${h}px`,
    borderRadius: '10px',
  }
})

const viewportRef = ref<HTMLElement>()
const alignmentLines = ref<AlignmentLineProps[]>([])

const linkDialogVisible = ref(false)
const openLinkDialog = () => (linkDialogVisible.value = true)

watch(handleElementId, () => {
  mainStore.setActiveGroupElementId('')
})

const viewSlide = computed(() => {
  return viewTemlpate.value?.data
})

const handleCloseBeautify = () => {
  const modelBox = document.querySelectorAll('.modal.drageModal')
  if (modelBox) {
    modelBox.forEach((item: any) => {
      item.style.display = 'block'
      item.style.opacity = '1'
    })
  }

  mainStore.setShowCarpSlide({ show: false, isAllSlide: false })
  setTimeout(() => {
    mainStore.updateViewTemplate({ show: false, data: null })
  }, 200)
  //
}

const elementList = ref<PPTElement[]>([])
const setLocalElementList = () => {
  elementList.value = currentSlide.value
    ? JSON.parse(JSON.stringify(currentSlide.value.elements))
    : []
}
watchEffect(setLocalElementList)

const canvasRef = ref<HTMLElement>()
const { dragViewport, viewportStyles } = useViewportSize(canvasRef)

useDropImageOrText(canvasRef)

const {
  mouseSelection,
  mouseSelectionVisible,
  mouseSelectionQuadrant,
  updateMouseSelection,
} = useMouseSelection(elementList, viewportRef)

const { dragElement } = useDragElement(elementList, alignmentLines, canvasScale)
const { dragLineElement } = useDragLineElement(elementList)
const { selectElement } = useSelectAndMoveElement(elementList, dragElement)
const { scaleElement, scaleMultiElement } = useScaleElement(
  elementList,
  alignmentLines,
  canvasScale
)
const { rotateElement } = useRotateElement(
  elementList,
  viewportRef,
  canvasScale
)
const { moveShapeKeypoint } = useMoveShapeKeypoint(elementList, canvasScale)

const { selectAllElements } = useSelectElement()
const { deleteAllElements } = useDeleteElement()
const { pasteElement } = useCopyAndPasteElement()
const { enterScreeningFromStart } = useScreening()
const { updateSlideIndex } = useSlideHandler()
const { createTextElement, createShapeElement } = useCreateElement()

// 组件渲染时，如果存在元素焦点，需要清除
// 这种情况存在于：有焦点元素的情况下进入了放映模式，再退出时，需要清除原先的焦点（因为可能已经切换了页面）
onMounted(() => {
  if (activeElementIdList.value.length) {
    nextTick(() => mainStore.setActiveElementIdList([]))
  }
})

// 点击画布的空白区域：清空焦点元素、设置画布焦点、清除文字选区、清空格式刷状态
const handleClickBlankArea = (e: any) => {
  mainStore.setCreateLoading({
    showNote: false,
    showRemark: null,
    height: 66,
  })

  if (e.target?.closest('.operate-bar')) return
  if (toolbarData.value.type !== 'chat') {
    mainStore.setOpenNoTokenToobal(false)
    mainStore.setShowToolbar(false)
  }

  if (activeElementIdList.value.length) mainStore.setActiveElementIdList([])
  if (!spaceKeyState.value) updateMouseSelection(e)
  else dragViewport(e)
  if (!editorAreaFocus.value) mainStore.setEditorareaFocus(true)
  if (textFormatPainter.value) mainStore.setTextFormatPainter(null)
  removeAllRanges()
}

// 双击空白处插入文本
const handleDblClick = (e: MouseEvent) => {
  if (
    activeElementIdList.value.length ||
    creatingElement.value ||
    creatingCustomShape.value
  ) {
    return
  }
  if (!viewportRef.value) return

  const viewportRect = viewportRef.value.getBoundingClientRect()
  const left = (e.pageX - viewportRect.x) / canvasScale.value
  const top = (e.pageY - viewportRect.y) / canvasScale.value

  createTextElement({
    left,
    top,
    width: 200 / canvasScale.value, // 除以 canvasScale 是为了与点击选区创建的形式保持相同的宽度
    height: 40,
  })
}

// 画布注销时清空格式刷状态
onUnmounted(() => {
  if (textFormatPainter.value) mainStore.setTextFormatPainter(null)
})

// 移除画布编辑区域焦点
const removeEditorAreaFocus = () => {
  if (editorAreaFocus.value) mainStore.setEditorareaFocus(false)
}

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

// 开关标尺
const toggleRuler = () => {
  mainStore.setRulerState(!showRuler.value)
}

const BackgroundSet = () => {
  mainStore.setShowToolbar(true)
  mainStore.setToolbarData({
    showEmpty: false,
    type: 'background',
    useact: 'update',
    x: 0,
    y: 0,
    contentStyle: { right: '100rem', left: 'auto' },
  })
}

// 在鼠标绘制的范围插入元素
const { insertElementFromCreateSelection, formatCreateSelection } =
  useInsertFromCreateSelection(viewportRef)

// 插入自定义任意多边形
const insertCustomShape = (data: CreateCustomShapeData) => {
  const { start, end, path, viewBox } = data
  const position = formatCreateSelection({ start, end })
  if (position) {
    const supplement: Partial<PPTShapeElement> = {}
    if (data.fill) supplement.fill = data.fill
    if (data.outline) supplement.outline = data.outline
    createShapeElement(position, { path, viewBox }, supplement)
  }

  mainStore.setCreatingCustomShapeState(false)
}

// 打开选择面板
const toggleSelectPanel = () => {
  mainStore.setShowToolbar(true)
  mainStore.setToolbarData({
    showEmpty: false,
    type: 'layer',
    useact: 'add',
    x: 0,
    y: 0,
    contentStyle: { right: '100rem', left: 'auto' },
  })
}

const contextmenus = (): ContextmenuItem[] => {
  return [
    {
      text: t('canvas.pasteElement'),
      subText: 'Ctrl + V',
      handler: pasteElement,
    },
    {
      text: t('canvas.selectAllElements'),
      subText: 'Ctrl + A',
      handler: selectAllElements,
    },
    {
      text: t('canvas.toggleRuler'),
      subText: showRuler.value ? '√' : '',
      handler: toggleRuler,
    },
    {
      text: t('canvas.setGridLineSize'),
      handler: () => mainStore.setGridLineSize(gridLineSize.value ? 0 : 50),
      children: [
        {
          text: t('canvas.none'),
          subText: gridLineSize.value === 0 ? '√' : '',
          handler: () => mainStore.setGridLineSize(0),
        },
        {
          text: t('canvas.small'),
          subText: gridLineSize.value === 25 ? '√' : '',
          handler: () => mainStore.setGridLineSize(25),
        },
        {
          text: t('canvas.middle'),
          subText: gridLineSize.value === 50 ? '√' : '',
          handler: () => mainStore.setGridLineSize(50),
        },
        {
          text: t('canvas.large'),
          subText: gridLineSize.value === 100 ? '√' : '',
          handler: () => mainStore.setGridLineSize(100),
        },
      ],
    },
    {
      text: t('canvas.deleteAllElements'),
      handler: deleteAllElements,
    },
    {
      text: t('canvas.toggleSelectPanel'),
      handler: toggleSelectPanel,
    },
    { divider: true },
    {
      text: t('canvas.BackgroundSet'),
      handler: BackgroundSet,
    },
    {
      text: t('canvas.enterScreeningFromStart'),
      subText: 'F5',
      handler: enterScreeningFromStart,
    },
  ]
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
  view-transition-name: example-element;
}

.hover-element-box {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 2;
  .box-line {
    position: absolute;
    border: 2px solid;
    border-image: linear-gradient(270deg, #6040fc 15%, #e750e6 100%) 2;
    &.right {
      right: -2px;
    }
  }
}
.canvas-hover-box {
  position: absolute;
  border-radius: 10px;
  background: none;
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 10px;
    padding: 3px;
    background: linear-gradient(270deg, #6040fc 15%, #e750e6 100%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
}

.viewport {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  overflow: hidden;
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
