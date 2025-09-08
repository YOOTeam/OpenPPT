<template>
  <div class="mobile-thumbnails">
    <Draggable
      class="catalog-list"
      :modelValue="slides"
      :animation="200"
      :scroll="true"
      :scrollSensitivity="50"
      :delayOnTouchOnly="true"
      :delay="800"
      itemKey="id"
      @end="handleDragEnd"
    >
      <template #item="{ element, index }">
        <div
          :id="`slide-bar-${element.id}`"
          class="catalog-item"
          :class="{ active: slideIndex === index }"
          @click.stop="changeSlideIndex(index, element.id)"
        >
          <div class="catalog-item-content" @click="handleClick(index)">
            <div class="order-number">{{ index + 1 }}</div>
            <ThumbnailSlide
              class="thumbnail"
              :slide="element"
              :size="120"
              :visible="index < slidesLoadLimit"
            />
            <div
              class="operate-box"
              v-if="showBtnFlage && slideIndex === index && !isAllDisableEdit"
            >
              <div class="menu-item" @click="copyAndPasteSlide()">
                <IconCopy class="icon" /> <span> 复制</span>
              </div>
              <div class="menu-item" @click="deleteSlide()">
                <IconDelete class="icon" /> <span> 删除 </span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </Draggable>
  </div>
</template>

<script lang="ts" setup>
import { watch, ref, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore, useMainStore } from '@/store'
import useLoadSlides from '@/hooks/useLoadSlides'
import useSlideHandler from '@/hooks/useSlideHandler'
import Draggable from 'vuedraggable'
import ThumbnailSlide from '@/views/components/ThumbnailSlide/index.vue'

defineProps<{
  showOperate?: boolean
  showBtn?: boolean
}>()

const showBtnFlage = ref(false)
const slidesStore = useSlidesStore()
const { slides, slideIndex } = storeToRefs(slidesStore)
const mainStore = useMainStore()
const { isAllDisableEdit } = storeToRefs(mainStore)
const { sortSlides, copyAndPasteSlide, deleteSlide } = useSlideHandler()

const { slidesLoadLimit } = useLoadSlides()
const changeSlideIndex = (index: number, id?: any) => {
  slidesStore.updateSlideIndex(index)
  slidesStore.setMobildSlideClick(id)
}

const handleClick = (index: number) => {
  if (slideIndex.value !== index) {
    showBtnFlage.value = false
    return
  }
  showBtnFlage.value = !showBtnFlage.value
}
const handleViewShow = (value: number) => {
  if (!slides.value?.length || value < 0) return
  const data = slides.value[value]
  nextTick(() => {
    const dom = document.getElementById(`slide-bar-${data?.id}`)

    if (dom) {
      dom.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      })
    }
  })
}
watch(
  () => slideIndex.value,
  (value) => {
    handleViewShow(value)
  },
  {
    immediate: true,
    deep: true,
  }
)
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
</script>

<style lang="scss" scoped>
.mobile-thumbnails {
  padding: 10rem 0;
  white-space: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
}
.catalog-item {
  position: relative;
  display: inline-block;
  border: 1rem solid #aaa;
  border-radius: 10rem;
  opacity: 0.4;
  .catalog-item-content {
    width: 100%;
    height: 100%;
    position: relative;
    border-radius: 11rem;
    overflow: hidden;
  }

  & + .catalog-item {
    margin-left: 10rem;
  }

  &.active {
    border-color: $themeColor;
    opacity: 1;

    .order-number {
      background-color: $themeColor;
    }
  }
  .operate-box {
    position: absolute;
    font-size: 12rem;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    white-space: nowrap;

    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 8rem 4rem;
    border-radius: 6rem;
    .menu-item {
      box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.2);
      background: #fff;
      padding: 6rem 8rem;
      margin: 0 4rem;
      font-size: 14rem;
      border-radius: 8rem;
      &:first-child {
        margin-left: 0;
      }
      &:last-child {
        margin-right: 0;
      }
    }
  }
  .order-number {
    min-width: 20rem;
    height: 14rem;
    line-height: 14rem;
    position: absolute;
    right: -1rem;
    bottom: -1rem;
    color: #fff;
    border-top-left-radius: 10rem;
    background-color: #aaa;
    z-index: 1;
    font-size: 12rem;
    text-align: center;
    padding: 0 5rem;
  }
}
.sortable-chosen {
  top: -5rem;
}

::-webkit-scrollbar {
  width: 0;
  height: 0;
}
</style>
