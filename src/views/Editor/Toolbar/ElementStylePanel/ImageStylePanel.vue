<template>
  <div class="image-style-panel">
    <div class="row" v-if="handleElement?.name">
      <div style="width: 40%">{{ $t('toolbar.viewname') }}</div>
      <div style="width: 60%">{{ handleElement.name }}</div>
    </div>
    <FileInput @change="(files) => replaceImage(files)">
      <div
        class="origin-image"
        :style="{ backgroundImage: `url(${handleImageElement.src})` }"
      >
        <div class="mark"><IconUpload /> {{ $t('toolbar.updateImg') }}</div>
      </div>
    </FileInput>
    <div class="row">{{ $t('toolbar.carpImg') }}</div>
    <div class="row" style="justify-content: center">
      <Button @click="clipImage()" style="margin-right: 10rem"
        ><IconTailoring class="btn-icon" /> {{ $t('toolbar.carpImg') }}</Button
      >
      <Popover trigger="click" v-model:value="clipPanelVisible">
        <template #content>
          <div class="clip">
            <div class="title">
              {{ $t('toolbar.tips3') }}{{ $t('toolbar.shape') }}
            </div>
            <div class="shape-clip">
              <div
                class="shape-clip-item"
                v-for="(item, key) in shapeClipPathOptions"
                :key="key"
                @click="presetImageClip(key as string)"
              >
                <div class="shape" :style="{ clipPath: item.style }"></div>
              </div>
            </div>

            <template
              v-for="typeItem in ratioClipOptions"
              :key="typeItem.label"
            >
              <div class="title" v-if="typeItem.label">
                {{ $t('toolbar.tips3') }}{{ typeItem.label }}：
              </div>
              <ButtonGroup class="row">
                <Button
                  style="flex: 1"
                  v-for="item in typeItem.children"
                  :key="item.key"
                  @click="presetImageClip('rect', item.ratio)"
                  >{{ item.key }}</Button
                >
              </ButtonGroup>
            </template>
          </div>
        </template>
        <Button>{{ $t('toolbar.setCarpShape') }}</Button>
      </Popover>
    </div>

    <div class="row">
      <div style="width: 40%">{{ $t('toolbar.imgFlip') }}</div>
      <div style="width: 60%">
        <ElementFlip />
      </div>
    </div>

    <!-- <Divider /> -->
    <ElementColorMask />
    <Divider />
    <ElementFilter />
    <Divider />
    <ElementOutline />
    <Divider />
    <ElementShadow />
    <Divider />

    <!-- <FileInput @change="(files) => replaceImage(files)">
      <Button class="full-width-btn"
        ><IconTransform class="btn-icon" /> 替换图片</Button
      >
    </FileInput> -->
    <div class="row" style="justify-content: center">
      <Button
        @click="setBackgroundImage()"
        style="margin-right: 5rem; padding: 0; flex: 1"
        ><IconTheme class="btn-icon" />{{ $t('toolbar.setBg') }}</Button
      >
      <Button @click="resetImage()" style="padding: 0; flex: 1"
        ><IconUndo class="btn-icon" />{{ $t('toolbar.resetImage') }}</Button
      >
    </div>
  </div>
</template>

<script lang="ts" setup>
import { type Ref, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import type { PPTImageElement, SlideBackground } from '@/types/slides'
import { CLIPPATHS } from '@/configs/imageClip'
import { getImageDataURL } from '@/utils/image'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'

import ElementOutline from '../common/ElementOutline.vue'
import ElementShadow from '../common/ElementShadow.vue'
import ElementFlip from '../common/ElementFlip.vue'
import ElementFilter from '../common/ElementFilter.vue'
import ElementColorMask from '../common/ElementColorMask.vue'
import FileInput from '@/components/FileInput.vue'
import Divider from '@/components/Divider.vue'
import Button from '@/components/Button.vue'
import ButtonGroup from '@/components/ButtonGroup.vue'
import Popover from '@/components/Popover.vue'
import { onUploads } from '@/utils/upload'
import message from '@/utils/message'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const shapeClipPathOptions = CLIPPATHS
const ratioClipOptions = [
  {
    label: t('toolbar.label1'),
    children: [{ key: '1:1', ratio: 1 / 1 }],
  },
  {
    label: t('toolbar.label2'),
    children: [
      { key: '2:3', ratio: 3 / 2 },
      { key: '3:4', ratio: 4 / 3 },
      { key: '3:5', ratio: 5 / 3 },
      { key: '4:5', ratio: 5 / 4 },
    ],
  },
  {
    label: t('toolbar.label3'),
    children: [
      { key: '3:2', ratio: 2 / 3 },
      { key: '4:3', ratio: 3 / 4 },
      { key: '5:3', ratio: 3 / 5 },
      { key: '5:4', ratio: 4 / 5 },
    ],
  },
  {
    children: [
      { key: '16:9', ratio: 9 / 16 },
      { key: '16:10', ratio: 10 / 16 },
    ],
  },
]

const mainStore = useMainStore()
const slidesStore = useSlidesStore()

const { handleElement, handleElementId, userToken } = storeToRefs(mainStore)
const { currentSlide } = storeToRefs(slidesStore)

const handleImageElement = handleElement as Ref<PPTImageElement>

const clipPanelVisible = ref(false)

const { addHistorySnapshot } = useHistorySnapshot()

// 打开自由裁剪
const clipImage = () => {
  mainStore.setClipingImageElementId(handleElementId.value)
  clipPanelVisible.value = false
}

// 获取原始图片的位置大小
const getImageElementDataBeforeClip = () => {
  const _handleElement = handleElement.value as PPTImageElement

  // 图片当前的位置大小和裁剪范围
  const imgWidth = _handleElement.width
  const imgHeight = _handleElement.height
  const imgLeft = _handleElement.left
  const imgTop = _handleElement.top
  const originClipRange: [[number, number], [number, number]] =
    _handleElement.clip
      ? _handleElement.clip.range
      : [
          [0, 0],
          [100, 100],
        ]

  const originWidth =
    imgWidth / ((originClipRange[1][0] - originClipRange[0][0]) / 100)
  const originHeight =
    imgHeight / ((originClipRange[1][1] - originClipRange[0][1]) / 100)
  const originLeft = imgLeft - originWidth * (originClipRange[0][0] / 100)
  const originTop = imgTop - originHeight * (originClipRange[0][1] / 100)

  return {
    originClipRange,
    originWidth,
    originHeight,
    originLeft,
    originTop,
  }
}

// 预设裁剪
const presetImageClip = (shape: string, ratio = 0) => {
  const _handleElement = handleElement.value as PPTImageElement

  const { originClipRange, originWidth, originHeight, originLeft, originTop } =
    getImageElementDataBeforeClip()

  // 纵横比裁剪（形状固定为矩形）
  if (ratio) {
    const imageRatio = originHeight / originWidth

    const min = 0
    const max = 100
    let range: [[number, number], [number, number]]

    if (imageRatio > ratio) {
      const distance = ((1 - ratio / imageRatio) / 2) * 100
      range = [
        [min, distance],
        [max, max - distance],
      ]
    } else {
      const distance = ((1 - imageRatio / ratio) / 2) * 100
      range = [
        [distance, min],
        [max - distance, max],
      ]
    }
    slidesStore.updateElement({
      id: handleElementId.value,
      props: {
        clip: { ..._handleElement.clip, shape, range },
        left: originLeft + originWidth * (range[0][0] / 100),
        top: originTop + originHeight * (range[0][1] / 100),
        width: (originWidth * (range[1][0] - range[0][0])) / 100,
        height: (originHeight * (range[1][1] - range[0][1])) / 100,
      },
    })
  }
  // 形状裁剪（保持当前裁剪范围）
  else {
    const clips = shapeClipPathOptions[shape]
    slidesStore.updateElement({
      id: handleElementId.value,
      props: {
        clip: {
          ..._handleElement.clip,
          shape,
          range: originClipRange,
          path: clips.path,
        },
      },
    })
  }
  clipImage()
  addHistorySnapshot()
}

// 替换图片（保持当前的样式）
const replaceImage = async (files: FileList) => {
  const imageFile = files[0]
  if (!imageFile) return
  if (userToken.value) {
    message.info(t('toolbar.uploadTips2'))
    const res = await onUploads(imageFile, 'image')
    if (res.url) {
      const props = { src: res.url }
      slidesStore.updateElement({ id: handleElementId.value, props })
      message.closeAll()
    }
  } else {
    getImageDataURL(imageFile).then((dataURL) => {
      const props = { src: dataURL }
      slidesStore.updateElement({ id: handleElementId.value, props })
    })
  }
  addHistorySnapshot()
}

// 重置图片：清除全部样式
const resetImage = () => {
  const _handleElement = handleElement.value as PPTImageElement

  // if (_handleElement.clip) {
  //   const { originWidth, originHeight, originLeft, originTop } =
  //     getImageElementDataBeforeClip()

  //   slidesStore.updateElement({
  //     id: handleElementId.value,
  //     props: {
  //       left: originLeft,
  //       top: originTop,
  //       width: originWidth,
  //       height: originHeight,
  //       flipH: false,
  //       flipV: false,
  //     },
  //   })
  // }

  slidesStore.updateElement({
    id: handleElementId.value,
    props: {
      flipH: false,
      flipV: false,
    },
  })

  slidesStore.removeElementProps({
    id: handleElementId.value,
    propName: ['outline', 'flip', 'shadow', 'filters', 'colorMask'],
  })
  addHistorySnapshot()
}

// 将图片设置为背景
const setBackgroundImage = () => {
  const _handleElement = handleElement.value as PPTImageElement

  const background: SlideBackground = {
    ...currentSlide.value.background,
    type: 'image',
    image: {
      src: _handleElement.src,
      size: 'cover',
    },
  }
  slidesStore.updateSlide({ background })
  addHistorySnapshot()
}
</script>

<style lang="scss" scoped>
.row {
  width: 100%;
  display: flex;
  align-items: center;
  margin-bottom: 10rem;
}
.switch-wrapper {
  text-align: right;
}
.origin-image {
  height: 160rem;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  background-color: $hoverbg;
  border: 1rem solid $lightColor;
  margin-bottom: 10rem;
  position: relative;
  border-radius: 10rem;
  overflow: hidden;
  .mark {
    position: absolute;
    left: 0;
    top: 0;
    background: #3939395b;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    color: #fff;
    opacity: 0;
  }
  &:hover .mark {
    opacity: 1;
  }
}
.full-width-btn {
  width: 100%;
  margin-bottom: 10rem;
}
.btn-icon {
  margin-right: 3rem;
}

.clip {
  width: 260rem;
  font-size: 12rem;

  .title {
    margin-bottom: 5rem;
  }
}
.shape-clip {
  margin-bottom: 10rem;

  @include flex-grid-layout();
}
.shape-clip-item {
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;

  @include flex-grid-layout-children(5, 16%);

  &:hover .shape {
    background-color: #ccc;
  }

  .shape {
    width: 40rem;
    height: 40rem;
    background-color: #e1e1e1;
  }
}
.popover-btn {
  padding: 0 3rem;
}
</style>
