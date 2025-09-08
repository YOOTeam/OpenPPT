<template>
  <div class="iframe-slide" ref="iframeSlide">
    <template v-for="(item, index) in fullThemePages.list" :key="index.id">
      <div
        class="layout-item"
        @click="handleChoseOne(item, index)"
        :showId="item.id"
      >
        <ThumbnailSlide
          v-if="item.slide"
          class="thumbnail"
          :slide="item.slide"
          :size="size"
        />
        <div
          class="loading-img"
          v-if="!item.showSlide && fullThemePages.list?.length > 0"
        >
          <div class="loading-box">
            <img
              class="beautifyLoading-gif"
              src="@/assets/image/f-3.gif"
              alt=""
            />
          </div>
          <p>{{ $t('layoutPool.aiLayout') }}</p>
        </div>
        <div
          class="active"
          v-if="activeId === item.id"
          :style="{ cursor: activeId === item.id ? 'default' : 'pointer' }"
        >
          <img src="@/assets/image/active-iframe.svg" alt="" srcset="" />
        </div>
        <div class="marck" v-if="activeId !== item.id">
          <span>{{ $t('create.seleckStyle') }}</span>
        </div>
      </div>
    </template>

    <template v-for="item in limit - fullThemePages.list?.length" :key="item">
      <div
        class="layout-item loading"
        v-if="fullThemePages.list?.length < fullThemePages.countNum"
      >
        <div
          :style="{
            width: size + 'px',
            height: size * viewportRatio + 'px',
          }"
        ></div>
        <div class="loading-img" style="background-color: #fff">
          <div class="loading-box">
            <img
              class="beautifyLoading-gif"
              src="@/assets/image/f-3.gif"
              alt=""
            />
          </div>
          <p style="color: #333">{{ $t('layoutPool.aiLayout') }}</p>
        </div>
      </div>
    </template>
    <div
      class="noDatas"
      v-if="fullThemePages.list.length === 0 && !fullThemePages.showLoding"
    >
      {{ $t('noData') }}
    </div>
  </div>
</template>
<script lang="ts" setup>
import { watch, onMounted, ref, onBeforeUnmount, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore } from '@/store'
import useThemeStyle from '@/hooks/useThemeStyle'
import ThumbnailSlide from '@/views/components/ThumbnailSlide/index.vue'
import useIframeMessage from '@/hooks/useIframeMessage'
import { useI18n } from 'vue-i18n'
import { nanoid } from 'nanoid'
const { t } = useI18n()
const { SendIframeMessage, isInIfram } = useIframeMessage()
const slidesStore = useSlidesStore()
const { viewportRatio } = storeToRefs(slidesStore)
const {
  FullApiChannle,
  getFullTemplate,
  themePagelist,
  handleCheckFullColor,
  fullThemePages,
  allDeepViewData,
  openColorSingle,
  isOnlyUse,
  chatAiData,
  ishandleFall,
} = useThemeStyle()
const props = withDefaults(
  defineProps<{
    slideData?: any
  }>(),
  {
    slideData: null,
  }
)

const iframeSlide = ref(null)
const limit = ref(16)
const size = ref(263)
const activeId = ref('')
fullThemePages.value.countNum = 1
const handleChoseOne = (item: any) => {
  activeId.value = item.id
  let data: any = {
    id: item.id,
    fontStyle: item.fontStyleData,
    color_style: item.color_style,
    page_color: item.page_color,
    style: item.style,
    jsonUrl: item.json,
    themeColorData: item.themeColorData,
    special: chatAiData.value.special,
  }

  if (props.slideData?.source === 'addin') {
    data = JSON.parse(JSON.stringify(item))
    delete data.slide
    delete data.orgainColor
    delete data.page_color_old
    delete data.color_style_old
    delete data.fontStyleData
  }
  if (isInIfram()) {
    SendIframeMessage({
      type: 'choseOne',
      datas: data,
      iframeIndex: props.slideData?.iframeIndex,
    })
  }
}
openColorSingle.value = false

const initList = async () => {
  let id = ''
  let topId = ''
  if (props.slideData) {
    if (props.slideData?.language) {
      chatAiData.value.language = props.slideData?.language
    }
    limit.value = props.slideData?.limit || 16
    id = props.slideData?.id
    topId = props.slideData?.topId

    if (props.slideData?.color) {
      openColorSingle.value = true
    } else {
      openColorSingle.value = false
    }
    if (props.slideData?.style) {
      chatAiData.value.style = props.slideData?.style
      chatAiData.value.scrollStyle = props.slideData?.style
    }

    fullThemePages.value.closeGlobalStyle = false

    if (props.slideData?.title) {
      allDeepViewData.value.title = props.slideData?.title
    }
    if (props.slideData?.author) {
      allDeepViewData.value.author = props.slideData?.author
    }
    if (props.slideData?.company || props.slideData?.thesis_info?.logo) {
      let logoImg = props.slideData?.thesis_info?.logo
      if (logoImg && logoImg.indexOf('http') === -1) {
        logoImg = `https:${logoImg}`
      }
      allDeepViewData.value.company = props.slideData?.company || logoImg
      delete allDeepViewData.value?.logo
    }
    if (props.slideData?.company && !props.slideData?.thesis_info) {
      chatAiData.value.special = props.slideData?.company
    }
  }

  let addinData = null
  if (props.slideData?.source === 'addin') {
    addinData = {
      style: chatAiData.value.style,
      title: allDeepViewData.value.title,
      token: '',
      isuse: false,
      colorWords: props.slideData?.color,
      company: allDeepViewData.value.company,
      type: '封面',
      scene: props.slideData?.scene,
      count: props.slideData?.limit || 8,
      theme: props.slideData?.theme,
      school: props.slideData?.school,
      logo: props.slideData?.logo,
      userName: props.slideData?.userName,
      splitContent: false,
      returnJson: true,
    }
  }

  if (props.slideData?.template_data?.length) {
    props.slideData?.template_data.forEach((element) => {
      if (location.protocol === 'https:') {
        element.json = element.json.replace('http:', 'https:')
      }
      if (!element.id) {
        element.id = nanoid(10)
      }
      element.isFrome = 'addin'
    })
    const list = JSON.parse(JSON.stringify(props.slideData?.template_data))
    await themePagelist(list)
  } else {
    await getFullTemplate(limit.value, topId, id, addinData)
  }
}

onMounted(async () => {
  fullThemePages.value.showLoding = true
  slidesStore.setThemeColorList({
    bg1: '#FFFFFF',
    text1: '#101214',
    bg2: '#6C757D',
    text2: '#FFFFFF',
    accent1: '#ADB5BD',
    accent2: '#F8F9FA',
    accent3: '#E9ECEF',
    accent4: '#DEE2E6',
    accent5: '#CED4DA',
    accent6: '#ADB5BD',
    hyperLink: '#ADB5BD',
    followedHyperlink: '#F8F9FA',
  })
  nextTick(() => {
    // 计算一行显示几个模版的尺寸 props.slideData?.showNum = 2 尺寸不知道为啥会不对 特殊处理一下
    const litmt = props.slideData?.showNum || 4
    const otherWidth =
      props.slideData?.showNum === 2 ? 8 * 2 * litmt : 7 * 2 * litmt
    const boxOld = iframeSlide.value.offsetWidth
    const box = boxOld - otherWidth
    size.value = parseInt(box / litmt)
    const count = (size.value + 1 + 12) * litmt
    if (boxOld - count > 0) {
      iframeSlide.value.style.paddingLeft =
        props.slideData?.showNum === 2
          ? boxOld - count - 3 + 'px'
          : boxOld - count - 2 + 'px'
    }
  })
  slidesStore.setViewportSize(960)
  slidesStore.setViewportRatio(540 / 960)
  isOnlyUse.value = true
  allDeepViewData.value = {
    pageType: '封面页',
    title: '',
    author: '',
    model: 'layout-image-detect',
    version: '1.1.0',
    slideTage: 'cover',
    company: '',
  }
  initList()
})

watch(
  () => props.slideData,
  (newValue) => {
    if (newValue.type === 'refreshList') {
      fullThemePages.value.showLoding = true
      fullThemePages.value.list = []
      // 主题生成ppt流程中,渲染主题封面。如果不是主题为党政风,则不需要出现任何党政风模板
      if (chatAiData.value?.style?.indexOf('党政风') === -1) {
        chatAiData.value.excludedStyle = '党政风'
      }
      FullApiChannle.value = 'iframe'
      initList()
    } else if (newValue.type === 'changeColor') {
      fullThemePages.value.showLoding = true
      openColorSingle.value = true
      handleCheckFullColor(newValue.color)
    }
  },
  {
    deep: true,
  }
)

watch(
  () => ishandleFall.value,
  (newValue) => {
    if (newValue) {
      if (fullThemePages.value.list.length > 0) {
        fullThemePages.value.list.sort((a, b) => {
          if (a.special && !b.special) return -1 // a在前
          if (!a.special && b.special) return 1 // b在前
          return 0 // 顺序不变
        })
        handleChoseOne(fullThemePages.value.list[0], 0)
      }
      if (props.slideData.color) {
        handleCheckFullColor(props.slideData.color)
      }
    }
  },
  {
    deep: true,
  }
)
</script>

<style lang="scss" scope>
.iframe-slide {
  overflow: auto;
  width: 100%;
  height: 100%;
  padding: 6px 0;
  position: relative;
  .noDatas {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #fff;
    position: absolute;
    left: 0;
    top: 0;
    font-size: 14px;
  }

  .layout-item {
    display: inline-block;
    vertical-align: top;
    position: relative;
    margin: 6px;
    border-radius: 10px;
    overflow: hidden;
    outline: 1px solid #d3d3dd;
    .marck {
      width: 100%;
      height: 100%;
      position: absolute;
      left: 0;
      top: 0;
      background-color: rgba($color: #000, $alpha: 0.6);
      display: none;
      justify-content: center;
      align-items: center;
      color: #fff;
      font-size: 14px;
      opacity: 0;
    }
    &:hover .marck {
      display: flex;
      opacity: 1;
    }

    &:hover {
      outline-color: $themeColor;
      cursor: pointer;
    }

    .loading-img {
      @include absolute-0();
      border-radius: 10px;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      display: flex;
      background-color: rgba($color: #000, $alpha: 0.7);
      color: #fff;
    }

    .loading-box {
      height: 60px;
      position: relative;
      .beautifyLoading-gif {
        width: 45px;
      }
    }
  }
  .active {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba($color: #000, $alpha: 0.6);
    border-radius: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #fff;
    img {
      width: 37px;
    }
  }
}
</style>
