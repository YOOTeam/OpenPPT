<template>
  <div class="element-toolbar-layout">
    <!-- <div class="close-toolbar" @click="handleClose">
      <IconCloseOne />
    </div> -->
    <Tabs
      :tabs="tabs"
      v-model:value="ActiveTab"
      :tabsStyle="{ marginBottom: '8rem', padding: '0 20rem' }"
      @click="handleClickBar"
    />
    <div class="content">
      <div
        id="mobileLayout"
        class="mobile-list"
        v-if="ActiveTab === 'singleThemePages'"
      >
        <div
          class="isEmpty-data"
          v-if="
            singleThemePages.isEmpty &&
            !singleThemePages.showLoding &&
            !singleThemePages.list?.length
          "
        >
          <p>页面空空如也，AI也无法排版...</p>
          <p>要不插入插入1个 <span>示例页面</span> 试试？</p>
        </div>
        <div
          class="theme-item"
          v-for="(slide, index) in singleThemePages.list"
          :key="index"
        >
          <div
            class="theme-item-content"
            @click="handleSingApply(slide, index)"
            :style="{
              border:
                activeTheme === slide.id
                  ? '2rem solid #4E3EFF'
                  : '2rem solid #eee',
            }"
          >
            <div class="themeSlideBox">
              <ThumbnailSlide
                v-if="slide"
                class="thumbnail"
                :slide="slide"
                :size="slideSize"
              />
            </div>
            <IconCheckOne
              theme="filled"
              class="icon"
              v-if="activeTheme === slide.newId"
            />
          </div>
        </div>
      </div>
      <div class="mobile-list" v-if="ActiveTab === 'fullThemePages'">
        <div
          class="theme-item"
          v-for="(item, index) in fullThemePages.list"
          :key="index"
        >
          <div
            class="theme-item-content"
            @click="handleApplayTheme(item, index)"
            :style="{
              border:
                activeTheme === item?.id
                  ? '2rem solid #4E3EFF'
                  : '2rem solid #eee',
            }"
          >
            <div class="themeSlideBox">
              <ThumbnailSlide
                v-if="item.slide"
                class="thumbnail"
                :slide="item.slide"
                :size="slideSize"
              />
            </div>
            <div class="colors" v-if="item.colorList">
              <div
                class="color-block"
                v-for="(color, index) in item.colorList"
                :key="index"
                :style="{ backgroundColor: color }"
              ></div>
            </div>
            <IconCheckOne
              theme="filled"
              class="icon"
              v-if="activeTheme === item?.id"
            />
          </div>
        </div>
      </div>

      <div
        class="layout-bottom"
        :style="{
          justifyContent:
            ActiveTab === 'singleThemePages' && singleThemePages.isEmpty
              ? 'center'
              : 'space-between',
        }"
        v-if="
          (fullThemePages.list.length > 0 &&
            !fullThemePages.showLoding &&
            !fullThemePages.showError &&
            ActiveTab === 'fullThemePages') ||
          (singleThemePages.list.length > 0 &&
            !singleThemePages.showLoding &&
            !singleThemePages.showError &&
            ActiveTab === 'singleThemePages')
        "
      >
        <span class="resice_data" @click="handleResiceData">
          换一批 <i class="iconfont icon-shuaxin"> </i>
        </span>
      </div>
      <div
        class="tips-div loading"
        v-if="
          (fullThemePages.list.length === 0 &&
            fullThemePages.showLoding &&
            ActiveTab === 'fullThemePages') ||
          (singleThemePages.list.length === 0 &&
            singleThemePages.showLoding &&
            ActiveTab === 'singleThemePages')
        "
      >
        <div class="spinner"></div>
        <p>AI渲染排版中...</p>
      </div>
      <div
        class="tips-div nodata"
        v-if="
          (ActiveTab === 'singleThemePages' &&
            singleThemePages.showError &&
            singleThemePages.list.length === 0) ||
          (ActiveTab === 'fullThemePages' &&
            fullThemePages.showError &&
            fullThemePages.list.length === 0)
        "
      >
        <p>AI还在学习中...</p>
        <template v-if="ActiveTab === 'singleThemePages'">
          <p v-if="openSingleViewModle">(当前页面还无法实现AI排版)</p>
          <template v-else>
            <p>(您可以启动深度排版试试？)</p>
            <div class="" style="justify-content: center">
              <Switch
                :value="openSingleViewModle"
                @update:value="(value) => toggleDeep(value, 'singleDeep')"
              />
              <span style="margin: 0 8rem">启动深度AI排版</span>
              <a-tooltip
                content="深度模式将会更加智能,效果更好;但所需AI识别时间更长,预计在5~20秒"
                position="bl"
                :content-style="{
                  fontSize: '12rem',
                  width: '240rem',
                }"
              >
                <IconHelp class="helpIcon" />
              </a-tooltip>
            </div>
          </template>
        </template>
        <p v-else>(当前页面还无法实现AI排版)</p>
      </div>
      <PoolOpenModal :visible="openNoTokenToobal" />
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, watch, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { returnRem } from '@/utils/common'
import { debounce } from 'lodash'
import { useMainStore, useSlidesStore } from '@/store'
import Switch from '@/components/Switch.vue'
import Tabs from '@/components/Tabs.vue'
import ThumbnailSlide from '@/views/components/ThumbnailSlide/index.vue'
import { nanoid } from 'nanoid'
import message from '@/utils/message'
import useThemeStyle from '@/hooks/useThemeStyle'
import PoolOpenModal from '@/components/PoolOpenModal.vue'
const {
  singleInit,
  singleScrollNext,
  appltSingTemplate,
  initFullTemplate,
  fullScrollNext,
  handleApplayThemes,
  singleThemePages,
  fullThemePages,
  currentSlide,
  openSingleViewModle,
  openColorSingle,
  handleToggleSingView,
  handleCheckFullSingColor,
  handleToggleFullView,
  slides,
} = useThemeStyle()
const mainStore = useMainStore()
const { openNoTokenToobal } = storeToRefs(mainStore)
const tabs = ref([
  { key: 'singleThemePages', label: 'AI单页排版' },
  { key: 'fullThemePages', label: 'AI全文美化' },
])

const activeTheme = ref('')
const props = withDefaults(
  defineProps<{
    isChatAI?: any
  }>(),
  {
    isChatAI: null,
  }
)

const slideSize = computed(() => {
  return 210 * returnRem()
})
const slidesStore = useSlidesStore()
const { mobildSlideClick } = storeToRefs(slidesStore)
const ActiveTab = ref('singleThemePages')

const handleClose = () => {
  mainStore.setMobileLayout(false)
}

const toggleDeep = async (value, type) => {
  if (slides.value?.length === 0) return
  if (type === 'singleDeep') {
    handleToggleSingView()
  } else if (type === 'allDeep') {
    handleToggleFullView()
  } else if (type === 'color') {
    handleCheckFullSingColor()
  }
}
const handleSingApply = (slide, index) => {
  appltSingTemplate(currentSlide.value, slide)
  sessionStorage.removeItem('singlePageId')
  const data = {
    json: slide.jsonDataId,
    slideid: slide.oldId,
  }
  sessionStorage.setItem('singlePageId', JSON.stringify(data))
  mainStore.setShowToolbar(false)
  mainStore.setOpenNoTokenToobal(false)
  activeTheme.value = slide.newId
}
const handleApplayTheme = (item, index) => {
  handleApplayThemes(item, index)
  activeTheme.value = item.id
}
const handleApplayColors = (item: any) => {
  handleApplayColor(item)
  activeTheme.value = item.id
}
const handleResiceData = debounce(
  function () {
    if (ActiveTab.value === 'fullThemePages') {
      fullThemePages.value.showLoding = true
      fullThemePages.value.list = []
      fullScrollNext()
    } else if (ActiveTab.value === 'singleThemePages') {
      if (singleThemePages.value.isEmpty) {
        singleThemePages.value.showLoding = true
        singleThemePages.value.list = []
        singleInit()
      } else {
        singleThemePages.value.showLoding = true
        singleThemePages.value.list = []
        singleScrollNext()
      }
    }
  },
  300,
  { trailing: true }
)
const taskID = ref(nanoid(10))

const isFetching = ref(false)

const handleClickBar = debounce(
  async function (isChatAI?: boolean) {
    activeTheme.value = ''
    try {
      if (slides.value?.length === 0) {
        return
      }
      if (ActiveTab.value === 'fullThemePages') {
        if (fullThemePages.value.list.length === 0) {
          fullThemePages.value.limit = 6
          await initFullTemplate()
        }

        if (fullThemePages.value.list.length && isChatAI === true) {
          const item = fullThemePages.value.list[0]
          handleApplayThemes(item, 0)
        }
      } else if (ActiveTab.value === 'singleThemePages') {
        if (singleThemePages.value.list.length === 0) {
          await singleInit()
        }

        if (singleThemePages.value.list.length && isChatAI === true) {
          const item = singleThemePages.value.list[0]
          handleSingApply(item, 0)
        }
      }
    } catch (error) {
      console.error('Error in handleClickBar:', error)
    } finally {
      isFetching.value = false // 请求完成后重置状态
    }
  },
  300,
  { trailing: true }
)

const handleChatAI = async () => {
  const data = JSON.parse(JSON.stringify(props.isChatAI))
  if (data.type === 'pageBeautify') {
    if (data.isAllPage) {
      // 全文美化
      ActiveTab.value = 'fullThemePages'
    } else {
      // 单页美化
      ActiveTab.value = 'singleThemePages'
      if (data?.num !== undefined) {
        const num = data.num > 0 ? data.num - 1 : 0
        if (data.num > slides.value.length) {
          slidesStore.updateSlideIndex(0)
          message.info('当前页码已超过最大页码，已自动切换到第一页')
        } else {
          slidesStore.updateSlideIndex(num)
        }
      } else {
        const index = slides.value.findIndex(
          (item: any) => item?.tags?.custom?.page_type === data.flage
        )
        if (index > -1) {
          slidesStore.updateSlideIndex(index)
        } else {
          message.info(`没有找到${data.pagesName}，已自动切换到第一页`)
          slidesStore.updateSlideIndex(0)
        }
      }
    }
  } else if (data.type === 'style') {
    // 更改风格
    ActiveTab.value = 'fullThemePages'
    chatAiData.value.style = data.value
    chatAiData.value.color = data.color
  }

  mainStore.setMobileChatResule(null)
  await handleClickBar()
}

onMounted(async () => {
  openColorSingle.value = false

  if (props.isChatAI) {
    await handleChatAI()
  } else {
    singleInit()
  }
})

watch(mobildSlideClick, async () => {
  singleThemePages.value.isEmpty = false
  singleThemePages.value.list = []
  handleClickBar()
})
</script>
<style lang="scss">
.element-toolbar-layout {
  padding-top: 10rem;
  @include mobile-element-toolber();
  position: fixed;
  height: 420rem;
  .close-toolbar {
    position: absolute;
    right: 10rem;
    font-size: 16rem;
  }

  .tab {
    width: 40% !important;
    margin: 0 !important;
    font-weight: 400 !important;
  }

  .content {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .isEmpty-data {
    font-size: 14rem;
    user-select: none;
    padding: 20rem 0;
    width: 100%;
    color: #858282ad;
    p {
      text-align: center;
      line-height: 34rem;
      span {
        color: $themeColor;
      }
    }
  }
  .mobile-list {
    padding: 0 10rem;
    margin-bottom: 10rem;

    height: calc(100% - 72rem);
    overflow-y: auto;
    @include flex-grid-layout();
    justify-content: space-between;
  }

  .theme-item {
    display: inline-block;
    width: 215rem;
    vertical-align: middle;
    border-radius: $borderRadius;
    height: 121rem;
    position: relative;
    cursor: pointer;
    .theme-item-content {
      img {
        width: 100%;
        height: 100%;
      }
      @include absolute-0();
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: center;
      border: 1rem solid $borderColor;
      border-radius: $borderRadius;
      overflow: hidden;
      margin: 5rem;
      background: #e6e1e1;
    }
    .icon {
      position: absolute;
      right: 10rem;
      top: 10rem;
      color: $themeColor;
      font-size: 20rem;
    }
    .text {
      font-size: 16rem;
    }
    .colors {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      bottom: 6rem;
      display: flex;
      justify-content: center;
      padding: 5rem;
      border-radius: 15rem;
      border: 1rem solid #e6e1e1;
      background: #fff;
    }
    .color-block {
      width: 16rem;
      height: 16rem;
      border-radius: 50%;
      border: 1rem solid #ccc;
    }
    &:hover .btns {
      opacity: 1;
    }
    .btns {
      @include absolute-0();
      border: 1rem solid $themeColor;
      border-radius: $borderRadius;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      display: flex;
      background-color: rgba($color: #000, $alpha: 0.3);
      opacity: 0;
    }
  }
  .active-item {
    width: 100%;
    color: #bebcbc;
    background: rgba(235, 234, 234, 0.5);
    font-size: 12rem;
    .active-item-content {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
    }
    img {
      width: 46rem;
    }
  }

  .loading,
  .nodata {
    text-align: center;
    width: 100%;
    line-height: 40rem;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    position: absolute;
    display: flex;
    left: 50%;
    top: 50%;
    font-size: 12rem;
    transform: translate(-50%, -50%);
  }
  .layout-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12rem;
    text-align: center;
    color: #838080;
    padding: 0 18rem;
  }

  .resice_data {
    padding: 4rem 0;
    display: flex;
    justify-content: center;
    align-items: center;
    .iconfont {
      font-size: 14rem;
      margin-left: 4rem;
    }
    &:hover {
      color: $themeColor;
    }
  }
  .nodata {
    line-height: 20rem;
  }
  .spinner {
    width: 30rem;
    height: 30rem;
    border: 3rem solid $themeColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spinner 0.8s linear infinite;
    margin-right: 10rem;
  }
  @keyframes spinner {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
}
</style>
