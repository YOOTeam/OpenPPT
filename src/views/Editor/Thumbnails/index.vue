<template>
  <div
    class="catalog"
    @mousedown="() => setThumbnailsFocus(true)"
    v-click-outside="() => setThumbnailsFocus(false)"
    v-contextmenu="isAllDisableEdit ? [] : contextmenusThumbnails"
  >
    <div class="catalog-box">
      <div class="catalog-icon">
        <span
          :class="[catalogType === 'title' ? 'active' : '', 'title']"
          style="color: #b5b5b5 !important; cursor: default"
          >{{ $t('catalog.titleTab1') }}
          <IconUpOne theme="filled" class="icon" />
        </span>
        <span :class="[catalogType === 'image' ? 'active' : '', 'title']"
          >{{ $t('catalog.titleTab2') }}
          <IconUpOne theme="filled" class="icon" />
        </span>
        <!-- <IconViewList
          class="icon"
        />
        <IconPage
          class="icon"
         
        />/> -->
      </div>
      <Draggable
        class="catalog-list"
        :style="{ maxHeight: maxHeight }"
        ref="thumbnailsRef"
        :modelValue="slides"
        :animation="200"
        :scroll="true"
        :scrollSensitivity="50"
        :disabled="editingSectionId || isAllDisableEdit"
        @end="handleDragEnd"
        itemKey="id"
      >
        <template #item="{ element, index }">
          <div class="catalog-container">
            <div
              class="section-title"
              :data-section-id="element?.sectionTag?.id || ''"
              v-if="element.sectionTag || (hasSection && index === 0)"
              v-contextmenu="contextmenusSection"
            >
              <input
                :id="`section-title-input-${
                  element?.sectionTag?.id || 'default'
                }`"
                type="text"
                :value="element?.sectionTag?.title || ''"
                :placeholder="t('catalog.placeholder')"
                @blur="($event) => saveSection($event)"
                @keydown.enter.stop="($event) => saveSection($event)"
                v-if="
                  editingSectionId === element?.sectionTag?.id ||
                  (index === 0 && editingSectionId === 'default')
                "
              />
              <span class="text" v-else>
                <div class="text-content">
                  {{
                    element?.sectionTag
                      ? element?.sectionTag?.title || t('catalog.nosectionTag')
                      : t('catalog.sectionTag')
                  }}
                </div>
              </span>
            </div>
            <div
              class="catalog-item"
              :class="{
                active: slideIndex === index,
                selected: selectedSlidesIndex.includes(index),
              }"
              @mousedown="($event) => handleClickSlideThumbnail($event, index)"
              @touchstart="($event) => handleClickSlideThumbnail($event, index)"
              @dblclick="dbClickZoom()"
              v-contextmenu="isAllDisableEdit ? [] : contextmenusThumbnailItem"
            >
              <icon-caret-right class="caret-right" />
              <!-- <div class="label" :class="{ 'offset-left': index >= 99 }">
              {{ fillDigit(index + 1, 2) }}
            </div> -->
              <ThumbnailSlide
                class="section"
                :slide="element"
                :size="120 * rem"
                :visible="index < slidesLoadLimit"
              />

              <div
                class="note-flag"
                v-if="element.notes && element.notes.length"
                @click="openNotesPanel()"
              >
                {{ element.notes.length }}
              </div>
            </div>
          </div>
        </template>
      </Draggable>

      <div class="page-number">
        {{ slideIndex + 1 < 10 ? `0${slideIndex + 1}` : slideIndex + 1 }} /
        {{ slides?.length < 10 ? `0${slides?.length}` : slides?.length
        }}{{ $t('catalog.page') }}
      </div>
      <div class="catalog-add" @click="handleAddPage" v-if="!isAllDisableEdit">
        <IconPlus class="icon" />{{ $t('catalog.addPPT') }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, watch, onMounted } from 'vue'
import { IconCaretRight } from '@arco-design/web-vue/es/icon'
import { storeToRefs } from 'pinia'
import {
  useMainStore,
  useSlidesStore,
  useScreenStore,
  useKeyboardStore,
} from '@/store'
import { returnRem } from '@/utils/common'
import { isElementInViewport } from '@/utils/element'
import type { ContextmenuItem } from '@/components/Contextmenu/types'
import useSlideHandler from '@/hooks/useSlideHandler'
import useSectionHandler from '@/hooks/useSectionHandler'
import useScreening from '@/hooks/useScreening'
import useLoadSlides from '@/hooks/useLoadSlides'
import ThumbnailSlide from '@/views/components/ThumbnailSlide/index.vue'
import useAnimmation from '@/views/Screen/hooks/useAnimmation'
import Draggable from 'vuedraggable'
import { useI18n } from 'vue-i18n'
import { set } from 'lodash'
const { t } = useI18n()

const { rem } = storeToRefs(useScreenStore())
const maxHeight = ref('500rem')

const { addHoverClass, actionAnimationActive } = useAnimmation()
const setMaxHeight = () => {
  nextTick(() => {
    const h = 240 * returnRem()
    maxHeight.value = document.body.clientHeight - 70 * rem.value - h + 'px'
    if (parseInt(maxHeight.value) < document.body.clientHeight / 2) {
      maxHeight.value =
        document.body.clientHeight / 2 + document.body.clientHeight / 7 + 'px'
    }
  })
}

onMounted(() => {
  setMaxHeight()
  window.addEventListener('resize', setMaxHeight)
})

const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const keyboardStore = useKeyboardStore()
const {
  selectedSlidesIndex: _selectedSlidesIndex,
  thumbnailsFocus,
  isAllDisableEdit,
} = storeToRefs(mainStore)
const { slides, slideIndex, currentSlide, catalogType } =
  storeToRefs(slidesStore)
const { ctrlKeyState, shiftKeyState } = storeToRefs(keyboardStore)

const { slidesLoadLimit } = useLoadSlides()

const selectedSlidesIndex = computed(() => [
  ..._selectedSlidesIndex.value,
  slideIndex.value,
])

const handleAddPage = () => {
  mainStore.setToolbarData({
    showEmpty: true,
    type: 'addPage',
    useact: 'add',
    x: 0,
    y: 0,
    contentStyle: { right: 'auto', left: '190rem', bottom: '10rem' },
  })
  mainStore.setShowToolbar(true)
}
const dbClickZoom = () => {
  enterScreening()
  if (currentSlide.value?.actionList?.interactionType !== 'none') {
    mainStore.setActionAnimation(true)
    addHoverClass()
    actionAnimationActive()
  }
}
const hasSection = computed(() => {
  return slides.value.some((item) => item.sectionTag)
})

const {
  copySlide,
  pasteSlide,
  createSlide,
  copyAndPasteSlide,
  deleteSlide,
  cutSlide,
  selectAllSlide,
  sortSlides,
} = useSlideHandler()

const {
  createSection,
  removeSection,
  removeAllSection,
  removeSectionSlides,
  updateSectionTitle,
} = useSectionHandler()
const timer = ref(null)

// 页面被切换时
const thumbnailsRef = ref<InstanceType<typeof Draggable>>()
watch(
  () => slideIndex.value,
  () => {
    // 清除多选状态的幻灯片
    if (selectedSlidesIndex.value.length) {
      mainStore.updateSelectedSlidesIndex([])
    }

    // 检查当前页缩略图是否在可视范围，不在的话需要滚动到对应的位置
    nextTick(() => {
      const activeThumbnailRef: HTMLElement =
        thumbnailsRef.value?.$el?.querySelector('.catalog-item.active')
      if (
        thumbnailsRef.value &&
        activeThumbnailRef &&
        !isElementInViewport(activeThumbnailRef, thumbnailsRef.value.$el)
      ) {
        const container = document.querySelector('.catalog-list')
        const element = activeThumbnailRef
        if (element && container) {
          // 计算需要滚动的距离
          const scrollTop =
            element.offsetTop -
            container.offsetTop -
            container.clientHeight / 2 +
            element.clientHeight / 2

          container.scrollTo({
            top: scrollTop,
            behavior: 'smooth',
          })
        }
      }
    })
  }
)

// 切换页面
const changeSlideIndex = (index: number) => {
  mainStore.setActiveElementIdList([])

  if (slideIndex.value === index) return
  slidesStore.updateSlideIndex(index)
}

// 点击缩略图
const handleClickSlideThumbnail = (e: MouseEvent, index: number) => {
  if (editingSectionId.value) return

  const isMultiSelected = selectedSlidesIndex.value.length > 1

  if (
    isMultiSelected &&
    selectedSlidesIndex.value.includes(index) &&
    e.button !== 0
  ) {
    return
  }

  // 按住Ctrl键，点选幻灯片，再次点击已选中的页面则取消选中
  // 如果被取消选中的页面刚好是当前激活页面，则需要从其他被选中的页面中选择第一个作为当前激活页面
  if (ctrlKeyState.value) {
    if (slideIndex.value === index) {
      if (!isMultiSelected) return

      const newSelectedSlidesIndex = selectedSlidesIndex.value.filter(
        (item) => item !== index
      )
      mainStore.updateSelectedSlidesIndex(newSelectedSlidesIndex)
      changeSlideIndex(selectedSlidesIndex.value[0])
    } else {
      if (selectedSlidesIndex.value.includes(index)) {
        const newSelectedSlidesIndex = selectedSlidesIndex.value.filter(
          (item) => item !== index
        )
        mainStore.updateSelectedSlidesIndex(newSelectedSlidesIndex)
      } else {
        const newSelectedSlidesIndex = [...selectedSlidesIndex.value, index]
        mainStore.updateSelectedSlidesIndex(newSelectedSlidesIndex)
      }
    }
  }
  // 按住Shift键，选择范围内的全部幻灯片
  else if (shiftKeyState.value) {
    if (slideIndex.value === index && !isMultiSelected) return

    let minIndex = Math.min(...selectedSlidesIndex.value)
    let maxIndex = index

    if (index < minIndex) {
      maxIndex = Math.max(...selectedSlidesIndex.value)
      minIndex = index
    }

    const newSelectedSlidesIndex = []
    for (let i = minIndex; i <= maxIndex; i++) newSelectedSlidesIndex.push(i)
    mainStore.updateSelectedSlidesIndex(newSelectedSlidesIndex)
  }
  // 正常切换页面
  else {
    mainStore.updateSelectedSlidesIndex([])
    changeSlideIndex(index)
  }
}

// 设置缩略图工具栏聚焦状态（只有聚焦状态下，该部分的快捷键才能生效）
const setThumbnailsFocus = (focus: boolean) => {
  if (thumbnailsFocus.value === focus) return
  mainStore.setThumbnailsFocus(focus)

  if (!focus) mainStore.updateSelectedSlidesIndex([])
}

// 拖拽调整顺序后进行数据的同步
const handleDragEnd = (eventData: { newIndex: number; oldIndex: number }) => {
  const { newIndex, oldIndex } = eventData
  if (
    newIndex === undefined ||
    oldIndex === undefined ||
    newIndex === oldIndex
  ) {
    return
  }
  sortSlides(newIndex, oldIndex)
}

// 打开批注面板
const openNotesPanel = () => {
  mainStore.setNotesPanelState(true)
}

const editingSectionId = ref('')

const editSection = (id: string) => {
  mainStore.setDisableHotkeysState(true)
  editingSectionId.value = id || 'default'

  nextTick(() => {
    const inputRef = document.querySelector(
      `#section-title-input-${id || 'default'}`
    ) as HTMLInputElement
    inputRef.focus()
  })
}

const saveSection = (e: FocusEvent | KeyboardEvent) => {
  const title = (e.target as HTMLInputElement).value
  updateSectionTitle(editingSectionId.value, title)

  editingSectionId.value = ''
  mainStore.setDisableHotkeysState(false)
}

const contextmenusSection = (el: HTMLElement): ContextmenuItem[] => {
  const sectionId = el.dataset.sectionId!

  return [
    {
      text: t('catalog.deleteSlide'),
      handler: () => removeSection(sectionId),
    },
    {
      text: t('catalog.deleteslideAndPlay'),
      handler: () => {
        mainStore.setActiveElementIdList([])
        removeSectionSlides(sectionId)
      },
    },
    {
      text: t('catalog.deleteAllSlide'),
      handler: removeAllSection,
    },
    {
      text: t('catalog.editSection'),
      handler: () => editSection(sectionId),
    },
  ]
}

const { enterScreening, enterScreeningFromStart } = useScreening()

const contextmenusThumbnails = (): ContextmenuItem[] => {
  return [
    {
      text: t('catalog.paste'),
      subText: 'Ctrl + V',
      handler: pasteSlide,
    },
    {
      text: t('catalog.selectAll'),
      subText: 'Ctrl + A',
      handler: selectAllSlide,
    },
    {
      text: t('catalog.addEmpty'),
      subText: 'Enter',
      handler: createSlide,
    },
    {
      text: t('catalog.play'),
      subText: 'F5',
      handler: enterScreeningFromStart,
    },
  ]
}

const contextmenusThumbnailItem = (): ContextmenuItem[] => {
  return [
    {
      text: t('catalog.cup'),
      subText: 'Ctrl + X',
      handler: cutSlide,
    },
    {
      text: t('catalog.copy'),
      subText: 'Ctrl + C',
      handler: copySlide,
    },
    {
      text: t('catalog.paste'),
      subText: 'Ctrl + V',
      handler: pasteSlide,
    },
    {
      text: t('catalog.selectAll'),
      subText: 'Ctrl + A',
      handler: selectAllSlide,
    },
    { divider: true },
    {
      text: t('catalog.addEmpty'),
      subText: 'Enter',
      handler: createSlide,
    },
    {
      text: t('catalog.copyPage'),
      subText: 'Ctrl + D',
      handler: copyAndPasteSlide,
    },
    {
      text: t('catalog.deletePage'),
      subText: 'Delete',
      handler: () => deleteSlide(),
    },
    {
      text: t('catalog.addSlide'),
      handler: createSection,
      disable: !!currentSlide.value.sectionTag,
    },
    { divider: true },
    {
      text: t('catalog.playCurrent'),
      subText: 'Shift + F5',
      handler: enterScreening,
    },
  ]
}
</script>

<style lang="scss" scoped>
.catalog {
  padding-left: 16rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  user-select: none;
}

.catalog-box {
  padding-bottom: 20rem;
  border-radius: 10rem;
  background: rgba(0, 0, 0, 0.4);
}

.catalog-icon {
  display: flex;
  align-items: center;
  justify-content: center;

  .title {
    font-size: 14rem;
    color: #b5b5b5;
    padding: 20rem 10rem 0;
    cursor: pointer;
    font-weight: 800;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    &:hover {
      color: #fff;
    }

    &:active {
      color: #d9d6d6;
    }
  }

  .icon {
    font-size: 20rem;
    color: #fff;
    cursor: pointer;
    opacity: 0;
  }

  .active {
    color: #fff;

    .icon {
      opacity: 1;
    }
  }
}

.catalog-add {
  margin: 0 10rem;
  height: 40rem;
  font-size: 12rem;
  border: 1rem solid #fff;
  color: #fff;
  cursor: pointer;
  border-radius: 10rem;
  display: flex;
  justify-content: center;
  align-items: center;

  &:hover {
    background-color: $hoverbg;
    color: $themeColor;
  }

  .select-btn {
    width: 30rem;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;

    &:hover {
      background-color: $hoverbg;
    }
  }

  .icon {
    margin-right: 3rem;
    font-size: 14rem;
  }
}

.catalog-list {
  padding: 5rem 0;
  flex: 1;
  overflow: auto;
  &::-webkit-scrollbar-thumb {
    background-color: transparent;
    border-radius: 10rem;
  }
  &:hover {
    &::-webkit-scrollbar-thumb {
      background-color: #ffffff89;
      border-radius: 10rem;
      cursor: pointer;
    }
  }
}

.catalog-item {
  display: flex;
  align-items: center;
  padding: 5rem 0;
  position: relative;

  .section {
    position: relative;
    border-radius: 5px;
    margin-left: 5rem;
    cursor: pointer;

    &::after {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: rgba($color: #000000, $alpha: 0.6);
    }

    &:hover::after {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: rgba($color: #000000, $alpha: 0);
    }
  }

  &.active {
    .label {
      color: $themeColor;
    }
  }

  &.selected {
    .caret-right {
      opacity: 1;
    }

    .section {
      &::after {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        display: none;
        background: rgba($color: #000000, $alpha: 0.5);
      }
    }

    .note-flag {
      background-color: $themeColor;

      &::after {
        border-top-color: $themeColor;
      }
    }
  }

  .note-flag {
    width: 16rem;
    height: 12rem;
    border-radius: 1rem;
    position: absolute;
    left: 8rem;
    top: 14rem;
    font-size: 8rem;
    background-color: rgba($color: $themeColor, $alpha: 0.75);
    color: #fff;
    text-align: center;
    line-height: 12rem;
    cursor: pointer;

    &::after {
      content: '';
      width: 0;
      height: 0;
      position: absolute;
      top: 10rem;
      left: 4rem;
      border: 4rem solid transparent;
      border-top-color: rgba($color: $themeColor, $alpha: 0.75);
    }
  }
}

.caret-right {
  font-size: 20rem;
  color: #fff;
  opacity: 0;
  margin-left: -5rem;
}

.label {
  font-size: 12rem;
  color: #999;
  width: 20rem;
  cursor: grab;

  &.offset-left {
    position: relative;
    left: -4rem;
  }

  &:active {
    cursor: grabbing;
  }
}

.page-number {
  height: 40rem;
  font-size: 12rem;
  line-height: 40rem;
  text-align: center;
  color: #fff;
}

.section-title {
  height: 26rem;
  font-size: 12rem;
  padding: 6rem 8rem 2rem 18rem;
  color: #555;

  &.contextmenu-active {
    color: $themeColor;

    .text::before {
      border-bottom-color: $themeColor;
      border-right-color: $themeColor;
    }
  }

  .text {
    display: flex;
    align-items: center;
    position: relative;

    &::before {
      content: '';
      width: 0;
      height: 0;
      border-top: 3rem solid transparent;
      border-left: 3rem solid transparent;
      border-bottom: 3rem solid #fff;
      border-right: 3rem solid #fff;
      margin-right: 5rem;
    }

    .text-content {
      display: inline-block;
      @include ellipsis-oneline();
      color: #fff;
    }
  }

  input {
    width: 100%;
    border: 0;
    outline: 0;
    padding: 0;
    font-size: 12rem;
  }
}
</style>
