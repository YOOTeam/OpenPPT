<template>
  <div
    class="layout-pool"
    @click.stop
    :style="{
      minHeight: '720rem',
    }"
  >
    <div class="mode-tips-title p16" v-if="showEmpty">
      <span>{{ $t('layoutPool.addPage') }}</span>
    </div>
    <div v-else>
      <Tabs
        :tabs="tabs"
        v-model:value="ActiveTab"
        :tabsStyle="{ marginBottom: '15rem' }"
        @click="handleClickBar"
      />
    </div>
    <div style="position: relative">
      <div
        v-if="
          ActiveTab === 'singleThemePages' &&
          !singleThemePages.showLoding &&
          currentSlide?.elements?.length > 0 &&
          !singleThemePages.showError &&
          !props.showEmpty &&
          openSingleViewModle
        "
        class="select-page-type"
      >
        <div class="select-title">
          <div class="ai-style">
            <i>AI</i>
            <img src="@/assets/image/f-3.gif" alt="" srcset="" />
          </div>
          <span class="tips-title">{{ $t('layoutPool.pageType') }}</span>
          <a-tooltip
            :content="t('layoutPool.pageTypeTips')"
            position="bl"
            :content-style="{
              fontSize: '12rem',
              width: '240rem',
            }"
          >
            <IconHelp class="helpIcon" />
          </a-tooltip>
        </div>
        <div class="select-type" @click="showTypeList = !showTypeList">
          {{ pageType() }} <IconSwitch class="switchIcon" />
          <div class="page-type-list" v-if="showTypeList">
            <div
              class="page-type-item"
              v-for="item in pageList"
              :key="item.type"
              @click="changeVisison(item)"
            >
              {{ item.name }}
            </div>
          </div>
        </div>
      </div>
      <div
        class="list"
        ref="listBoxRef"
        @scroll="handleScroll"
        :class="props.showEmpty ? 'isAddList' : ''"
      >
        <template v-if="ActiveTab === 'singleThemePages'">
          <div
            class="isEmpty-data"
            v-if="singleThemePages.isEmpty && !singleThemePages.showLoding"
          >
            <p>{{ $t('layoutPool.noData') }}</p>
            <p>
              {{ $t('layoutPool.tips1') }}
              <span>{{ $t('layoutPool.tips2') }}</span>
              {{ $t('layoutPool.tips3') }}
            </p>
          </div>

          <template v-if="!singleThemePages.showLoding">
            <template
              v-for="(slide, index) in singleThemePages.list"
              :key="index.id"
            >
              <div
                class="layout-item"
                :class="[showEmpty ? 'add-layout-item' : '']"
              >
                <ThumbnailSlide
                  v-if="slide"
                  class="thumbnail"
                  :slide="slide"
                  :size="isShowSize"
                />

                <div
                  v-if="slide && slide?.showSlide"
                  class="btns"
                  @mouseenter="handleViewTemplats('enter', slide)"
                  @mouseleave="handleViewTemplats('leave', slide)"
                >
                  <div v-if="!showEmpty" class="view_tips">
                    {{ t('layoutPool.viewTips') }}
                    <img
                      class="tips_img1"
                      src="@/assets/image/tips.png"
                      alt=""
                    />
                    <img
                      class="tips_img2"
                      src="@/assets/image/tips.png"
                      alt=""
                    />
                  </div>
                  <Button
                    class="btn"
                    type="primary"
                    @click="insertTemplate(slide)"
                    >{{
                      showEmpty
                        ? t('layoutPool.inserPage')
                        : t('layoutPool.useLayout')
                    }}</Button
                  >
                </div>
                <div v-if="props.showEmpty" class="btns">
                  <div v-if="!showEmpty" class="view_tips">
                    {{ t('layoutPool.viewTips') }}
                    <img
                      class="tips_img1"
                      src="@/assets/image/tips.png"
                      alt=""
                    />
                    <img
                      class="tips_img2"
                      src="@/assets/image/tips.png"
                      alt=""
                    />
                  </div>
                  <Button
                    class="btn"
                    type="primary"
                    @click="insertTemplate(slide)"
                    >{{ t('layoutPool.inserPage') }}</Button
                  >
                </div>
                <div
                  class="loading-img"
                  v-if="
                    !slide?.showSlide &&
                    !props.showEmpty &&
                    singleThemePages.list?.length > 0
                  "
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
              </div>
            </template>
          </template>

          <div
            v-if="singleThemePages.isEmpty && !singleThemePages.showLoding"
            @click="replaceEmptyData"
            class="isEmptybtn"
          >
            <i class="iconfont icon-shuaxin"></i>
            <span>{{ $t('layoutPool.replace') }}</span>
          </div>
        </template>
        <template v-else-if="ActiveTab === 'fullThemePages'">
          <template
            v-for="(item, index) in fullThemePages.list"
            :key="index.id"
          >
            <div class="layout-item">
              <ThumbnailSlide
                v-if="item.slide"
                class="thumbnail"
                :slide="item.slide"
                :size="isShowSize"
              />

              <div
                v-if="item.slide && item.showSlide"
                class="btns"
                @mouseenter="handleViewTemplats('enter', item)"
                @mouseleave="handleViewTemplats('leave', item)"
              >
                <Button
                  class="btn"
                  type="primary"
                  @click="handleApplayTheme(item, index)"
                  >{{ $t('layoutPool.viewLayout') }}</Button
                >
              </div>
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
            </div>
          </template>
        </template>
        <div
          class="layout-item active-item"
          v-if="
            (ActiveTab === 'singleThemePages' &&
              !singleThemePages.showLoding &&
              singleThemePages.list?.length > 4 &&
              !singleThemePages.isEmpty &&
              !props.showEmpty) ||
            (ActiveTab === 'fullThemePages' &&
              !fullThemePages.showLoding &&
              fullThemePages.list?.length > 4)
          "
        >
          <div class="spinner-box">
            <div class="spinner-border"></div>
            <div class="spinner"></div>
          </div>
          <p class="spinner-tips">{{ $t('layoutPool.aiLoading') }}</p>
        </div>
        <div
          class="nodata"
          v-if="
            (ActiveTab === 'singleThemePages' &&
              !singleThemePages.showLoding &&
              singleThemePages.showError &&
              !singleThemePages.list?.length) ||
            (ActiveTab === 'fullThemePages' &&
              !fullThemePages.showLoding &&
              fullThemePages.showError &&
              !fullThemePages.list?.length)
          "
        >
          <p>{{ $t('layoutPool.aiStudy') }}</p>

          <template v-if="!props.showEmpty">
            <template
              v-if="!openSingleViewModle && ActiveTab === 'singleThemePages'"
            >
              <p>({{ $t('layoutPool.tips4') }})</p>
              <div class="" style="justify-content: center">
                <Switch
                  :value="openSingleViewModle"
                  @update:value="(value) => toggleDeep(value, 'singleDeep')"
                />
                <span style="margin: 0 8rem">{{ $t('layoutPool.tips5') }}</span>
                <a-tooltip
                  :content="t('layoutPool.tips6')"
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
            <template v-else>
              <p>({{ $t('layoutPool.error') }})</p>
            </template>
          </template>
        </div>

        <div
          class="nodata"
          v-if="
            (singleThemePages.showNoData && ActiveTab === 'singleThemePages') ||
            (fullThemePages.showNoData && ActiveTab === 'fullThemePages')
          "
          style="margin: 0; height: auto"
        >
          {{ $t('layoutPool.nodata') }}
        </div>
        <template
          v-if="
            (ActiveTab === 'singleThemePages' && singleThemePages.showLoding) ||
            (ActiveTab === 'fullThemePages' && fullThemePages.showLoding)
          "
        >
          <div class="loading loding-animation">
            <div class="loading-box">
              <img
                class="loading-img-gif"
                src="@/assets/image/f-1.gif"
                alt=""
              />
            </div>
            <p>
              {{
                !props.showEmpty
                  ? t('layoutPool.loadingLayout')
                  : t('layoutPool.loading')
              }}
            </p>
          </div>
          <div
            class="layout-item loading-box"
            v-for="(item, index) in 6"
            :style="{ 'animation-delay': `${2 + index * 0.5}s` }"
            :key="item"
          >
            <div class="loading-box">
              <img
                class="loading-img-gif"
                src="@/assets/image/f-1.gif"
                alt=""
              />
            </div>
            <p>
              {{
                !props.showEmpty
                  ? t('layoutPool.loadingLayout')
                  : t('layoutPool.loading')
              }}
            </p>
          </div>
        </template>
      </div>
      <div
        class="AllSlideBtn"
        v-if="ActiveTab === 'fullThemePages' && !fullThemePages.showLoding"
      >
        <div class="slideBtn">
          <span style="margin-right: 8rem">{{ $t('layoutPool.tips7') }}</span>
          <Switch
            :value="openColorSingle"
            @update:value="(value) => toggleDeep(value, 'color')"
          />
        </div>
        <div class="slideBtn">
          <div>
            <span style="margin-right: 8rem">{{ $t('layoutPool.tips5') }}</span>
            <a-tooltip
              :content="t('layoutPool.tips6')"
              position="bl"
              :content-style="{
                fontSize: '12rem',
                width: '240rem',
              }"
            >
              <IconHelp class="helpIcon" />
            </a-tooltip>
          </div>
          <Switch
            :value="openFullViewModle"
            @update:value="(value) => toggleDeep(value, 'allDeep')"
          />
        </div>
      </div>
      <PoolOpenModal :visible="openNoTokenToobal" />
    </div>
    <div></div>
    <template
      v-if="
        ActiveTab === 'singleThemePages' &&
        !singleThemePages.showLoding &&
        currentSlide?.elements?.length > 0 &&
        !singleThemePages.showError &&
        !props.showEmpty
      "
    >
      <div
        class="slideBtn"
        style="padding-bottom: 10rem"
        v-if="
          ActiveTab === 'singleThemePages' &&
          !singleThemePages.showLoding &&
          currentSlide?.elements?.length > 0 &&
          !singleThemePages.showError &&
          !props.showEmpty
        "
      >
        <div>
          <span style="margin-right: 8rem">{{ $t('layoutPool.tips5') }}</span>
          <a-tooltip
            :content="t('layoutPool.tips6')"
            position="bl"
            :content-style="{
              fontSize: '12rem',
              width: '240rem',
            }"
          >
            <IconHelp class="helpIcon" />
          </a-tooltip>
        </div>
        <Switch
          :value="openSingleViewModle"
          @update:value="(value) => toggleDeep(value, 'singleDeep')"
        />
      </div>
      <div
        class="slideBtn"
        style="padding-top: 0rem"
        v-if="
          ActiveTab === 'singleThemePages' &&
          !singleThemePages.showLoding &&
          currentSlide?.elements?.length > 0 &&
          !singleThemePages.showError &&
          !props.showEmpty
        "
      >
        <div>
          <span style="margin-right: 8rem">{{ $t('layoutPool.aiDraw') }}</span>
          <a-tooltip
            :content="t('layoutPool.tips8')"
            position="bl"
            :content-style="{
              fontSize: '12rem',
              width: '240rem',
            }"
          >
            <IconHelp class="helpIcon" />
          </a-tooltip>
        </div>

        <Switch
          :value="openDrawing"
          @update:value="(value) => toggleDeep(value, 'drawing')"
        />
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import {
  watch,
  onMounted,
  ref,
  reactive,
  nextTick,
  computed,
  onBeforeUnmount,
} from 'vue'
import ThumbnailSlide from '@/views/components/ThumbnailSlide/index.vue'
import Switch from '@/components/Switch.vue'
import Button from '@/components/Button.vue'
import Tabs from '@/components/Tabs.vue'
import PoolOpenModal from '@/components/PoolOpenModal.vue'
import { nanoid } from 'nanoid'
import useThemeStyle from '@/hooks/useThemeStyle'
import { debounce } from 'lodash'
import { useI18n } from 'vue-i18n'
import { useMainStore } from '@/store'
import { storeToRefs } from 'pinia'
const mainStore = useMainStore()
const { openNoTokenToobal } = storeToRefs(mainStore)

const { t } = useI18n()

const showTypeList = ref(false)
const listBoxRef = ref(null)
const {
  singleInit,
  singleScrollNext,
  handleViewTemplat,
  appltSingTemplate,
  initFullTemplate,
  handleToggleDrawing,

  fullScrollNext,
  initAddTheme,
  replaceEmptyData,
  handleApplayThemes,
  singleThemePages,
  fullThemePages,

  disableClickBtn,
  currentSlide,
  openSingleViewModle,
  openFullViewModle,
  openColorSingle,
  handleToggleSingView,
  handleCheckFullSingColor,
  handleToggleFullView,
  breakFunction,
  slides,
  toolbarData,
  openDrawing,
  handleCansole,
  jsonDataApiTimer,
  privateClose,
  cancelRequestsRequests,
  singleKeyData,
  changeVisison,
} = useThemeStyle()
const ActiveTab = ref('singleThemePages')
const props = withDefaults(
  defineProps<{
    showEmpty?: boolean
  }>(),
  {
    showEmpty: false,
  }
)

const pageList = reactive([
  {
    name: t('beautify.cover'),
    type: 'cover',
  },
  {
    name: t('beautify.catalog'),
    type: 'catalog',
  },
  {
    name: t('beautify.chatper'),
    type: 'chapter',
  },
  {
    name: t('beautify.contentPage'),
    type: 'content',
  },
  {
    name: t('beautify.endPage'),
    type: 'end',
  },
])

const pageType = computed(() => () => {
  let label = singleKeyData.value?.slideType
  if (singleKeyData.value?.slideType === '章节') {
    label = t('beautify.chatper')
  } else if (singleKeyData.value?.slideType === '目录') {
    label = t('beautify.catalog')
  } else if (singleKeyData.value?.slideType === '封面') {
    label = t('beautify.cover')
  } else if (singleKeyData.value?.slideType === '结束') {
    label = t('beautify.endPage')
  } else {
    label = t('beautify.contentPage')
  }
  return label
})

const isShowSize = ref(268)

const emit = defineEmits<{
  (event: 'select', payload: any): void
}>()

const tabs: any = [
  { key: 'singleThemePages', label: t('layoutPool.aiSinglePage') },
  { key: 'fullThemePages', label: t('layoutPool.aiFullPage') },
]

const handleScroll = debounce(
  function (event) {
    const { scrollTop, scrollHeight, clientHeight } = event.target
    if (scrollHeight - scrollTop - clientHeight < 2) {
      if (
        ActiveTab.value === 'singleThemePages' &&
        singleThemePages.value?.list?.length
      ) {
        if (!props.showEmpty) {
          singleScrollNext()
        } else {
          singleThemePages.value.showNoData = true
        }
      } else if (
        ActiveTab.value === 'fullThemePages' &&
        fullThemePages.value?.list?.length
      ) {
        fullScrollNext()
      }
    }
  },
  300,
  { trailing: true }
)

const toggleDeep = async (value, type) => {
  if (slides.value?.length === 0) return
  if (type === 'singleDeep') {
    handleToggleSingView()
  } else if (type === 'allDeep') {
    handleToggleFullView()
  } else if (type === 'color') {
    handleCheckFullSingColor()
  } else if (type === 'drawing') {
    openDrawing.value = !openDrawing.value
    if (ActiveTab.value === 'fullThemePages') {
    } else {
      handleToggleDrawing()
    }
  }
}
// hover
const handleViewTemplats = (type: string, item: any) => {
  if (props.showEmpty) return
  if (type === 'enter') {
    let pageId = ''
    let FuctionSubID = ''

    if (ActiveTab.value === 'singleThemePages') {
      pageId = `${item.oldId}-${item.jsonDataId}`
      FuctionSubID = 'AISlide'
    } else if (ActiveTab.value === 'fullThemePages') {
      FuctionSubID = 'AIDocument'
      pageId = `${item.id}`
    } else {
      FuctionSubID = 'AIColors'
      pageId = `${item.id}`
    }
  }
  handleViewTemplat(type, item, ActiveTab.value)
}

const handleApplayColors = (item: any) => {}

const handleApplayTheme = (item, index) => {
  handleApplayThemes(item, index, true)
}
const handleClickBar = debounce(
  function () {
    breakFunction.value = true
    if (ActiveTab.value === 'singleThemePages') {
      cancelRequestsRequests([
        'viewThemeModleFull',
        'getFullPageTemplat',
        'analyseStyle',
      ])
      handleCansole()
      singleInit()
    } else if (ActiveTab.value === 'fullThemePages') {
      cancelRequestsRequests([
        'viewThemeModleSingle',
        'getOnePageTemplat1',
        'getOnePageTemplat2',
        'getOnePageDetail',
      ])
      handleCansole()
      initFullTemplate()
    }
  },
  0,
  { trailing: true }
)

// 单页 插入模版应用 模版
const insertTemplate = (slide: Slide) => {
  if (props.showEmpty) {
    if (slide.elements?.length) {
      slide.elements.forEach((item: any) => {
        item.isPlaceHolder = true
      })
    }
    emit('select', slide)
  } else {
    if (disableClickBtn.value) return

    appltSingTemplate(currentSlide.value, slide)
    sessionStorage.removeItem('singlePageId')
    const data = {
      json: slide.jsonDataId,
      slideid: slide.oldId,
      url: slide.url,
    }
    sessionStorage.setItem('singlePageId', JSON.stringify(data))
    mainStore.setShowToolbar(false)
    mainStore.setOpenNoTokenToobal(false)
  }
}

const taskID = ref(nanoid(10))

const statistics = () => {}
const returnSize = () => {
  nextTick(() => {
    if (!listBoxRef.value) return
    const paddingLeft = window?.getComputedStyle(listBoxRef.value)?.paddingLeft
    const w = listBoxRef.value.offsetWidth
    isShowSize.value = props.showEmpty
      ? w / 2 - 10
      : w - paddingLeft?.replace('px', '') * 2
  })
}

onMounted(() => {
  returnSize()
  window.addEventListener('resize', returnSize)
  if (toolbarData.value.activeTab) {
    ActiveTab.value = toolbarData.value.activeTab
  }
  if (ActiveTab.value === 'singleThemePages') {
    if (!props.showEmpty) {
      singleInit()
      statistics()
    } else {
      initAddTheme()
    }
  } else {
    handleClickBar()
  }
})

watch(
  () => props.showEmpty,
  (newValue, oldValue) => {
    if (newValue !== oldValue) {
      returnSize()
      if (!props.showEmpty) {
        singleInit()
        statistics()
      } else {
        initAddTheme()
        clearInterval(jsonDataApiTimer.value)
        privateClose.value = true
      }
    }
  }
)
onBeforeUnmount(() => {
  window.removeEventListener('resize', returnSize)
  clearInterval(jsonDataApiTimer.value)
  privateClose.value = true
  cancelRequestsRequests([
    'btn-singImage',
    'viewThemeModleSingle',
    'getOnePageTemplat1',
    'getOnePageTemplat2',
    'getOnePageDetail',
    'viewThemeModleFull',
    'getFullPageTemplat',
    'analyseStyle',
  ])
  handleCansole()
})
</script>

<style lang="scss" scoped>
.tabs:not(.card) {
  justify-content: space-around !important;
}
.layout-pool {
  @include drage-modal-layout();
  max-height: calc(100vh - 200rem);
  min-height: 720rem;
  padding: 0 0 0 6rem;
}
.select-page-type {
  padding: 0 10rem 10rem;
}

.select-page-type,
.select-type {
  display: flex;
  justify-content: space-between;
  align-items: center;
  user-select: none;
}
.select-title {
  height: 30rem;
  display: flex;
  align-items: center;
  font-size: 16rem;
  color: #858282;
}

.view_tips {
  font-size: 14rem;
  font-weight: normal;
  line-height: normal;
  color: #ffffff;
  margin-bottom: 14rem;
  position: relative;
  .tips_img1 {
    position: absolute;
    right: -14rem;
    top: -10rem;
    width: 14rem;
    height: 14rem;
  }
  .tips_img2 {
    position: absolute;
    right: -21rem;
    top: 4rem;
    width: 10rem;
    height: 10rem;
  }
}
.tips-title {
  font-size: 14rem;
  font-weight: normal;
  line-height: normal;
  color: #1a1a1a;
  margin-left: 9rem;
  margin-right: 5rem;
}
.select-title {
  flex: 1;
}

.select-type {
  cursor: pointer;
  position: relative;
  width: 127rem;
  height: 30rem;
  border-radius: 6rem;
  opacity: 1;
  box-sizing: border-box;
  border: 1rem solid #dddaff;
  padding: 0 10rem;
  .switchIcon {
    color: #aaaaaa;
    font-size: 18rem;
  }
  &:hover {
    border-color: $themeColor;
    .switchIcon {
      color: $themeColor;
    }
  }
}

.page-type-list {
  width: 100%;
  position: absolute;
  top: 30rem;
  left: 0;
  background: #fff;
  border: 1rem solid #dddaff;
  border-radius: 6rem;
  z-index: 3;
}
.page-type-item {
  padding: 0 10rem;
  height: 30rem;
  line-height: 30rem;
  cursor: pointer;
  &:hover {
    background-color: #f5f5f5;
  }
}

.ai-style {
  width: 30rem;
  height: 18rem;
  border-radius: 4rem;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(227deg, #ece0ff 9%, #faecff 102%);
  i {
    font-family: Alibaba PuHuiTi 2;
    font-size: 10rem;
    font-weight: bold;
    line-height: 10rem;
    background: linear-gradient(270deg, #6040fc 15%, #e750e6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  img {
    width: 13rem;
  }
}
.english-style-width {
  .layout-pool {
    width: 350rem;
  }
}
.slideBtn {
  font-size: 14rem;
  position: relative;
  padding: 16rem 10rem;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: space-between;
  .switch-core {
    width: 35rem;
  }
}

.helpIcon {
  font-size: 14rem;
  cursor: pointer;
  color: #aaaaaa;
}
.AllSlideBtn {
  padding: 4rem 0;
  .slideBtn {
    padding: 4rem 10rem;
  }
}

.p16 {
  padding: 10rem 10rem 0;
}
.header {
  height: 40rem;
  padding: 10rem;
  background-color: $hoverbg;
  margin-bottom: 10rem;
}

.spinner-box {
  position: relative;
  width: 40rem;
  height: 40rem;
  margin-bottom: 10rem;
  .spinner-border {
    position: absolute;
    margin: auto;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    width: 40rem;
    height: 40rem;
    border: 10rem solid #eadffa;
    border-radius: 50%;
  }

  .spinner {
    position: absolute;
    margin: auto;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    width: 40rem;
    height: 40rem;
    background: linear-gradient(#f7f6f6, #f7f6f6),
      linear-gradient(270deg, #6040fc 15%, #e750e6 100%);
    background-clip: padding-box, border-box;
    border: 6rem solid transparent;
    border-top-color: #eadffa;
    border-left-color: #eadffa;
    border-right-color: #eadffa;
    border-radius: 50%;
    animation: spinner 0.8s linear infinite;
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

.loading-img-gif {
  width: 120rem;
  height: auto;
  margin: 10rem 0;
}

.loading-img {
  .beautifyLoading-gif {
    width: 45rem;
  }
}

.list {
  height: 608rem;
  padding: 0 10rem 10rem;
  overflow: auto;
  @include flex-grid-layout();
  justify-content: space-between;

  &::-webkit-scrollbar-thumb {
    background-color: transparent;
    border-radius: 10rem;
  }
  &:hover {
    &::-webkit-scrollbar-thumb {
      background-color: #ddd;
      border-radius: 10rem;
      cursor: pointer;
    }
  }
}

.isAddList {
  height: 600rem;
}

.isEmpty-data {
  user-select: none;
  padding: 50rem 0 20rem;
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

.isEmptybtn {
  padding: 10rem 0;
  user-select: none;
  width: 100%;
  color: #858282ad;
  text-align: center;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16rem;
  i {
    font-size: 16rem;
    margin-right: 5rem;
    transition: all 0.5s;
  }
  &:hover {
    color: $themeColor;
  }
  &:hover i {
    transform: rotate(360deg);
  }
  &:active {
    color: $lightColor;
  }
}

.nodata,
.loading {
  text-align: center;
  width: 100%;
  height: 200rem;
  line-height: 40rem;
  color: #858282ad;
  margin-top: 150rem;
}

.loading-box {
  width: 80rem;
  height: 60rem;
  position: relative;
}

.messageTips {
  text-align: center;
  width: 100%;
  line-height: 40rem;
  color: #858282;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.loding-animation {
  animation: showloading 2s forwards;
}

@keyframes showloading {
  100% {
    display: none;
  }
}
.layout-item {
  overflow: hidden;
  position: relative;
  width: 100%;
  margin-bottom: 10rem;
  border: 1rem solid #ddd;
  border-radius: 10rem;

  &:hover .btns {
    opacity: 1;
  }

  &:hover .thumbnail {
    outline-color: $themeColor;
  }

  .btns {
    @include absolute-0();
    border-radius: 10rem;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    display: flex;
    background: linear-gradient(0deg, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7));
    opacity: 0;
  }

  .loading-img {
    @include absolute-0();
    border-radius: 10rem;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    display: flex;
    background-color: rgba($color: #000, $alpha: 0.25);
    color: #fff;
  }

  .thumbnail {
    outline: none;
  }
}

.layout-item.loading-box {
  min-height: 144rem;
}
.loading-box {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  line-height: 40rem;
  color: #9e9d9d;
  opacity: 0;
  animation: showloadingItem 0.5s forwards;
}

@keyframes showloadingItem {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
.active-item {
  color: #bebcbc;
  background: #f7f6f6;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  min-height: 144rem;
  img {
    width: 90rem;
  }
}
.itemAnimation {
  opacity: 0;
  animation: fadeIn 1s forwards;
}

.slide-color {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 10rem;
  background: #fff;
  border-radius: 10rem;
  padding: 4rem 8rem;
  border: 1rem solid #ccc;
  span {
    width: 16rem;
    height: 16rem;
    border-radius: 50%;
    border: 1rem solid #ccc;
  }
}
@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

.add-layout-item {
  width: 49%;

  &:nth-last-child(2),
  &:last-child {
    margin-bottom: 0;
  }
}
</style>
