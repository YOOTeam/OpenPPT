<template>
  <div class="layout-content browseView">
    <div class="browseView-container" ref="slideView">
      <template v-if="slidesList?.length > 0">
        <div v-for="(slides, sectionIndex) in slidesList" :key="sectionIndex">
          <div v-if="slidesList?.length > 1" class="section-title">
            <IconTriangle
              theme="filled"
              class="icon-triangle"
              :class="slides[0].show === false ? 'close' : ''"
              @click="handleSectionClick(slides, sectionIndex)"
            />
            <span @click="handleSectionClick(slides, sectionIndex)">
              {{
                slides[0].sectionTag?.title
                  ? slides[0].sectionTag?.title
                  : sectionIndex === 0
                  ? t('catalog.sectionTag')
                  : t('catalog.nosectionTag')
              }}
            </span>
          </div>

          <div v-if="slides[0]?.show !== false" class="slide-list-content">
            <div
              class="slide-item"
              :id="'browse' + item.id"
              v-for="(item, index) in slides"
              :key="item.id"
              :class="{
                active: slideIndex === item.page,
                selected: selectedSlidesIndex.includes(item.page),
              }"
              @mousedown="
                ($event) => handleClickSlideThumbnail($event, item.page)
              "
              @touchstart="
                ($event) => handleClickSlideThumbnail($event, item.page)
              "
              @dblclick="viewHandleSlideClick(item.page)"
              v-contextmenu="contextmenusThumbnailItem"
            >
              <ThumbnailSlide
                :slide="item"
                :index="index"
                :size="size"
                class="slide-item-content"
              />
              <div class="page-num">
                {{ item.page + 1 > 9 ? item.page + 1 : '0' + (item.page + 1) }}
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { watch, onUnmounted, ref, onMounted, nextTick, computed } from 'vue'
import { storeToRefs } from 'pinia'
import useSlideHandler from '@/hooks/useSlideHandler'
import {
  useSlidesStore,
  useScreenStore,
  useMainStore,
  useKeyboardStore,
} from '@/store'
import ThumbnailSlide from '@/views/components/ThumbnailSlide/index.vue'
import { useViewTransition } from '@/hooks/useViewTransitionAPI'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const mainStore = useMainStore()
const screenStore = useScreenStore()
const slidesStore = useSlidesStore()
const keyboardStore = useKeyboardStore()
const { ctrlKeyState, shiftKeyState } = storeToRefs(keyboardStore)
const { rem } = storeToRefs(screenStore)
const { slides, pptViewData, slideIndex } = storeToRefs(slidesStore)
const { selectedSlidesIndex: _selectedSlidesIndex } = storeToRefs(mainStore)
const size = ref(350)
const slideView = ref(null)
const slidesList = ref([])
const {
  copySlide,
  pasteSlide,
  createSlide,
  copyAndPasteSlide,
  deleteSlide,
  cutSlide,
  selectAllSlide,
} = useSlideHandler()
const isInit = ref(false)
watch(
  () => pptViewData.value,
  (newVal, oldVal) => {
    if (!isInit.value && newVal !== oldVal) {
      resize()
    }
    // 因为onMounted 执行resize 导致pptViewData数据发生变化 导致执行2遍
    if (isInit.value) {
      isInit.value = false
    }
  },
  { deep: true, flush: 'post' }
)

watch(
  () => slides.value,
  () => {
    initList()
  },
  { deep: true }
)
const resize = () => {
  nextTick(() => {
    if (slideView.value) {
      const w = slideView.value.clientWidth
      const baseW = w - 20 * 2 * rem.value

      if (!pptViewData.value?.browseSize) {
        size.value = parseInt(baseW / 5 - 10 * rem.value * 2)
        slidesStore.updataPPTViewData({
          browseSize: size.value,
          browsePoint: '100%',
          onLineNum: 5,
        })
      } else {
        size.value =
          (parseInt(baseW / pptViewData.value.onLineNum - 10 * rem.value * 2) *
            parseInt(pptViewData.value.browsePoint)) /
          100
      }
    }
  })
}
const selectedSlidesIndex = computed(() => [
  ..._selectedSlidesIndex.value,
  slideIndex.value,
])
// 点击缩略图
const handleClickSlideThumbnail = (e: MouseEvent, index: number) => {
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

// 切换页面
const changeSlideIndex = (index: number) => {
  mainStore.setActiveElementIdList([])

  if (slideIndex.value === index) return
  slidesStore.updateSlideIndex(index)
}
const viewHandleSlideClick = useViewTransition((index: any) => {
  handleSlideClick(index)
})

const handleSlideClick = (index: number) => {
  slidesStore.updateSlideIndex(index)
  slidesStore.updataPPTViewData({ type: 'default' })
}

const handleSectionClick = (section: any, index: number) => {
  if (section[0].show || section[0].show === undefined) {
    section[0].show = false
  } else {
    section[0].show = true
  }
}

const initList = () => {
  const list = JSON.parse(JSON.stringify(slides.value))
  const hasSection = list.some((item) => item.sectionTag)
  if (hasSection) {
    const result = list.reduce((acc, obj, index) => {
      obj.page = index
      if ('sectionTag' in obj) {
        obj.show = true
        acc.push([obj])
      } else {
        if (acc.length === 0) {
          acc.push([])
        }
        acc[acc.length - 1].push(obj)
      }
      return acc
    }, [])
    slidesList.value = result
  } else {
    let list = JSON.parse(JSON.stringify(slides.value))
    list = list.map((item, index) => {
      item.page = index
      return item
    })
    slidesList.value.push(list)
  }
}

onMounted(() => {
  initList()
  resize()
  isInit.value = true
  window.addEventListener('resize', resize)
  nextTick(() => {
    setTimeout(() => {
      const element = document.getElementById(
        `browse${slides.value[slideIndex.value].id}`
      )
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'center',
        })
      }
    }, 300)
  })
})
onUnmounted(() => {
  window.removeEventListener('resize', resize)
})

const contextmenusThumbnailItem = (): any => {
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
  ]
}
</script>
<style lang="scss" scoped>
.browseView {
  padding: 20rem 10rem 80rem;
  overflow: hidden;
  .browseView-container {
    width: 100%;
    overflow-x: auto;
    padding: 0 20rem;
    .section-title {
      color: #1a1a1a;
      font-weight: bold;
      display: flex;
      align-items: center;
      height: 30rem;

      span,
      .icon-triangle {
        cursor: pointer;

        &:hover {
          color: #565555;
        }
        &:active {
          color: #aaa;
        }
      }

      &:hover {
        color: #343333;
      }
    }

    .icon-triangle {
      transform: rotate(180deg);
      font-size: 10rem;
      margin-right: 5rem;
      cursor: pointer;
      transition: transform 0.3s;
    }

    .close {
      transform: rotate(90deg);
    }

    .slide-item {
      display: inline-block;
      margin: 10rem;
      cursor: pointer;

      .slide-item-content {
        border-radius: 10rem;
        overflow: hidden;
        margin-bottom: 10rem;
        box-shadow: 0px 0px 26px 0px rgba(0, 0, 0, 0.06);
        &:hover {
          outline: 4rem solid $themeColor;
        }
      }

      .page-item {
        color: #1a1a1a;
      }

      &.active {
        view-transition-name: example-element;
        .slide-item-content {
          outline: 4rem solid $themeColor;
        }
      }

      &.selected {
        .slide-item-content {
          outline: 4rem solid $themeColor;
        }
      }
    }
  }
}
</style>
