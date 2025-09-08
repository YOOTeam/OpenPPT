<template>
  <drage-modal
    v-model:visible="showToolbar"
    :width="430"
    :contentStyle="toolbarData.contentStyle"
    :type="toolbarData.type"
    :className="`
      ${isEnglish ? 'english-style-width' : ''} ${toolbarData?.className}
      `"
    @closed="handleClose"
  >
    <template #title v-if="toolbarData.type === 'chat'">
      <span class="title"> AI Chat </span>
    </template>
    <template v-if="toolbarData.useact === 'add'">
      <!-- 排版/添加 -->
      <LayoutPool
        :showEmpty="toolbarData.showEmpty"
        v-if="toolbarData.type === 'layout' || toolbarData.type === 'addPage'"
        @select="(slide) => handleModelSet(slide)"
      />
      <!-- 插入文本框 -->
      <AddTextNode
        v-else-if="toolbarData.type === 'fontSet'"
        @createText="createText"
      />
      <!-- 图形 -->
      <ShapePool
        v-else-if="toolbarData.type === 'shap'"
        @select="(shape) => drawShape(shape)"
        @selectCustome="drawCustomShape"
        @selectLine="(line) => drawLine(line)"
      />

      <!-- 图片 -->
      <ImagePool v-else-if="toolbarData.type === 'image'" />
      <!-- 动画 -->
      <AnimatePool v-else-if="toolbarData.type === 'animate'" />
      <!-- 表格 -->
      <TableGenerator
        v-else-if="toolbarData.type === 'table'"
        @insert="
          ({ row, col }) => {
            createTableElement(row, col)
          }
        "
      />
      <!-- 图表 -->
      <ChartPool
        v-else-if="toolbarData.type === 'chart'"
        @select="
          (chart) => {
            createChartElement(chart)
          }
        "
      />
      <!-- 媒体 -->
      <MediaInput
        v-else-if="toolbarData.type === 'media'"
        @insertVideo="
          (src) => {
            createVideoElement(src)
          }
        "
        @insertAudio="
          (src) => {
            createAudioElement(src)
          }
        "
      />
      <!-- 公式 -->
      <LaTeXEditor
        v-else-if="toolbarData.type === 'latex'"
        @update="
          (data) => {
            createLatexElement(data)
          }
        "
      />

      <!-- 主题设置 -->
      <ThemeStyleSet v-else-if="toolbarData.type === 'themeStyle'" />

      <ChatBox v-else-if="toolbarData.type === 'chat'" />

      <SelectPanel v-else-if="toolbarData.type === 'layer'" />
      <CreateInteractivePool v-else-if="toolbarData.type === 'interactive'" />

      <div class="drage-content" v-else></div>
    </template>
    <template v-else>
      <!-- 文本样式 -->
      <BarTextNodeStyle v-if="toolbarData.type === 'text'" />
      <BarShapeNodeStyle v-if="toolbarData.type === 'shape'" />
      <BarImageNodeStyle v-if="toolbarData.type === 'image'" />
      <BarTableNodeStyle v-if="toolbarData.type === 'table'" />
      <BarChartNodeStyle v-if="toolbarData.type === 'chart'" />
      <BarLatexNodeStyle v-if="toolbarData.type === 'latex'" />
      <BarAudoNodeStyle v-if="toolbarData.type === 'audio'" />
      <BarLineNodeStyle v-if="toolbarData.type === 'line'" />
      <BarVideoNodeStyle v-if="toolbarData.type === 'video'" />
      <BarMultiSelect v-if="toolbarData.type === 'multi'" />
      <BackgroundStyle v-if="toolbarData.type === 'background'" />
      <!-- 历史版本 -->

      <BarIframeNodeStyle v-if="toolbarData.type === 'iframe'" />
    </template>
  </drage-modal>
</template>
<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import useSlideHandler from '@/hooks/useSlideHandler'
import LayoutPool from './LayoutPool.vue'
import AddTextNode from './AddTextNode.vue'
import ShapePool from './ShapePool.vue'
import ImagePool from './ImagePool.vue'
import AnimatePool from './AnimatePool.vue'
import ChartPool from './ChartPool.vue'
import TableGenerator from './TableGenerator.vue'
import MediaInput from './MediaInput.vue'
import LaTeXEditor from '@/components/LaTeXEditor/index.vue'
import DrageModal from '@/components/DrageModal.vue'
import type { ShapePoolItem } from '@/configs/shapes'
import type { LinePoolItem } from '@/configs/lines'
import useCreateElement from '@/hooks/useCreateElement'
import ChatBox from '@/components/Chat/index.vue'
import BarTextNodeStyle from './BarTextNodeStyle.vue'
import BarShapeNodeStyle from './BarShapeNodeStyle.vue'
import BarImageNodeStyle from './BarImageNodeStyle.vue'
import BarTableNodeStyle from './BarTableNodeStyle.vue'
import BarChartNodeStyle from './BarChartNodeStyle.vue'
import BarLatexNodeStyle from './BarLatexNodeStyle.vue'
import BarAudoNodeStyle from './BarAudoNodeStyle.vue'
import BarLineNodeStyle from './BarLineNodeStyle.vue'
import BarVideoNodeStyle from './BarVideoNodeStyle.vue'
import BarMultiSelect from './BarMultiSelect.vue'
import BarIframeNodeStyle from './BarIframeNodeStyle.vue'
import BackgroundStyle from './BackgroundStyle.vue'

import ThemeStyleSet from './ThemeStyleSet.vue'

import CreateInteractivePool from './CreateInteractivePool.vue'

import SelectPanel from './SelectPanel.vue'
import $ from 'jquery'
import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n()
const isEnglish = computed(() => {
  return locale.value === 'en-US'
})

const show = ref(true)
const mainStore = useMainStore()

const { toolbarData, showToolbar } = storeToRefs(mainStore)

const {
  createChartElement,
  createTableElement,
  createLatexElement,
  createVideoElement,
  createAudioElement,
} = useCreateElement()
const active = ref<any>('')
const { createSlideByTemplate } = useSlideHandler()

const handleModelSet = (slide) => {
  createSlideByTemplate(slide)
  mainStore.setSelectPanelState(false)
  if (toolbarData.value.type === 'addPage') {
    mainStore.setOpenNoTokenToobal(false)
    mainStore.setShowToolbar(false)
  }
}

// 绘制文字范围
const createText = (data) => {
  let vertical = false
  if (data.vertical === 'vertical') {
    vertical = true
  }
  let content = ''
  switch (data.type) {
    case 'H1':
      content = `<p><strong><span style=\'font-size:  73px\'>${t(
        'canvas.titleText'
      )}</span></strong></p>`
      break
    case 'H2':
      content = `<p><strong><span style=\'font-size:  24px\'>${t(
        'canvas.subtitleText'
      )}</span></strong></p>`
      break
    case 'T1':
      content = `<p><span style=\'font-size:  16px\'>${t(
        'canvas.contentText'
      )}</span></p>`
      break
    case 'T2':
      content = `<p><span style=\'font-size:  12px\'>${t(
        'canvas.t2'
      )}</span></p>`
      break
    default:
      break
  }

  mainStore.setCreatingElement({
    type: 'text',
    vertical,
    content: content,
  })
}

// 绘制形状范围
const drawShape = (shape: ShapePoolItem) => {
  mainStore.setCreatingElement({
    type: 'shape',
    data: shape,
  })
}
const handleClose = (event?: any) => {
  if (event) {
    mainStore.setOpenNoTokenToobal(false)
    mainStore.setShowToolbar(false)
  }
}
// 绘制自定义任意多边形
const drawCustomShape = () => {
  mainStore.setCreatingCustomShapeState(true)
}

// 绘制线条路径
const drawLine = (line: LinePoolItem) => {
  mainStore.setCreatingElement({
    type: 'line',
    data: line,
  })
}

watch(toolbarData.value, (value) => {
  if (!value.showModal) {
    active.value = ''
  }
})
</script>
<style lang="scss" scoped>
.drage-content {
  @include drage-modal-layout();
}

.english-style-width {
  .node-style-box {
    width: 380rem;
  }
}
</style>
<style lang="scss">
.drageModal.chat {
  .modal-header {
    width: 100%;
    height: 60rem;
    cursor: move;
    position: relative;
    background: linear-gradient(90deg, #6040fc 50%, #e750e6 100%);

    .title {
      position: absolute;
      top: 16rem;
      left: 16rem;
      font-size: 16rem;
      font-weight: bold;
      font-style: italic; // 增加字体倾斜
      line-height: normal;
      letter-spacing: 0em;
      color: #ffffff;
    }
    .line {
      opacity: 0;
    }
    .close-btn {
      color: #fff;
    }
  }
}
</style>
