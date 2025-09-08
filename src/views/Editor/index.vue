<template>
  <div
    class="online-editor"
    ref="onlineEditorRef"
    id="editorDomWaterMark"
    @mousemove="($event) => handleMousemoveCanvas($event)"
    :class="[
      viewTemlpate?.show === true ? 'deepViewModleShow' : '',
      viewTemlpate?.show && viewTemlpate?.type === 'allView'
        ? 'allViewDeep'
        : '',
    ]"
    :style="{
      background: isViewHoverBg ? isViewHoverBg : resourcesData?.main_color,
    }"
  >
    <div
      class="bg-view"
      :class="viewBg"
      v-if="pptViewData.type !== 'default'"
    ></div>
    <EditorHeader class="layout-header" />
    <PPTView />
    <ViewSet />
  </div>

  <!-- 查询弹窗 -->
  <SearchPanel v-if="showSearchPanel" />
  <!-- 笔记 弹窗 -->
  <NotesPanel v-if="showNotesPanel" />
  <!-- 菜单 弹窗  -->
  <DialogPool v-if="showToolbar" />
  <!-- 初始化loading -->
  <LoadingMarks v-if="showLoadingMarks" />
  <!-- 全文美化 -->
  <BeautifyPage v-if="showBeautifyPage" />
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import EditorHeader from './EditorHeader/index.vue'
import PPTView from './PPTView/index.vue'
import SearchPanel from './SearchPanel.vue'
import NotesPanel from './NotesPanel.vue'
import DialogPool from './RightToobar/DialogPool.vue'
import ViewSet from './RightToobar/ViewSet.vue'
import BeautifyPage from '@/views/components/BeautifyPage/index.vue'
import LoadingMarks from '@/views/components/element/LoadingMarks.vue'

import { useI18n } from 'vue-i18n'
const { t } = useI18n()
import $ from 'jquery'
const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const {
  showToolbar,
  showSearchPanel,
  showNotesPanel,
  showLoadingMarks,
  showBeautifyPage,
  isViewHoverBg,
  viewTemlpate,
  createLoading,
  canvasScale,
  handleElementId,
} = storeToRefs(mainStore)

const { resourcesData, currentSlide, pptViewData } = storeToRefs(slidesStore)
const remarkHeight = ref(66)

const showActiveRemark = ref(false)

const clickSource = ref('null')
watch(
  () => createLoading.value?.showRemark,
  () => {
    if (createLoading.value?.height) {
      remarkHeight.value = createLoading.value?.height
    }
    if (createLoading.value?.showRemark === true) {
      if (!createLoading.value?.height) {
        remarkHeight.value = 300
      }
      showActiveRemark.value = true
    } else if (createLoading.value?.showRemark === false) {
      remarkHeight.value = 66
    } else {
      showActiveRemark.value = false
    }
  },
  {
    deep: true,
  }
)
watch(showToolbar, (value) => {
  if (value === false) {
    mainStore.updateViewTemplate({ show: false, data: null })
  }
})

const viewBg = computed(() => {
  let className = ''
  if (pptViewData.value.type === 'sourceView') {
    className = 'sourceViewBg'
  } else if (pptViewData.value.type === 'browseView') {
    className = 'browseViewBg'
  }
  return className
})
const getRotationAngle = (element: any) => {
  const style = window.getComputedStyle(element, null)
  const transform = style.getPropertyValue('transform')

  if (transform === 'none') {
    return 0
  }

  // 解析矩阵值 matrix(a, b, c, d, tx, ty)
  const values = transform.split('(')[1].split(')')[0].split(',')
  const a = parseFloat(values[0])
  const b = parseFloat(values[1])

  // 计算旋转角度（弧度）
  const angle = Math.atan2(b, a) * (180 / Math.PI)

  return angle < 0 ? angle + 360 : angle // 返回0-360度的值
}

const handleMousemoveCanvas = (e: any) => {
  if (e.target.closest('.ai-remark')) {
    clickSource.value = 'noteBtn'
  } else {
    clickSource.value = ''
  }
  if (
    e?.target?.tagName === 'DIV' &&
    e?.target?.className?.includes('viewport')
  ) {
    mainStore.setShowElementHover({ show: false })
    mainStore.setShowBoxHover(true)
  } else {
    if (e.target.closest('.editable-element')) {
      const dom = e.target.closest('.editable-element')
      const elementRect = dom.children[0].getBoundingClientRect()
      const rotateDom = $(dom).find('.rotate-wrapper')
      let rotate = 0
      let showHover = true
      let domID = dom?.getAttribute('id')
      if (domID) {
        domID = domID.replace('editable-element-', '')
        const hoverElement = currentSlide.value?.elements?.find(
          (item) => item.id === domID
        )
        if (hoverElement?.id === handleElementId.value) {
          showHover = false
        }
      }
      if (rotateDom?.length) {
        rotate = getRotationAngle(rotateDom[0])
      }
      if (showHover) {
        mainStore.setShowElementHover({
          show: true,
          style: {
            width: elementRect.width,
            height: elementRect.height,
            top:
              dom.children[0].style.top.replace('px', '') * canvasScale.value +
              'px',
            left:
              dom.children[0].style.left.replace('px', '') * canvasScale.value +
              'px',
            transform: `rotate(${rotate}deg)`,
            transformOrigin: `${elementRect.width / 2}px ${
              elementRect.height / 2
            }px`,
          },
        })
      } else {
        mainStore.setShowBoxHover(false)
      }
    } else if (
      e?.target?.tagName === 'DIV' &&
      e?.target?.className?.includes('hover-element-box')
    ) {
      mainStore.setShowBoxHover(false)
    } else {
      mainStore.setShowElementHover({
        show: false,
      })
    }
    mainStore.setShowBoxHover(false)
  }
}
</script>

<style lang="scss" scoped>
$height: 70rem;
$rightWidth: 92rem;
$leftWidth: 176rem;

.isActiveReamrk {
  .remark {
    background: #fff !important;
    border-radius: 10rem;
  }
}

.online-editor {
  height: 100%;
  background: rgba(157, 46, 255, 1);
  transition: background 0.5s ease;
  &::before {
    content: '';
    position: absolute;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.2);
  }
  .open-iframe {
    background-color: #fff;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: 1000;
  }
  .bg-view {
    position: absolute;
    left: 0;
    width: 100%;
    height: 100%;

    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }

  .browseViewBg {
    background-image: url('@/assets/image/bg2.png');
  }
}

.layout-header {
  position: relative;
  height: $height;
  z-index: 2;
}
</style>
<style lang="scss">
.layout-header {
  position: relative;
  z-index: 1;
}
.deepViewModleShow {
  .catalog-box::after,
  .editor-header::after,
  .viewPort-set::after,
  .layout-content::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    opacity: 0;
    animation: fadeIn 1s forwards;
  }
  .editor-header::after {
    background: rgba(0, 0, 0, 0.75);
  }

  .center-bottom {
    pointer-events: none;
  }
  .center-bottom::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: 222222;
  }
}

.allViewDeep {
  .center-right::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;

    opacity: 0;
    animation: fadeIn 1s forwards;
  }
  .operation-bar {
    background: rgba(0, 0, 0, 0.5);
    color: #615b5b;
  }
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}
.center-body::-webkit-scrollbar {
  width: 0;
  height: 0;
}
</style>
