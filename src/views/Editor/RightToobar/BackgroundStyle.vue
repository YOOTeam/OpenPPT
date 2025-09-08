color
<template>
  <div class="themeStyleBg">
    <div class="mode-tips-title" style="padding: 10rem">
      <span> {{ $t('themeSeting.slideSet') }}</span>
    </div>
    <div class="theme-contents">
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
      </div>
      <div class="btn">
        <a-button
          class="lineBtn"
          type="outline"
          @click="applyBackgroundAllSlide()"
          >{{ $t('themeSeting.applayAll') }}</a-button
        >
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import Select from '@/components/Select.vue'
import Slider from '@/components/Slider.vue'
import Popover from '@/components/Popover.vue'
import GradientBar from '@/components/GradientBar.vue'
import FileInput from '@/components/FileInput.vue'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import ColorButton from '@/components/ColorButton.vue'
import ColorPicker from '@/components/ColorPicker/index.vue'
import Divider from '@/components/Divider.vue'
import { useMainStore, useSlidesStore } from '@/store'
import { getImageDataURL } from '@/utils/image'

import { onUploads } from '@/utils/upload'
import message from '@/utils/message'

import { getTemplatBackGround } from '@/api/careate'
import { PHOTOS, BGPHOTOS } from '@/configs/resources'

import useColor from '@/hooks/useColor'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const { initColor } = useColor()
import type {
  Gradient,
  GradientType,
  SlideBackground,
  SlideBackgroundType,
  SlideBackgroundImage,
  SlideBackgroundImageSize,
} from '@/types/slides'
const slidesStore = useSlidesStore()
const { userToken } = storeToRefs(useMainStore())
const { slides, currentSlide } = storeToRefs(slidesStore)
const { addHistorySnapshot } = useHistorySnapshot()

const currentGradientIndex = ref(0)

const imageList = ref<any>([
  {
    url: '',
  },
])

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
const handleScroll = (event) => {
  if (!userToken.value) return
  const { scrollTop, scrollHeight, clientHeight } = event.target
  // 当滚动到底部时加载更多数据
  if (scrollHeight - scrollTop - clientHeight < 2) {
    pageNum.value++
    getReserice()
  }
}
onMounted(() => {
  getReserice()
})

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
</script>
<style lang="scss" scope>
.themeStyleBg {
  @include drage-modal-layout();
  padding: 0 6rem;
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
    border-radius: $borderRadius;
    background-size: 100% 100%;
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

  .bg-box {
    padding: 10rem;
  }
  .bg-box {
    min-height: 600rem;
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
}
</style>
