<template>
  <div class="Toobar">
    <div
      class="layout-btn"
      v-tooltip="t('toolbar.AILayout')"
      @click="handleClickBar($event, 'layout')"
      :class="
        showToolbar && toolbarData?.type === 'layout' ? 'layout-active' : ''
      "
    >
      <img v-if="returnImgSrc" src="@/assets/image/f-2.gif" alt="" />
      <img
        style="width: 50rem; height: auto"
        v-else
        src="@/assets/image/englishLayout.png"
        alt=""
        srcset=""
      />
    </div>
    <div class="operation-bar">
      <template v-for="(item, index) in barList" :key="index">
        <span
          class="operation-bar-item"
          v-tooltip="item.name"
          @click="handleClickBar($event, item.type)"
          :class="[active === item.type ? 'activeBtn' : '', item.type]"
        >
          <i
            class="iconfont icon"
            :class="[item.id]"
            :style="{ fontSize: item.fontSize || '26rem' }"
          ></i>
        </span>
        <div
          v-if="item.line === '0'"
          style="border: 1px solid #ddd; width: 50%"
        ></div>
      </template>
    </div>
    <div
      class="chatppt-btn"
      v-tooltip="t('toolbar.chatBtn')"
      @click="handleClickBar($event, 'chat')"
    >
      <img
        src="@/assets/image/chat-normal.png"
        class="normal-gif"
        alt=""
        srcset=""
      />
      <img class="hover-gif" src="@/assets/image/chat-hover.png" alt="" />
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, watch, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import message from '@/utils/message'
import { setBehaviors } from '@/api/userInfo'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const mainStore = useMainStore()
const slidesStore = useSlidesStore()

const { slides } = storeToRefs(slidesStore)
const { toolbarData, showToolbar, showBeautifyTips, selectedSlidesIndex } =
  storeToRefs(mainStore)
const returnImgSrc = computed(() => {
  return (
    !localStorage.getItem('lang') || localStorage.getItem('lang') === 'zh-CN'
  )
})
const barList = ref([
  {
    id: 'icon-wenben',
    name: t('toolbar.text'),
    type: 'fontSet',
    fontSize: '32rem',
  },
  { id: 'icon-xingzhuang', name: t('toolbar.shap'), type: 'shap', line: '1' },
  { id: 'icon-tupian', name: t('toolbar.image'), type: 'image', line: '1' },
  { id: 'icon-biaoge', name: t('toolbar.table'), type: 'table', line: '1' },
  { id: 'icon-tubiao', name: t('toolbar.chart'), type: 'chart', line: '1' },
  { id: 'icon-meiti', name: t('toolbar.media'), type: 'media', line: '1' },
  { id: 'icon-gongshi', name: t('toolbar.latex'), type: 'latex', line: '0' },
  {
    id: 'icon-donghua',
    name: t('toolbar.animation'),
    type: 'animate',
    line: '1',
  },
  {
    id: 'icon-chuangyijiaohu',
    name: t('toolbar.other'),
    type: 'interactive',
    line: '1',
  },
])

const modalData = ref({
  showEmpty: false,
  type: 'layout',
  useact: 'add',
  x: 0,
  y: 0,
  className: '',
  contentStyle: { right: '100rem', left: 'auto' },
})

const active = ref('')
const setUserBeauty = () => {
  if (showBeautifyTips.value.oldData) {
    mainStore.setShowBeautifyTips({ show: false })
    setBehaviors({ key: 'beautifyBtn', value: 1 }).then((res: any) => {
      if (res.code === 200) {
        mainStore.setShowBeautifyTips({ oldData: false, show: false })
      }
    })
  }
}

watch(
  () => selectedSlidesIndex.value,
  () => {
    getHistroyId()
  }
)

const getHistroyId = () => {
  const currentslide = slidesStore.slideIndex
  const slideId = slidesStore.slides[currentslide].id
  const elementsId = mainStore.activeElementIdList
  const multiId = [...new Set(selectedSlidesIndex.value)]
  // 获取所有幻灯片数据，假设从mainStore中获取
  const slides = slidesStore.slides
  const pptSelects = ref()
  // 生成ppt_selects数组，遍历multiId中的每个选中幻灯片索引
  if (multiId.length !== 0) {
    pptSelects.value = multiId.map((index) => {
      const slide = slides[index]
      // 判断是否为当前页面（假设slideId是当前页面ID）
      const isCurrent = slide.id === slideId

      return {
        slideId: slide.id,
        elements: elementsId,
        is_current: isCurrent,
        is_select: true,
      }
    })
  } else {
    pptSelects.value = [
      {
        slideId: slideId,
        elements: elementsId,
        is_current: true,
        is_select: true,
      },
    ]
  }

  mainStore.setChatInfo({
    toChatData: {
      ppt_id: mainStore.useFileId,
      ppt_selects: pptSelects,
    },
  })
}

const handleClickBar = async (event: any, type: string) => {
  if (type === 'layout') {
    mainStore.setToolbarData({
      showEmpty: false,
      type: type,
      useact: 'add',
      x: 0,
      y: 0,
      contentStyle: { right: '100rem', left: 'auto' },
      activeTab: 'singleThemePages',
    })
  }
  if (slides.value?.length === 0 && type !== 'chat') {
    message.info(t('layoutPool.addSlide'))
    return
  }
  if (type === 'layout') {
    setUserBeauty()
  }
  if (type === 'chat') {
    modalData.value.className = 'chat'
  } else {
    modalData.value.className = ''
  }

  modalData.value.x = event.clientX - 900
  modalData.value.y = document.body.clientHeight / 2 - 580 / 2

  if (toolbarData.value.type !== type) {
    showToolbar.value = true
  } else {
    showToolbar.value = !showToolbar.value
  }
  modalData.value.type = type
  active.value = type
  await getHistroyId()

  mainStore.setShowToolbar(showToolbar.value)
  mainStore.setToolbarData(modalData.value)
}

onMounted(() => {})
watch(showToolbar, (value) => {
  if (!value || toolbarData.value.useact !== 'add') {
    active.value = ''
  }
})
watch(
  toolbarData,
  (value) => {
    const bar = [
      'fontSet',
      'shap',
      'image',
      'table',
      'chart',
      'media',
      'latex',
      'animate',
      'layout',
    ]
    if (!bar.includes(value.type)) {
      active.value = ''
    }
  },
  {
    deep: true,
  }
)
</script>
<style lang="scss" scoped>
.Toobar {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  opacity: 0;
  animation: showToolBar 0.5s forwards ease 0.3s;
}

@keyframes showToolBar {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.thesis_info,
.chatppt-btn,
.layout-btn {
  position: relative;
  width: 60rem;
  height: 60rem;
  line-height: 60rem;
  text-align: center;
  margin: 10rem 0;
  background: #fff;
  color: #aaaaaa;
  font-size: 26rem;
  border-radius: 10rem;
  cursor: pointer;
  .iconfont {
    font-size: 26rem;
  }
}
.thesis_info {
  overflow: hidden;
  img {
    width: 100%;
  }
}
.operation-bar-item {
  display: flex;
  justify-content: center;
  align-items: center;
  .iconfont {
    font-size: 26rem;
  }
  &:hover {
    background: $lightColor;
    color: $themeColor;
  }

  &:active {
    background: #babaea;
    color: $themeColor;
  }
  &.animate {
    &:hover {
      background: #e2e2e5;
      color: #aaaaaa;
    }

    &:active {
      background: #e2e2e5;
      color: #aaaaaa;
    }
  }
}
.layout-btn {
  img {
    width: 100%;
    height: 100%;
  }
  transition: background 0.2s;
  &:hover {
    background: #f2ccff;
  }
}

.layout-active {
  background: #f2ccff;
}
.activeBtn {
  background: $lightColor;
  color: $themeColor;
}

.operation-bar {
  width: 60rem;
  text-align: center;
  margin: 10rem 0;
  background: #fff;
  color: #aaaaaa;
  font-size: 20rem;
  border-radius: 10rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 10rem 0;
  box-shadow: 0px 4px 10px 0px rgba(0, 0, 0, 0.12);
}

.operation-bar-item {
  padding: 12rem 0;
  font-size: 18rem;
  width: 40rem;
  height: 40rem;
  border-radius: 10rem;
  margin: 4rem 0;
}

.chatppt-btn {
  background: transparent;
  width: 55rem;
  height: 55rem;
  position: relative;
  img {
    width: 100%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  .hover-gif {
    display: none;
  }

  &:hover .hover-gif {
    display: block;
    z-index: 2;
  }
}

.content {
  padding: 12rem;
  font-size: 14rem;

  @include overflow-overlay();
}
</style>

<style lang="scss">
.beautify-conent-pop {
  background-color: #000 !important;
  border-color: #000 !important;
  color: #fff !important;
  border-radius: 12rem !important;
  padding: 15rem 10rem !important;
  .arco-popconfirm-footer,
  .arco-popconfirm-icon {
    display: none !important;
  }
  .arco-popconfirm-icon {
    display: none !important;
  }
  .arco-popconfirm-body {
    margin-bottom: 0 !important;
  }
  .arco-popconfirm-content {
    font-size: 16rem !important;
    color: #fff !important;
    margin-bottom: 0 !important;

    .icon-close {
      position: absolute;
      right: 0rem;
      top: 0rem;
      font-size: 22rem;
      cursor: pointer;
    }
    .gif-img {
      width: 260rem;
      height: 120rem;
      border-radius: 10rem;
      background: #e2e2e5;
      text-align: center;
      line-height: 120rem;
    }

    .info-tips {
      margin: 15rem 0;
      line-height: 20rem;
    }

    .fw-btn {
      display: flex;
      align-items: center;
      justify-content: flex-end;

      span {
        padding: 4rem 10rem;
        font-size: 14rem;
        margin-left: 10rem;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 5rem;
        cursor: pointer;
        user-select: none;
        &:hover {
          background: rgba(255, 255, 255, 0.5);
        }
        &:active {
          background: rgba(255, 255, 255, 0.2);
        }
        &:last-child {
          background: $themeColor;
          &:hover {
            background: $themeHoverColor;
          }
          &:active {
            background: $themeColor;
          }
        }
      }
    }
  }
}

.beautify-arrow-class {
  background-color: #000 !important;
  border-color: #000 !important;
}
</style>
