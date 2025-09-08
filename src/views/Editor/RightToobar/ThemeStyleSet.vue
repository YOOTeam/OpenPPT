<template>
  <div class="themeStyle">
    <Tabs
      :tabs="tabs"
      v-model:value="type"
      :tabsStyle="{ marginBottom: '15rem' }"
      @click="handleClickBar"
    />
    <div class="theme-contents" style="position: relative">
      <template v-if="type === 'themeSet'">
        <div class="theme-list" @scroll="handleScrollTheme">
          <div
            class="theme-item"
            v-for="(item, index) in fullThemePages.list"
            :key="index"
          >
            <div class="theme-item-content">
              <div class="themeSlideBox">
                <ThumbnailSlide
                  v-if="item.slide"
                  class="thumbnail"
                  :slide="item.slide"
                  :size="246 * rem"
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
                v-if="activeTheme === item.id"
              />
              <div
                v-if="item.slide"
                class="btns"
                @mouseenter="handleViewTemplat('enter', item, 'fullThemePages')"
                @mouseleave="handleViewTemplat('leave', item, 'fullThemePages')"
              >
                <Button
                  type="primary"
                  style="margin-top: 3rem"
                  @click="handleApplayThemesBase(item)"
                  >{{ $t('themeSeting.applayTheme') }}</Button
                >
              </div>
              <div class="loading-img" v-if="!item.showSlide">
                <img
                  class="beautifyLoading-gif"
                  src="@/assets/image/f-3.gif"
                  alt=""
                />
                <p>{{ $t('layoutPool.aiLayout') }}</p>
              </div>
            </div>
          </div>
          <div
            class="theme-item active-item"
            v-if="
              fullThemePages.listlength > 4 &&
              !fullThemePages.showError &&
              !fullThemePages.showNoData &&
              !fullThemePages.showLoding
            "
          >
            <div class="spinner-box">
              <div class="spinner-border"></div>
              <div class="spinner"></div>
            </div>
            <p>{{ $t('layoutPool.aiLoading') }}</p>
          </div>
          <div
            v-if="fullThemePages.list.length === 0 && fullThemePages.showLoding"
            class="loading"
          >
            <img class="loading-img-gif" src="@/assets/image/f-1.gif" alt="" />
            <p>{{ $t('layoutPool.loadingLayout') }}</p>
          </div>
          <div
            v-if="
              fullThemePages.list.length === 0 &&
              !fullThemePages.showLoding &&
              fullThemePages.showError
            "
            class="nodata"
          >
            <p>{{ $t('layoutPool.aiStudy') }}</p>
            <p>({{ $t('layoutPool.error') }})</p>
          </div>
          <div v-if="fullThemePages.showNoData" class="messageTips">
            <p>{{ $t('layoutPool.noMore') }}</p>
          </div>
        </div>
        <PoolOpenModal :visible="openNoTokenToobal" />
      </template>
      <template v-else>
        <div class="bg-box">
          <div class="row" style="margin-bottom: 35rem">
            <div style="width: 40%">{{ $t('themeSeting.slideSize') }}</div>
            <div style="width: 60%; position: relative">
              <!-- viewportRatio -->
              <Select
                :disabled="true"
                :value="`${t('themeSeting.width')} 16 : 9`"
                @update:value="value => updateViewportRatio(value as number)"
                :options="[
                  { label: '宽屏 16 : 9', value: 0.5625 },
                  { label: '宽屏 16 : 10', value: 0.625 },
                  { label: '标准 4 : 3', value: 0.75 },
                  { label: '纸张 A3 / A4', value: 0.70710678 },
                  { label: '竖向 A3 / A4', value: 1.41421356 },
                ]"
              />

              <p class="tips">* {{ $t('themeSeting.tips') }}</p>
            </div>
          </div>
          <Divider />
          <div class="row">
            <div style="width: 40%">{{ $t('toolbar.bgFill') }}</div>
            <div style="width: 60%">
              <Select
                style="flex: 1"
                :value="background.type"
                @update:value="value => updateBackgroundType(value as 'gradient' | 'image' | 'solid')"
                :options="[
                  { label: t('toolbar.fillColor'), value: 'solid' },
                  { label: t('toolbar.fillGradient'), value: 'gradient' },
                  { label: t('toolbar.fillImage'), value: 'image' },
                ]"
              />
            </div>
          </div>
          <div class="row">
            <div style="width: 40%">
              <span v-if="background.type === 'solid'">{{
                $t('toolbar.fileColor')
              }}</span>
              <span v-else-if="background.type === 'image'">{{
                $t('themeSeting.fill')
              }}</span>
              <span v-else>{{ $t('toolbar.gradientType') }}</span>
            </div>
            <Popover
              trigger="click"
              v-if="background.type === 'solid'"
              style="width: 60%"
            >
              <template #content>
                <ColorPicker
                  :modelValue="initColor(background.color)"
                  @update:modelValue="(color) => updateBackground({ color })"
                />
              </template>
              <ColorButton :color="initColor(background.color) || '#fff'" />
            </Popover>
            <Select
              style="width: 60%"
              :value="background.image?.size || 'cover'"
              @update:value="value => updateImageBackground({ size: value as SlideBackgroundImageSize })"
              v-else-if="background.type === 'image'"
              :options="[
                { label: t('themeSeting.contain'), value: 'contain' },
                { label: t('themeSeting.repeat'), value: 'repeat' },
                { label: t('themeSeting.cover'), value: 'cover' },
              ]"
            />

            <Select
              style="width: 60%"
              :value="background.gradient?.type || ''"
              @update:value="value => updateGradientBackground({ type: value as GradientType })"
              v-else
              :options="[
                { label: t('toolbar.linear'), value: 'linear' },
                { label: t('toolbar.radial'), value: 'radial' },
              ]"
            />
          </div>
          <div
            class="background-image-wrapper"
            v-if="background.type === 'image'"
          >
            <div class="bgImage-list" @scroll="handleScroll">
              <div
                v-for="item in imageList"
                class="image-item"
                :key="item"
                @click="handleImg(item)"
              >
                <img :src="item.url" v-if="item.url" alt="" />
                <div class="btn" @click="handleImg(item)">
                  <span> {{ $t('themeSeting.use') }} </span>
                </div>
              </div>
            </div>
            <FileInput @change="(files) => uploadBackgroundImage(files)">
              <div
                class="background-image"
                :style="{ backgroundImage: `url(${background.image?.src})` }"
              >
                <div class="content">
                  <IconPlus />
                  <p>{{ $t('themeSeting.uploat') }}</p>
                </div>
              </div>
            </FileInput>
          </div>
          <div
            class="background-gradient-wrapper"
            v-if="background.type === 'gradient'"
          >
            <div class="row">
              <div style="width: 40%">{{ $t('toolbar.gradientColor') }}</div>
              <GradientBar
                style="width: 60%"
                :value="background.gradient?.colors || []"
                @update:value="
                  (value) => updateGradientBackground({ colors: value })
                "
                @update:index="(index) => (currentGradientIndex = index)"
              />
            </div>
            <div class="row">
              <div style="width: 40%">{{ $t('toolbar.currentColor') }}</div>
              <Popover trigger="click" style="width: 60%">
                <template #content>
                  <ColorPicker
                    :modelValue="initColor(background.gradient!.colors[currentGradientIndex].color)"
                    @update:modelValue="
                      (value) => updateGradientBackgroundColors(value)
                    "
                  />
                </template>
                <ColorButton
                  :color="initColor(background.gradient!.colors[currentGradientIndex].color)"
                />
              </Popover>
            </div>
            <div class="row" v-if="background.gradient?.type === 'linear'">
              <div style="width: 40%">{{ $t('toolbar.gradientRotate') }}</div>
              <Slider
                :min="0"
                :max="360"
                :step="15"
                :value="background.gradient.rotate || 0"
                @update:value="value => updateGradientBackground({ rotate: value as number })"
                style="width: 60%"
              />
            </div>
          </div>
          <Divider />
          <div class="row">
            <div style="width: 40%">{{ $t('themeSeting.defaultFont') }}</div>
            <Select
              style="width: 60%"
              :value="theme.fontName"
              @update:value="value => updateTheme({ fontName: value as string })"
              :options="[...availableFonts, ...WEB_FONTS()]"
            />
          </div>
          <div class="toobar-title">{{ $t('themeSeting.themeSet') }}</div>
          <div class="row">
            <div style="width: 40%">{{ $t('themeSeting.themeColor') }}</div>
            <Popover trigger="click" style="width: 60%">
              <template #content>
                <ColorPicker
                  :modelValue="themeColorList.accent1"
                  @update:modelValue="
                    (value) => updateThemeColor({ accent1: value })
                  "
                />
              </template>
              <ColorButton :color="themeColorList.accent1" />
            </Popover>
          </div>
          <div class="row">
            <div style="width: 40%">{{ $t('themeSeting.deepColor') }}</div>
            <Popover trigger="click" style="width: 60%">
              <template #content>
                <ColorPicker
                  :modelValue="themeColorList.text1"
                  @update:modelValue="
                    (value) => updateThemeColor({ text1: value })
                  "
                />
              </template>
              <ColorButton :color="themeColorList.text1" />
            </Popover>
          </div>
          <div class="row">
            <div style="width: 40%">{{ $t('themeSeting.lightColor') }}</div>
            <Popover trigger="click" style="width: 60%">
              <template #content>
                <ColorPicker
                  :modelValue="themeColorList.text2"
                  @update:modelValue="
                    (value) => updateThemeColor({ text2: value })
                  "
                />
              </template>
              <ColorButton :color="themeColorList.text2" />
            </Popover>
          </div>
          <div class="row">
            <div style="width: 40%">{{ $t('themeSeting.bgDeepColor') }}</div>
            <Popover trigger="click" style="width: 60%">
              <template #content>
                <ColorPicker
                  :modelValue="themeColorList.bg2"
                  @update:modelValue="
                    (value) => updateThemeColor({ bg2: value })
                  "
                />
              </template>
              <ColorButton :color="themeColorList.bg2" />
            </Popover>
          </div>

          <div class="row">
            <div style="width: 40%">{{ $t('themeSeting.bgLightColor') }}</div>
            <Popover trigger="click" style="width: 60%">
              <template #content>
                <ColorPicker
                  :modelValue="themeColorList.bg1"
                  @update:modelValue="
                    (value) => updateThemeColor({ bg1: value })
                  "
                />
              </template>
              <ColorButton :color="themeColorList.bg1" />
            </Popover>
          </div>

          <div class="row">
            <div style="width: 40%">{{ $t('themeSeting.ohterColor') }}</div>
            <div class="other-color">
              <Popover trigger="click">
                <template #content>
                  <ColorPicker
                    :modelValue="themeColorList.accent2"
                    @update:modelValue="
                      (value) => updateThemeColor({ accent2: value })
                    "
                  />
                </template>
                <Button
                  class="color-btn"
                  :style="{ backgroundColor: themeColorList.accent2 }"
                >
                </Button>
              </Popover>
              <Popover trigger="click">
                <template #content>
                  <ColorPicker
                    :modelValue="themeColorList.accent3"
                    @update:modelValue="
                      (value) => updateThemeColor({ accent3: value })
                    "
                  />
                </template>
                <Button
                  class="color-btn"
                  :style="{ backgroundColor: themeColorList.accent3 }"
                >
                </Button>
              </Popover>
              <Popover trigger="click">
                <template #content>
                  <ColorPicker
                    :modelValue="themeColorList.accent4"
                    @update:modelValue="
                      (value) => updateThemeColor({ accent4: value })
                    "
                  />
                </template>
                <Button
                  class="color-btn"
                  :style="{ backgroundColor: themeColorList.accent4 }"
                >
                </Button>
              </Popover>
              <Popover trigger="click">
                <template #content>
                  <ColorPicker
                    :modelValue="themeColorList.accent5"
                    @update:modelValue="
                      (value) => updateThemeColor({ accent5: value })
                    "
                  />
                </template>
                <Button
                  class="color-btn"
                  :style="{ backgroundColor: themeColorList.accent5 }"
                >
                </Button>
              </Popover>
              <Popover trigger="click">
                <template #content>
                  <ColorPicker
                    :modelValue="themeColorList.accent6"
                    @update:modelValue="
                      (value) => updateThemeColor({ accent6: value })
                    "
                  />
                </template>
                <Button
                  class="color-btn"
                  :style="{ backgroundColor: themeColorList.accent6 }"
                >
                </Button>
              </Popover>
            </div>
          </div>
        </div>
        <div class="btn">
          <a-button
            class="lineBtn"
            type="outline"
            @click="handleTogalCustome"
            >{{ $t('themeSeting.applayAll') }}</a-button
          >
        </div>
      </template>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import Tabs from '@/components/Tabs.vue'
import Button from '@/components/Button.vue'
import Select from '@/components/Select.vue'
import Slider from '@/components/Slider.vue'
import Popover from '@/components/Popover.vue'
import GradientBar from '@/components/GradientBar.vue'
import FileInput from '@/components/FileInput.vue'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import ColorButton from '@/components/ColorButton.vue'
import ColorPicker from '@/components/ColorPicker/index.vue'
import Divider from '@/components/Divider.vue'
import { WEB_FONTS } from '@/configs/font'
import useSlideTheme from '@/hooks/useSlideTheme'
import { useMainStore, useSlidesStore, useScreenStore } from '@/store'
import { getImageDataURL } from '@/utils/image'
import { onUploads } from '@/utils/upload'
import message from '@/utils/message'
import { getTemplatBackGround } from '@/api/careate'
import { PHOTOS, BGPHOTOS } from '@/configs/resources'
import useColor from '@/hooks/useColor'
import ThumbnailSlide from '@/views/components/ThumbnailSlide/index.vue'
import PoolOpenModal from '@/components/PoolOpenModal.vue'

import type {
  Gradient,
  GradientType,
  SlideBackground,
  SlideBackgroundType,
  SlideTheme,
  SlideBackgroundImage,
  SlideBackgroundImageSize,
} from '@/types/slides'
import useThemeStyle from '@/hooks/useThemeStyle'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const { rem } = storeToRefs(useScreenStore())
const { initColor } = useColor()
const slidesStore = useSlidesStore()
const mainStore = useMainStore()
const { availableFonts, userToken, openNoTokenToobal } = storeToRefs(mainStore)
const { slides, currentSlide, theme, themeColorList, slideIndex } =
  storeToRefs(slidesStore)
const { addHistorySnapshot } = useHistorySnapshot()
const { customThemeApply } = useSlideTheme()

const {
  handleViewTemplat,
  fullScrollNext,
  fullThemePages,
  activeTheme,
  getThemePageList,
  handleApplayThemesBase,
} = useThemeStyle()

type TypeKey = 'themeSet' | 'pageSet'
interface TabItem {
  key: TypeKey
  label: string
}
const type = ref<TypeKey>('themeSet')
const currentGradientIndex = ref(0)
const isCustome = ref<boolean>(false)
const tabs: TabItem[] = [
  { key: 'themeSet', label: t('themeSeting.themeSet') },
  { key: 'pageSet', label: t('themeSeting.pageSet') },
]
const imageList = ref<any>([
  {
    url: '',
  },
])

// 背景资源
const pageNum: number = ref(1)
const listCount: number = ref(0)
const getReserice = () => {
  if (!userToken.value) {
    imageList.value = BGPHOTOS
    return
  }
  getTemplatBackGround({
    limit: 20,
  })
    .then((res) => {
      if (res.code === 200) {
        listCount.value = res.data.count
        if (pageNum.value === 1) {
          imageList.value = res.data.data
        } else {
          imageList.value = [...imageList.value, ...res.data.data]
        }
      } else {
        if (pageNum.value === 1) {
          imageList.value = PHOTOS
        }
      }
    })
    .catch(() => {
      imageList.value = PHOTOS
    })
}

// 背景图滚动加载
const handleScroll = (event) => {
  if (!userToken.value) return
  const { scrollTop, scrollHeight, clientHeight } = event.target
  // 当滚动到底部时加载更多数据
  if (scrollHeight - scrollTop - clientHeight < 2) {
    pageNum.value++
    getReserice()
  }
}

// 主题滚动加载
const handleScrollTheme = async (event) => {
  const { scrollTop, scrollHeight, clientHeight } = event.target
  // 当滚动到底部时加载更多数据
  if (scrollHeight - scrollTop - clientHeight < 2) {
    fullScrollNext()
  }
}

onMounted(() => {
  getThemePageList()
})
const handleTogalCustome = () => {
  customThemeApply()
  applyBackgroundAllSlide()
  pageSet()
}
const background = computed(() => {
  if (!currentSlide.value.background) {
    return {
      type: 'solid',
      value: {
        type: 'rgb', // 类型：themeColor、rgb
        value: '#ffffff', // 颜色值，如果是themeColor，则为id；否则为十六进制色值
        transparent: 1, // 不透明度0~1
      },
    } as SlideBackground
  }
  return currentSlide.value.background
})
// 设置背景模式纯色、图片、渐变色
const updateBackgroundType = (type: SlideBackgroundType) => {
  if (type === 'solid') {
    const newBackground: SlideBackground = {
      ...background.value,
      type: 'solid',
      color: background.value.color || {
        type: 'rgb', // 类型：themeColor、rgb
        value: '#ffffff', // 颜色值，如果是themeColor，则为id；否则为十六进制色值
        transparent: 1, // 不透明度0~1
      },
    }
    slidesStore.updateSlide({ background: newBackground })
  } else if (type === 'image') {
    const newBackground: SlideBackground = {
      ...background.value,
      type: 'image',
      image: background.value.image || {
        src: '',
        size: 'cover',
      },
    }
    slidesStore.updateSlide({ background: newBackground })
    pageNum.value = 1
    getReserice()
  } else {
    const newBackground: SlideBackground = {
      ...background.value,
      type: 'gradient',
      gradient: background.value.gradient || {
        type: 'linear',
        colors: [
          { pos: 0, color: '#fff' },
          { pos: 100, color: '#fff' },
        ],
        rotate: 0,
      },
    }
    currentGradientIndex.value = 0
    slidesStore.updateSlide({ background: newBackground })
  }
  addHistorySnapshot()
}
// 设置背景
const updateBackground = (props: Partial<SlideBackground>) => {
  slidesStore.updateSlide({ background: { ...background.value, ...props } })
  addHistorySnapshot()
}
// 设置渐变背景
const updateGradientBackground = (props: Partial<Gradient>) => {
  updateBackground({ gradient: { ...background.value.gradient!, ...props } })
}
const updateGradientBackgroundColors = (color: string) => {
  const colors = background.value.gradient!.colors.map((item, index) => {
    if (index === currentGradientIndex.value) return { ...item, color }
    return item
  })
  updateGradientBackground({ colors })
}
// 设置图片背景
const updateImageBackground = (props: Partial<SlideBackgroundImage>) => {
  updateBackground({ image: { ...background.value.image!, ...props } })
}
const handleImg = (item: any) => {
  if (item.url) {
    updateImageBackground({ src: item.url })
  }
}
// 上传背景图片
const uploadBackgroundImage = async (files: FileList) => {
  const imageFile = files[0]
  if (!imageFile) return
  if (userToken.value) {
    message.info(t('themeSeting.upload1'))
    const res = await onUploads(imageFile, 'image')
    if (res.url) {
      updateImageBackground({ src: res.url })
      message.closeAll()
    }
  } else {
    getImageDataURL(imageFile).then((dataURL) =>
      updateImageBackground({ src: dataURL })
    )
  }
}
// 应用当前页背景到全部页面
const applyBackgroundAllSlide = () => {
  const newSlides = slides.value.map((slide) => {
    return {
      ...slide,
      background: currentSlide.value.background,
    }
  })
  slidesStore.setSlides(newSlides)
  addHistorySnapshot()
}
// 设置画布尺寸（宽高比例）
const updateViewportRatio = (value: number) => {
  slidesStore.setViewportRatio(value)
}
const delay = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
// 设置主题
const updateTheme = async (themeProps: Partial<SlideTheme>) => {
  slidesStore.setTheme(themeProps)
  message.info(t('themeSeting.loading1'))
  slides.value.forEach((slide: any) => {
    const elements = slide.elements
    if (elements?.length) {
      elements.forEach((element: any) => {
        if (element.type === 'text') {
          element.defaultFontName = themeProps.fontName
          element.content = setContentFont(element.content, themeProps.fontName)
        } else if (element.type === 'shape' && element.text) {
          element.text.defaultFontName = themeProps.fontName
          element.text.content = setContentFont(
            element.text.content,
            themeProps.fontName
          )
        }
      })
    }
  })

  function setContentFont(html: string, fontName: string) {
    if (!html) return ''

    const newHtml = html.replace(
      /font-family:\s*[^;"]+/g,
      'font-family: ' + fontName
    )
    return newHtml
  }
  pageSet()
  addHistorySnapshot()
}

const pageSet = async () => {
  const currentIndex = slideIndex.value
  for (let index = 0; index < slides.value.length; index++) {
    await delay(150) // 100秒
    slidesStore.updateSlideIndex(index)
  }
  slidesStore.updateSlideIndex(currentIndex)
  message.closeAll()
  message.success(t('layoutPool.applaySuccess'))
}

// 设置颜色
const updateThemeColor = (data: any) => {
  let color = null
  let tags = null
  for (const key in data) {
    const element = data[key]
    color = initColor(element)
    tags = key
  }
  const newData = {}
  newData[tags] = color

  slidesStore.setThemeColorItem(newData)
  addHistorySnapshot()
}
const handleClickBar = () => {
  isCustome.value = false
  if (background.value.type === 'image') {
    getReserice()
  }
}
</script>
<style lang="scss" scope>
.themeStyle {
  @include drage-modal-layout();
  padding: 0;
  .theme-contents {
    padding-bottom: 16rem;
  }
  .loading,
  .nodata {
    text-align: center;
    width: 100%;
    height: 200rem;
    line-height: 40rem;
    color: #858282ad;
    margin-top: 150rem;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
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
      width: 45rem !important;
    }
  }
  .messageTips {
    text-align: center;
    width: 100%;
    line-height: 40rem;
    color: #858282;
  }
  .other-color {
    width: 60%;
    display: flex;
    justify-content: space-between;
    .content {
      flex: 1;
    }
  }
  .row {
    width: 100%;
    display: flex;
    align-items: center;
    margin-bottom: 10rem;
  }
  .title {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10rem;
    .more {
      cursor: pointer;
      .text {
        font-size: 12rem;
        margin-right: 3rem;
      }
    }
  }
  .bgImage-list {
    display: flex;
    flex-wrap: wrap;
    max-height: 240rem;
    overflow: auto;
    margin-bottom: 10rem;
    justify-content: space-between;
    border: 1px solid #ebe9fd;
    border-radius: 6rem;
    .image-item {
      cursor: pointer;
      flex-basis: 45%;
      /* 防止padding影响宽度 */
      border-radius: 10rem;
      background: $lightColor;
      height: 80rem;
      margin: 10rem 5rem;
      overflow: hidden;
      position: relative;
      img {
        width: 100%;
        height: 100%;
      }
      .btn {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.3);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2;
        opacity: 0;

        span {
          width: 62rem;
          height: 30rem;
          border-radius: 6rem;
          background: #fff;
          text-align: center;
          line-height: 30rem;
          border: 1px solid $lightColor;
          &:hover {
            border-color: $themeColor;
          }

          &:active {
            background: $lightColor;
            border-color: $themeColor;
          }
        }
      }
      &:hover {
        background: #ebe9fd;
        color: $themeColor;
      }

      &:hover .btn {
        opacity: 1;
      }
    }
  }
  .background-image-wrapper {
    margin-bottom: 10rem;
  }
  .background-image {
    height: 0;
    padding-bottom: 56.25%;
    border: 1rem dashed $borderColor;
    background-size: 100% 100%;
    border-radius: $borderRadius;
    position: relative;
    transition: all $transitionDelay;
    &:hover {
      border-color: $themeColor;
      color: $themeColor;
    }
    .content {
      @include absolute-0();
      display: flex;
      justify-content: center;
      align-items: center;
      background-position: center;
      background-size: contain;
      background-repeat: no-repeat;
      border-radius: $borderRadius;
      cursor: pointer;
      &:hover {
        background-color: rgba($color: #eceaea, $alpha: 0.3);
      }
    }
  }
  .theme-list {
    padding: 0 10rem 10rem;
    @include flex-grid-layout();
    overflow: auto;
    height: 600rem;
  }
  .theme-item {
    width: 100%;
    border-radius: $borderRadius;
    height: 156rem;
    position: relative;
    cursor: pointer;
    margin-bottom: 10rem;
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
      padding: 8rem;
      border: 1rem solid $borderColor;
      border-radius: $borderRadius;
      overflow: hidden;
    }
    .icon {
      position: absolute;
      right: 10rem;
      top: 10rem;
      color: $themeColor;
      font-size: 30rem;
    }
    .text {
      font-size: 16rem;
    }
    .colors {
      position: absolute;
      right: 6rem;
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

    .loading-img {
      @include absolute-0();
      border-radius: 10rem;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      display: flex;
      background-color: rgba($color: #000, $alpha: 0.25);
      img {
        width: 30%;
        height: auto;
      }
      color: #fff;
    }

    .loading-box {
      width: 80rem;
      height: 60rem;
      position: relative;
    }
  }
  .active-item {
    color: #bebcbc;
    background: #f7f6f6;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    img {
      width: 90rem;
    }
  }
  .custome-content,
  .bg-box {
    padding: 10rem;
    height: 560rem;
    overflow-y: auto;
  }
  .tips {
    position: absolute;
    font-size: 12rem;
    color: #8b8b8b;
    padding-top: 5rem;
  }
  .btn {
    padding: 10rem;
  }

  .themeSlideBox {
    width: 100%;
    height: 100%;
    background-image: var(--bg);
    background-repeat: no-repeat;
    background-size: 100% 100%;
  }
}
</style>
