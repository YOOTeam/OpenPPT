<template>
  <div class="shape-style-panel">
    <template v-if="!textShow">
      <div class="row" v-if="name">
        <div style="width: 40%">{{ $t('toolbar.viewname') }}</div>
        <div style="width: 60%">{{ name }}</div>
      </div>
      <div class="row">
        <div style="width: 40%">{{ $t('toolbar.fillType') }}</div>
        <div style="width: 60%">
          <Select
            :value="fillType"
            @update:value="(value) => updateFillType(value)"
            :options="[
              { label: t('toolbar.fillColor'), value: 'fill' },
              { label: t('toolbar.fillGradient'), value: 'gradient' },
              { label: t('toolbar.fillImage'), value: 'fillPicture' },
            ]"
          />
        </div>
      </div>
      <div class="row" v-if="fillType === 'fill'">
        <div style="width: 40%">{{ $t('toolbar.colorFill') }}</div>
        <div style="width: 60%">
          <Popover trigger="click">
            <template #content>
              <ColorPicker
                :modelValue="fill"
                @update:modelValue="(value) => updateFill(value)"
              />
            </template>
            <ColorButton :color="fill" />
          </Popover>
        </div>
      </div>
      <template v-if="fillType === 'gradient'">
        <div class="row">
          <div style="width: 40%">{{ $t('toolbar.gradientType') }}</div>
          <Popover trigger="click" v-if="fillType === 'fill'" style="flex: 1">
            <template #content>
              <ColorPicker
                :modelValue="fill"
                @update:modelValue="(value) => updateFill(value)"
              />
            </template>
            <ColorButton :color="fill" />
          </Popover>
          <Select
            style="flex: 1"
            :value="gradient.type"
            @update:value="value => updateGradient({ type: value as GradientType })"
            v-else
            :options="[
              { label: t('toolbar.linear'), value: 'linear' },
              { label: t('toolbar.radial'), value: 'radial' },
            ]"
          />
        </div>
        <div class="row">
          <div style="width: 40%">{{ $t('toolbar.gradientColor') }}</div>
          <GradientBar
            style="flex: 1"
            :value="gradient.colors"
            @update:value="(value) => updateGradient({ colors: value })"
            @update:index="(index) => (currentGradientIndex = index)"
          />
        </div>
        <div class="row">
          <div style="width: 40%">{{ $t('toolbar.currentColor') }}</div>
          <Popover trigger="click" style="width: 60%">
            <template #content>
              <ColorPicker
                :modelValue="
                  initColor(gradient.colors[currentGradientIndex].color)
                "
                @update:modelValue="(value) => updateGradientColors(value)"
              />
            </template>
            <ColorButton
              :color="initColor(gradient.colors[currentGradientIndex].color)"
            />
          </Popover>
        </div>
        <div class="row" v-if="gradient.type === 'linear'">
          <div style="width: 40%">{{ $t('toolbar.gradientRotate') }}</div>
          <Slider
            style="width: 60%; margin: 5rem 0"
            :min="0"
            :max="360"
            :step="15"
            :value="gradient.rotate"
            @update:value="value => updateGradient({ rotate: value as number })"
          />
        </div>
      </template>
      <template v-if="fillType === 'fillPicture'">
        <FileInput @change="(files) => replaceImage(files)">
          <div
            class="origin-image"
            :style="{
              backgroundImage: `url(${handleElement?.fillPicture?.src})`,
            }"
          >
            <div class="mark"><IconUpload /> {{ $t('toolbar.uploadImg') }}</div>
          </div>
        </FileInput>
        <div class="row">
          <div style="width: 40%">{{ $t('toolbar.imgFillType') }}</div>
          <div style="width: 60%">
            <Select
              :value="imgFillType"
              @update:value="(value) => updateImgFill(value)"
              :options="[
                { label: t('toolbar.stretch'), value: 'stretch' },
                { label: t('toolbar.tile'), value: 'tile' },
              ]"
            />
          </div>
        </div>
      </template>
      <div class="title">
        <span>{{ $t('toolbar.shapeType') }}</span>
        <!-- <IconDown /> -->
      </div>
      <div class="shape-pool">
        <div class="category" v-for="item in SHAPE_LIST()" :key="item.type">
          <div class="shape-list">
            <ShapeItemThumbnail
              class="shape-item"
              v-for="(shape, index) in item.children"
              :key="index"
              :shape="shape"
              @click="changeShape(shape)"
            />
          </div>
        </div>
      </div>
      <div class="row">
        <div style="width: 40%">{{ $t('toolbar.costomeImg') }}</div>
        <div class="more-upload" style="width: 60%; text-align: right">
          <FileInput
            accept="image/svg+xml"
            class="file-btn"
            @change="(files) => fileUpload(files)"
            v-if="uploadType === 'file'"
          >
            <span>{{ $t('toolbar.uploadSvg') }}</span>
          </FileInput>
          <div class="file-btn" v-else>
            {{
              uploadType === 'url'
                ? $t('shapePool.uploadTypeUrl')
                : $t('shapePool.uploadTypeCode')
            }}
          </div>
          <div class="more-upload-icon">
            <i
              class="iconfont icon-jiantou_liebiaozhankai_o"
              :class="showUploadType ? 'open_list' : ''"
              @click="showUploadType = !showUploadType"
            ></i>
            <div class="mroe-upload-Type" v-if="showUploadType">
              <FileInput
                accept="image/svg+xml"
                class="upload-item"
                @change="(files) => fileUpload(files)"
              >
                <span>{{ $t('toolbar.uploadSvg') }}</span>
              </FileInput>
              <div class="upload-item" @click="handleUploadType('url')">
                {{ $t('shapePool.uploadTypeUrl') }}
              </div>
              <div class="upload-item" @click="handleUploadType('code')">
                {{ $t('shapePool.uploadTypeCode') }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showTextArea">
        <div class="drageModal-title">
          {{
            uploadType === 'url'
              ? $t('shapePool.uploadTypeUrl')
              : $t('shapePool.uploadTypeCode')
          }}
        </div>
        <TextArea
          class="text-area"
          v-model:value="textAreaValue"
          :placeholder="t('shapePool.placeholder')"
          @input="setSvgContent"
        ></TextArea>
      </div>
      <div class="row">
        <div style="width: 40%">{{ $t('toolbar.shapeFlip') }}</div>
        <div style="width: 60%">
          <ElementFlip />
        </div>
      </div>

      <Divider />
      <ElementOutline />
      <Divider />
      <ElementShadow />
      <Divider />
      <ElementOpacity />

      <div class="row" style="justify-content: center; margin-top: 20rem">
        <CheckboxButton
          v-tooltip="t('toolbar.dubClick')"
          :checked="!!shapeFormatPainter"
          @click="toggleShapeFormatPainter()"
          @dblclick="toggleShapeFormatPainter(true)"
        >
          <i class="iconfont toobar-icon-sizes icon-geshishua"></i>
          {{ $t('toolbar.shapeClear') }}</CheckboxButton
        >
      </div>
    </template>
    <template v-else>
      <RichTextBase>
        <template #align>
          <div class="row">
            <div style="width: 30%">{{ $t('toolbar.pAlign') }}</div>
            <div style="width: 70%">
              <RadioGroup
                class="row"
                button-style="solid"
                :value="textAlign"
                @update:value="value => updateTextAlign(value as 'top' | 'center' | 'bottom')"
              >
                <RadioButton
                  value="top"
                  v-tooltip="t('toolbar.topAlign')"
                  style="flex: 1"
                  ><IconAlignTextTopOne
                /></RadioButton>
                <RadioButton
                  value="center"
                  v-tooltip="t('toolbar.middleAlign')"
                  style="flex: 1"
                  ><IconAlignTextMiddleOne
                /></RadioButton>
                <RadioButton
                  value="bottom"
                  v-tooltip="t('toolbar.bottomAlign')"
                  style="flex: 1"
                  ><IconAlignTextBottomOne
                /></RadioButton>
              </RadioGroup>
            </div>
          </div>
        </template>
        <template #paragraph>
          <Divider />
          <div class="row">
            <div style="width: 30%">{{ $t('toolbar.lineHeight') }}</div>
            <Select
              style="width: 70%"
              :value="lineHeight || 1"
              @update:value="value => updateLineHeight(value as number)"
              :options="
                lineHeightOptions.map((item) => ({
                  label: item + t('toolbar.tips1'),
                  value: item,
                }))
              "
            >
              <template #icon>
                <i class="iconfont toobar-icon-sizes icon-wenbenhangju"></i>
              </template>
            </Select>
          </div>
          <div class="row">
            <div style="width: 30%">{{ $t('toolbar.plineHeight') }}</div>
            <Select
              style="width: 70%"
              :value="paragraphSpace || 0"
              @update:value="value => updateParagraphSpace(value as number)"
              :options="
                paragraphSpaceOptions.map((item) => ({
                  label: item + 'px',
                  value: item,
                }))
              "
            >
              <template #icon>
                <i class="iconfont toobar-icon-sizes icon-duanlajianju"></i>
              </template>
            </Select>
          </div>
          <div class="row">
            <div style="width: 30%">{{ $t('toolbar.wordSpace') }}</div>
            <Select
              style="width: 70%"
              :value="wordSpace || 0"
              @update:value="value => updateWordSpace(value as number)"
              :options="
                wordSpaceOptions.map((item) => ({
                  label: item + 'px',
                  value: item,
                }))
              "
            >
              <template #icon>
                <i class="iconfont toobar-icon-sizes icon-wenbenjianju"></i>
              </template>
            </Select>
          </div>
          <Divider />
          <FontSizeBox />
        </template>
      </RichTextBase>

      <!-- <Divider /> -->
    </template>
  </div>
</template>

<script lang="ts" setup>
import { type Ref, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import FontSizeBox from '../common/FontSizeBox.vue'
import type {
  GradientType,
  PPTShapeElement,
  Gradient,
  ShapeText,
  FillPicture,
} from '@/types/slides'
import {
  type ShapePoolItem,
  SHAPE_LIST,
  SHAPE_PATH_FORMULAS,
} from '@/configs/shapes'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import useShapeFormatPainter from '@/hooks/useShapeFormatPainter'

import ElementOpacity from '../common/ElementOpacity.vue'
import ElementOutline from '../common/ElementOutline.vue'
import ElementShadow from '../common/ElementShadow.vue'
import ElementFlip from '../common/ElementFlip.vue'
import RichTextBase from '../common/RichTextBase.vue'
import ShapeItemThumbnail from '@/views/Editor/RightToobar/ShapeItemThumbnail.vue'
import ColorButton from '@/components/ColorButton.vue'
import CheckboxButton from '@/components/CheckboxButton.vue'
import ColorPicker from '@/components/ColorPicker/index.vue'
import Divider from '@/components/Divider.vue'
import Slider from '@/components/Slider.vue'
import RadioButton from '@/components/RadioButton.vue'
import RadioGroup from '@/components/RadioGroup.vue'
import Select from '@/components/Select.vue'
import Popover from '@/components/Popover.vue'
import GradientBar from '@/components/GradientBar.vue'
import useColor from '@/hooks/useColor'
import FileInput from '@/components/FileInput.vue'
import { onUploads } from '@/utils/upload'
import message from '@/utils/message'
import useSvgStyle from '@/hooks/useSvgStyle'
import TextArea from '@/components/TextArea.vue'
import { getSvgContent, getImageDataURL, getImageSize } from '@/utils/image'
import { fetchUrl } from '@/utils/common'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const { returnNewShape, changeShape } = useSvgStyle()
const { initColor } = useColor()
const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const { handleElement, handleElementId, shapeFormatPainter, userToken } =
  storeToRefs(mainStore)

const lineHeight = ref<number>()
const wordSpace = ref<number>()
const paragraphSpace = ref<number>()
const showUploadType = ref(false)
const uploadType = ref('file')
const showTextArea = ref(false)
const lineHeightOptions = [
  0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.4, 1.5, 1.8, 2.0, 2.5, 3.0,
]
const wordSpaceOptions = [0, 1, 2, 3, 4, 5, 6, 8, 10]

const paragraphSpaceOptions = [0, 5, 10, 15, 20, 25, 30, 40, 50, 80]

const imgFillType = ref('stretch')
const fill = ref<string>('#000')
const name = ref<string>('')
const gradient = ref<Gradient>({
  type: 'linear',
  rotate: 0,
  colors: [
    { pos: 0, color: '#fff' },
    { pos: 100, color: '#fff' },
  ],
})

const fillPicture = ref<FillPicture>({
  cropBottom: 0,
  cropTop: 0,
  widthPixel: 400,
  heightPixel: 225,
  src: '@/assets/image/shapeD.jpg-motion400x225',
})
const fillType = ref('fill')
const textAlign = ref('center')
const currentGradientIndex = ref(0)

const props = withDefaults(
  defineProps<{
    textShow?: boolean
  }>(),
  {
    textShow: false,
  }
)

watch(
  handleElement,
  () => {
    if (!handleElement.value || handleElement.value.type !== 'shape') return
    name.value = handleElement.value.name
    imgFillType.value = handleElement.value.imgFillType || 'stretch'
    fill.value = initColor(handleElement.value.fill) || '#fff'
    const defaultGradientColor = [
      { pos: 0, color: fill.value },
      { pos: 100, color: '#fff' },
    ]
    gradient.value = handleElement.value.gradient || {
      type: 'linear',
      rotate: 0,
      colors: defaultGradientColor,
    }

    fillPicture.value = handleElement.value.fillPicture || {
      cropLeft: 0,
      cropTop: 0,
      widthPixel: 400,
      heightPixel: 225,

      src: '@/assets/image/shapeD.jpg-motion400x225',
    }
    if (handleElement.value.gradient) {
      fillType.value = 'gradient'
    } else if (handleElement.value.fillPicture) {
      fillType.value = 'fillPicture'
    } else {
      fillType.value = 'fill'
    }
    textAlign.value = handleElement.value?.text?.align || 'center'
    lineHeight.value =
      parseFloat(handleElement.value?.text?.lineHeight?.toFixed(2)) || 1.2
    wordSpace.value = handleElement.value?.text?.wordSpace || 0
    paragraphSpace.value = handleElement.value?.text?.paragraphSpace || 0
  },
  { deep: true, immediate: true }
)

const { addHistorySnapshot } = useHistorySnapshot()
const { toggleShapeFormatPainter } = useShapeFormatPainter()

const updateElement = (props: Partial<PPTShapeElement>) => {
  slidesStore.updateElement({ id: handleElementId.value, props })
  addHistorySnapshot()
}

// 设置填充类型渐变、纯色
const updateFillType = (type: string) => {
  if (type === 'fill') {
    slidesStore.removeElementProps({
      id: handleElementId.value,
      propName: 'gradient',
    })

    slidesStore.removeElementProps({
      id: handleElementId.value,
      propName: 'fillPicture',
    })
    addHistorySnapshot()
  } else if (type === 'gradient') {
    currentGradientIndex.value = 0

    slidesStore.removeElementProps({
      id: handleElementId.value,
      propName: 'fillPicture',
    })
    updateElement({ gradient: gradient.value })
  } else {
    slidesStore.removeElementProps({
      id: handleElementId.value,
      propName: 'gradient',
    })
    updateElement({ fillPicture: fillPicture.value })
  }
}

const updateImgFill = (value: string) => {
  if (value === 'tile') {
    // 平铺设置 imgW imgH
    if (!fillPicture.value.imgW) {
      fillPicture.value.imgW = fillPicture.value.widthPixel / 4
    }
    if (!fillPicture.value.imgH) {
      fillPicture.value.imgH = fillPicture.value.heightPixel / 4
    }
  } else {
    if (fillPicture.value?.shapeClip?.range) {
    } else {
      delete fillPicture.value.imgW
      delete fillPicture.value.imgH
    }
  }
  updateElement({ imgFillType: value })
}

// 设置渐变填充
const updateGradient = (gradientProps: Partial<Gradient>) => {
  if (!gradient.value) return
  const _gradient = { ...gradient.value, ...gradientProps }
  updateElement({ gradient: _gradient })
}
const updateGradientColors = (color: string) => {
  const colors = gradient.value.colors.map((item, index) => {
    if (index === currentGradientIndex.value) return { ...item, color }
    return item
  })

  const props = { colors }

  updateGradient(props)
}

// 设置填充色
const updateFill = (value: string) => {
  const props: any = { fill: value }
  if (props.attrArry?.length) {
    props.attrArry.forEach((element) => {
      element.fill = initColor(value)
    })
  }
  updateElement(props)
}

const fileUpload = async (files: FileList) => {
  showTextArea.value = false
  const imageFile = files[0]
  if (!imageFile) return
  getSvgContent(imageFile).then((dataURL) => {
    if (dataURL) {
      replaceSvg(dataURL)
    }
  })
}

const textAreaValue = ref('')
const setSvgContent = async () => {
  try {
    if (textAreaValue.value.trim() === '') {
      return
    }
    let content: any = ''
    if (uploadType.value === 'url') {
      content = await fetchUrl(textAreaValue.value)
    } else {
      content = textAreaValue.value.replace(/\\"/g, '"').replace(/\\n/g, '\n')
    }

    replaceSvg(content)
  } catch (error) {
    if (uploadType.value === 'url') {
      message.error('无法获取资源数据')
    } else {
      message.error('SVG代码格式错误')
    }
  }
}

const replaceSvg = (content: string) => {
  const shape = returnNewShape(content)
  const hasOtherColor =
    shape.attrArry?.length > 0
      ? new Set(shape.attrArry.map((obj: any) => obj.fill)).size > 0
      : false

  if (hasOtherColor) {
    // 是多色 就不要之前的填充色
    shape.attrArry.forEach((element) => {
      if (!element.fill) {
        element.fill = '#00000000'
      }
      if (element['stroke-width'] === '4') {
        element['stroke-width'] = 2
      }
    })
  }
  changeShape(shape)
}

// 替换图片（保持当前的样式）
const replaceImage = async (files: FileList) => {
  const imageFile = files[0]
  if (!imageFile) return
  if (userToken.value) {
    message.info(t('toolbar.uploadTips2'))
    const res = await onUploads(imageFile, 'image')
    if (res.url) {
      fillPicture.value.src = res.url
      const imgWH = await getImageSize(res.url)
      fillPicture.value.widthPixel = imgWH.width
      fillPicture.value.heightPixel = imgWH.height
      updateElement({ fillPicture: fillPicture.value })
      message.closeAll()
    }
  } else {
    getImageDataURL(imageFile).then((dataURL) => {
      fillPicture.value.src = dataURL
      updateElement({ fillPicture: fillPicture.value })
    })
  }
  addHistorySnapshot()
}

const handleUploadType = (type: string) => {
  uploadType.value = type
  showUploadType.value = false
  showTextArea.value = true
  textAreaValue.value = ''
}
// 段落对其
const updateTextAlign = (align: 'top' | 'center' | 'bottom') => {
  const _handleElement = handleElement.value as PPTShapeElement

  const defaultText: ShapeText = {
    content: '',
    defaultFontName: '微软雅黑',
    defaultColor: '#000',
    align: 'center',
  }
  const _text = _handleElement.text || defaultText
  updateElement({ text: { ..._text, align } })
}

const resectHtmlContent = (style: string) => {
  const content = handleElement.value.text.content
  const doc = new DOMParser().parseFromString(content, 'text/html')
  const domObj: any = doc.body.childNodes
  let str = ''
  for (let i = 0; i < domObj.length; i++) {
    const element = domObj[i]
    element.style.removeProperty(style)
    str += element.outerHTML
  }
  return str
}

// 设置行高
const updateLineHeight = (value: number) => {
  const content = resectHtmlContent('line-height')
  const text = handleElement.value.text
  text.lineHeight = value
  text.content = content

  updateElement({ text })
}

// 设置段间距
const updateParagraphSpace = (value: number) => {
  const content = resectHtmlContent('margin-top')
  const text = handleElement.value.text
  text.paragraphSpace = value
  text.content = content
  updateElement({ text })
}

// 设置字间距
const updateWordSpace = (value: number) => {
  const text = handleElement.value.text
  text.wordSpace = value
  updateElement({ text })
}
</script>

<style lang="scss" scoped>
.shape-style-panel {
  user-select: none;
}
.file-btn {
  display: inline-block;
  padding: 7rem 8rem;
  background: #fff;
  cursor: pointer;
  border-radius: 6rem;
  color: $themeColor;
  &:hover {
    background: #ebe9fd;
    color: $themeColor;
  }

  &:active {
    background: $themeColor;
    color: #fff;
  }
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
}
.shape-pool {
  width: 100%;
  overflow: auto;
  padding: 5rem;
  padding-right: 10rem;
  margin-bottom: 20rem;
  height: 130rem;
  border-radius: 6rem;
  box-sizing: border-box;
  border: 1px solid $lightColor;
}
.shape-list {
  @include flex-grid-layout();
}
.shape-item {
  @include flex-grid-layout-children(8, 14%);

  height: 0;
  padding-bottom: 14%;
  flex-shrink: 0;
}
</style>
