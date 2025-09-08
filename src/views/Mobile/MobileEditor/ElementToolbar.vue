<template>
  <div class="element-toolbar">
    <template v-if="!handleElement">
      <div class="mode-tips-title toolbar-title-mobile">
        <span> 幻灯片背景</span>
      </div>
      <div class="bg_tab">
        <div
          class="bg_tab_item"
          v-for="item in bgTab"
          :key="item"
          @click="activeBg = item.key"
          :class="activeBg === item.key ? 'bg_tab_active' : ''"
        >
          {{ item.name }}
        </div>
      </div>

      <template v-if="activeBg === 'colorBg'">
        <!-- 系统色 -->
        <div class="tips-name">主题色</div>
        <div class="bg_colors">
          <div
            class="color-block"
            v-for="color in themeColors"
            :key="color"
            :style="{ backgroundColor: initColor(color) }"
            @click="updateBgColor(color)"
          ></div>
        </div>
        <div class="tips-name">系统色</div>
        <div class="bg_colors">
          <div
            class="color-block"
            v-for="color in colors"
            :style="{ backgroundColor: color }"
            :key="color"
            @click="updateBgColor(color)"
          ></div>
        </div>
      </template>
      <template v-else>
        <FileInput @change="(files) => uploadBackgroundImage(files, 'bg')">
          <div
            class="background-image"
            :style="{ backgroundImage: `url(${background.image?.src})` }"
          >
            <div class="content">
              <template v-if="uploadLoading">
                <div class="spinner"></div>
                <p>上传中，请稍后...</p>
              </template>
              <template v-else>
                <IconUpload style="font-size: 20rem; margin-right: 4rem" />
                <p>{{ background.image?.src ? '替换图片' : '上传本地图片' }}</p>
              </template>
            </div>
          </div>
        </FileInput>
      </template>
    </template>
    <template v-else>
      <Tabs
        :tabs="tabs"
        v-model:value="activeTab"
        :tabsStyle="{
          marginBottom: '8rem',
          justifyContent: 'space-around',
        }"
        :tabStyle="{
          paddingLeft: '20rem',
          paddingRight: '20rem',
        }"
      />

      <div class="content">
        <div
          class="style"
          v-if="activeTab === 'style' || activeTab === 'commonStyle'"
        >
          <template v-if="activeTab === 'style'">
            <div class="row-box">
              <div class="row-name">基本样式</div>
              <div class="row row-content">
                <CheckboxButton
                  style="flex: 1"
                  :checked="richTextAttrs.bold"
                  @click="emitRichTextCommand('bold')"
                  ><i class="iconfont toobar-icon-sizes icon-jiacu"></i>
                </CheckboxButton>
                <CheckboxButton
                  style="flex: 1"
                  :checked="richTextAttrs.em"
                  @click="emitRichTextCommand('em')"
                  ><i class="iconfont toobar-icon-sizes icon-xieti"></i>
                </CheckboxButton>
                <CheckboxButton
                  style="flex: 1"
                  :checked="richTextAttrs.underline"
                  @click="emitRichTextCommand('underline')"
                  ><i class="iconfont toobar-icon-sizes icon-xiahuaxian"></i>
                </CheckboxButton>
                <CheckboxButton
                  style="flex: 1"
                  :checked="richTextAttrs.strikethrough"
                  @click="emitRichTextCommand('strikethrough')"
                  ><i class="iconfont toobar-icon-sizes icon-shanchuxian1"></i>
                </CheckboxButton>
              </div>
            </div>
            <div class="row-box">
              <div class="row-name">文本对齐</div>
              <div class="row row-content">
                <RadioGroup
                  class="row selec-text-algin"
                  button-style="solid"
                  :value="richTextAttrs.align"
                  @update:value="(value) => emitRichTextCommand('align', value)"
                >
                  <RadioButton value="left" style="flex: 1"
                    ><i class="iconfont icon-zuoduiqi toobar-icon-sizes"></i
                  ></RadioButton>
                  <RadioButton value="center" style="flex: 1"
                    ><i class="iconfont toobar-icon-sizes icon-juzhongduiqi"></i
                  ></RadioButton>
                  <RadioButton value="right" style="flex: 1"
                    ><i class="iconfont toobar-icon-sizes icon-youduiqi"></i
                  ></RadioButton>
                  <RadioButton value="justify" style="flex: 1"
                    ><i
                      class="iconfont toobar-icon-sizes icon-liangduanduiqi"
                    ></i
                  ></RadioButton>
                </RadioGroup>
              </div>
            </div>
            <div class="row-box">
              <div class="row-name">字体名称</div>
              <div class="row row-content">
                <Select
                  style="width: 100%"
                  :value="richTextAttrs.fontname"
                  @update:value="
                    (value) => emitRichTextCommand('fontname', value)
                  "
                  :options="[...availableFonts, ...WEB_FONTS()]"
                >
                  <template #icon>
                    <IconFontSize />
                  </template>
                </Select>
              </div>
            </div>
            <div class="row-box">
              <div class="row-name">字体大小</div>
              <div class="row row-content">
                <Select
                  style="flex: 1"
                  :value="richTextAttrs.fontsize"
                  @update:value="value => emitRichTextCommand('fontsize', value as string)"
                  :options="
                    fontSizeOptions.map((item) => ({
                      label: item,
                      value: item,
                    }))
                  "
                >
                  <template #icon>
                    <IconAddText />
                  </template>
                </Select>

                <div
                  class="font-size-btn-moblie"
                  @click="emitRichTextCommand('fontsize-add')"
                >
                  <IconAddOne />
                </div>

                <div
                  class="font-size-btn-moblie"
                  @click="emitRichTextCommand('fontsize-reduce')"
                >
                  <IconReduceOne />
                </div>
              </div>
            </div>
          </template>

          <div class="row-box name-one-line">
            <div class="row-name">字体颜色</div>

            <div class="row row-content">
              <div class="tips-name">主题色</div>
              <div class="bg_colors">
                <div
                  class="color-block"
                  v-for="color in themeColors"
                  :key="color"
                  :style="{ backgroundColor: initColor(color) }"
                  @click="updateFontColor(color)"
                ></div>
              </div>
              <div class="tips-name">系统色</div>
              <div class="bg_colors">
                <div
                  class="color-block"
                  v-for="color in colors"
                  :style="{ backgroundColor: color }"
                  :key="color"
                  @click="updateFontColor(color)"
                ></div>
              </div>
            </div>
          </div>
          <div class="row-box name-one-line">
            <div class="row-name">
              {{ activeTab === 'commonStyle' ? '填充颜色' : '背景颜色' }}
            </div>
            <div class="row row-content">
              <div class="tips-name">主题色</div>
              <div class="bg_colors">
                <div
                  class="color-block"
                  v-for="color in themeColors"
                  :key="color"
                  :style="{ backgroundColor: initColor(color) }"
                  @click="handleSetBgColor(color)"
                ></div>
              </div>
              <div class="tips-name">系统色</div>
              <div class="bg_colors">
                <div
                  class="color-block"
                  v-for="color in colors"
                  :style="{ backgroundColor: color }"
                  :key="color"
                  @click="handleSetBgColor(color)"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="shape" v-if="activeTab === 'shape'">
          <div class="row-box name-one-line">
            <div class="row-name">填充颜色</div>
            <div class="row row-content">
              <div class="tips-name">主题色</div>
              <div class="bg_colors">
                <div
                  class="color-block"
                  v-for="color in themeColors"
                  :key="color"
                  :style="{ backgroundColor: initColor(color) }"
                  @click="handleSetBgColor(color)"
                ></div>
              </div>
              <div class="tips-name">系统色</div>
              <div class="bg_colors">
                <div
                  class="color-block"
                  v-for="color in colors"
                  :style="{ backgroundColor: color }"
                  :key="color"
                  @click="handleSetBgColor(color)"
                ></div>
              </div>
            </div>
          </div>
          <div class="row-block">
            <div class="row-name" style="margin-top: 5rem">形状类型</div>
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
        </div>

        <template v-if="activeTab === 'image'">
          <div class="row-box element-image-bbox">
            <div class="row-name">替换图片</div>
            <div class="row row-content element-image">
              <FileInput
                @change="(files) => uploadBackgroundImage(files, 'element')"
              >
                <div
                  class="background-image"
                  :style="{
                    backgroundImage: `url(${handleElement?.src})`,
                    height: '100rem',
                    width: '100%',
                  }"
                >
                  <div class="content">
                    <template v-if="uploadLoading">
                      <div class="spinner"></div>
                      <p>上传中，请稍后...</p>
                    </template>
                    <template v-else>
                      <IconUpload
                        style="font-size: 20rem; margin-right: 4rem"
                      />
                      <p>上传本地图片</p>
                    </template>
                  </div>
                </div>
              </FileInput>
            </div>
          </div>
        </template>

        <div class="common" v-if="activeTab === 'common'">
          <div class="row-box">
            <div class="row-name">位置设置</div>
            <div class="row row-content">
              <NumberInput
                :step="5"
                :value="left"
                @update:value="(value) => setPositionInput(value, 'left')"
                style="width: 21%; margin-right: 4rem"
              >
              </NumberInput>
              <NumberInput
                :step="5"
                :value="top"
                @update:value="(value) => setPositionInput(value, 'top')"
                style="width: 21%; margin-right: 4rem"
              >
              </NumberInput>
              <Button style="flex: 1" @click="setPosition('left')">
                <IconToLeft class="icon" />
              </Button>
              <Button style="flex: 1" @click="setPosition('right')">
                <IconToRight class="icon" />
              </Button>
              <Button style="flex: 1" @click="setPosition('top')">
                <IconToTop class="icon" />
              </Button>
              <Button style="flex: 1" @click="setPosition('bottom')">
                <IconToBottom class="icon" />
              </Button>
            </div>
          </div>
          <div class="row-box">
            <div class="row-name">大小设置</div>
            <div class="row row-content">
              <NumberInput
                :step="1"
                :value="width"
                @update:value="(value) => updateSize(value, 'w')"
                style="flex: 1; margin-right: 4rem"
              >
                <template #prefix> 宽度： </template>
              </NumberInput>
              <NumberInput
                :step="1"
                :value="height"
                @update:value="(value) => updateSize(value, 'h')"
                style="flex: 1"
              >
                <template #prefix> 高度： </template>
              </NumberInput>
            </div>
          </div>
          <div class="row-box">
            <div class="row-name">旋转角度</div>
            <div class="row row-content">
              <NumberInput
                :step="1"
                :value="rotate"
                style="width: 100rem"
                @update:value="value => updateRotate(value as number)"
              >
              </NumberInput>
              <!-- <Button
                style="width: 60rem; margin-right: 10rem"
                @click="updateRotate(180)"
              >
                180°
              </Button> -->
              <Slider
                :min="-180"
                :max="180"
                :step="5"
                :value="rotate"
                style="flex: 1"
                @update:value="value => updateRotate(value as number)"
              />
            </div>
          </div>

          <div class="row-box" style="align-items: self-start">
            <div class="row-name" style="line-height: 38rem">图层顺序</div>
            <div class="row row-content">
              <Button
                class="position-leve"
                @click="orderElement(handleElement!, ElementOrderCommands.DOWN)"
                ><i class="iconfont icon-xiayi toobar-icon-sizes icon"></i>
                下移一层</Button
              >
              <Button
                class="position-leve"
                style="margin-right: 0"
                @click="orderElement(handleElement!, ElementOrderCommands.UP)"
              >
                <i class="iconfont icon-shangyi toobar-icon-sizes icon"></i>
                上移一层</Button
              >

              <Button
                class="position-leve"
                style="margin-left: 0"
                @click="
                  orderElement(handleElement!, ElementOrderCommands.BOTTOM)
                "
                ><i class="iconfont icon-zhiding1 toobar-icon-sizes icon"></i>
                置于底部</Button
              >
              <Button
                class="position-leve"
                style="margin-right: 0"
                @click="orderElement(handleElement!, ElementOrderCommands.TOP)"
                ><i class="iconfont icon-zhidi toobar-icon-sizes icon"></i
                >置于顶部</Button
              >
            </div>
          </div>

          <div class="row-box" style="align-items: self-start">
            <div class="row-name" style="line-height: 38rem">元素对齐</div>
            <div class="row row-content">
              <Button
                class="algin-btn"
                @click="alignElementToCanvas(ElementAlignCommands.LEFT)"
                ><i class="iconfont icon-zuoduiqi1 toobar-icon-sizes icon"></i>
                左对齐</Button
              >
              <Button
                class="algin-btn"
                @click="alignElementToCanvas(ElementAlignCommands.HORIZONTAL)"
                ><i
                  class="iconfont icon-shuipingjuzhong toobar-icon-sizes icon"
                ></i
                >水平居中</Button
              >
              <Button
                class="algin-btn"
                style="margin-right: 0"
                @click="alignElementToCanvas(ElementAlignCommands.RIGHT)"
                ><i class="iconfont icon-youduiqi1 toobar-icon-sizes icon"></i
                >右对齐</Button
              >
              <Button
                class="algin-btn"
                style="margin-left: 0"
                @click="alignElementToCanvas(ElementAlignCommands.TOP)"
                ><i class="iconfont icon-shangduiqi toobar-icon-sizes icon"></i>
                上对齐</Button
              >
              <Button
                class="algin-btn"
                @click="alignElementToCanvas(ElementAlignCommands.VERTICAL)"
                ><i
                  class="iconfont icon-chuizhijuzhong toobar-icon-sizes icon"
                ></i
                >垂直居中</Button
              >
              <Button
                class="algin-btn"
                @click="alignElementToCanvas(ElementAlignCommands.BOTTOM)"
                ><i class="iconfont icon-xiaduiqi toobar-icon-sizes icon"></i>
                下对齐</Button
              >
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue'
import { round } from 'lodash'
import { storeToRefs } from 'pinia'
import { WEB_FONTS } from '@/configs/font'
import { useMainStore, useSlidesStore } from '@/store'
import type {
  PPTElement,
  TableCell,
  GradientType,
  PPTShapeElement,
  Gradient,
  ShapeText,
} from '@/types/slides'
import { ElementAlignCommands, ElementOrderCommands } from '@/types/edit'
import emitter, { EmitterEvents } from '@/utils/emitter'
import useOrderElement from '@/hooks/useOrderElement'
import useAlignElementToCanvas from '@/hooks/useAlignElementToCanvas'
import useDeleteElement from '@/hooks/useDeleteElement'
import useAddSlidesOrElements from '@/hooks/useAddSlidesOrElements'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import NumberInput from '@/components/NumberInput.vue'
import CheckboxButton from '@/components/CheckboxButton.vue'
import Tabs from '@/components/Tabs.vue'
import Divider from '@/components/Divider.vue'
import Button from '@/components/Button.vue'
import ButtonGroup from '@/components/ButtonGroup.vue'
import RadioButton from '@/components/RadioButton.vue'
import RadioGroup from '@/components/RadioGroup.vue'
import FileInput from '@/components/FileInput.vue'
import Slider from '@/components/Slider.vue'
import Select from '@/components/Select.vue'

import { getImageDataURL } from '@/utils/image'
import { onUploads } from '@/utils/upload'
import message from '@/utils/message'
import {
  type ShapePoolItem,
  SHAPE_LIST,
  SHAPE_PATH_FORMULAS,
} from '@/configs/shapes'
import ShapeItemThumbnail from '@/views/Editor/RightToobar/ShapeItemThumbnail.vue'
import useColor from '@/hooks/useColor'

const { initColor } = useColor()
interface TabItem {
  key: 'style' | 'common' | 'shape'
  label: string
}

const fontSizeOptions = [
  '12px',
  '14px',
  '16px',
  '18px',
  '20px',
  '22px',
  '24px',
  '28px',
  '32px',
  '36px',
  '40px',
  '44px',
  '48px',
  '54px',
  '60px',
  '66px',
  '72px',
  '76px',
  '80px',
  '88px',
  '96px',
  '104px',
  '112px',
  '120px',
]

const colors = [
  '#000000',
  '#ffffff',
  '#eeece1',
  '#1e497b',
  '#4e81bb',
  '#e2534d',
  '#9aba60',
  '#8165a0',
  '#47acc5',
  '#f9974c',
  '#c21401',
  '#ff1e02',
  '#ffc12a',
  '#ffff3a',
  '#90cf5b',
  '#00af57',
]

const themeColors: any = [
  {
    type: 'themeColor',
    value: 'text1',
    transparent: '1',
  },
  {
    type: 'themeColor',
    value: 'bg1',
    transparent: '1',
  },
  {
    type: 'themeColor',
    value: 'text2',
    transparent: '1',
  },
  {
    type: 'themeColor',
    value: 'bg2',
    transparent: '1',
  },
  {
    type: 'themeColor',
    value: 'accent1',
    transparent: '1',
  },
  {
    type: 'themeColor',
    value: 'accent2',
    transparent: '1',
  },
  {
    type: 'themeColor',
    value: 'accent3',
    transparent: '1',
  },
  {
    type: 'themeColor',
    value: 'accent4',
    transparent: '1',
  },
  {
    type: 'themeColor',
    value: 'accent5',
    transparent: '1',
  },
  {
    type: 'themeColor',
    value: 'accent6',
    transparent: '1',
  },
]
const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const { slides, currentSlide } = storeToRefs(slidesStore)
const {
  handleElement,
  handleElementId,
  richTextAttrs,
  availableFonts,
  userToken,
} = storeToRefs(mainStore)

const { addHistorySnapshot } = useHistorySnapshot()

const left = ref(0)
const top = ref(0)
const width = ref(0)
const height = ref(0)
const rotate = ref(0)
const tabs = ref([
  { key: 'commonStyle', label: '通用样式' },
  { key: 'common', label: '位置大小' },
])

const bgTab = ref([
  {
    key: 'colorBg',
    name: '纯色背景',
  },
  {
    kay: 'imgBg',
    name: '图片背景',
  },
])

const activeBg = ref('colorBg')
const activeTab = ref('common')

const { orderElement } = useOrderElement()
const { alignElementToCanvas } = useAlignElementToCanvas()
const { addElementsFromData } = useAddSlidesOrElements()
const { deleteElement } = useDeleteElement()

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

watch(
  handleElement,
  () => {
    if (!handleElement.value) return
    left.value = parseInt(handleElement.value.left)
    top.value = parseInt(handleElement.value.top)
    width.value = parseInt(handleElement.value.width)
    height.value = parseInt(handleElement.value.height)
    if (handleElement.value.type !== 'line') {
      rotate.value =
        'rotate' in handleElement.value &&
        handleElement.value.rotate !== undefined
          ? round(handleElement.value.rotate, 1)
          : 0
    }

    if (handleElement.value.type === 'shape') {
      if (handleElement.value?.text) {
        tabs.value = [
          { key: 'style', label: '文本样式' },
          { key: 'shape', label: '形状样式' },
          { key: 'common', label: '位置大小' },
        ]
      } else {
        tabs.value = [
          { key: 'shape', label: '形状样式' },
          { key: 'common', label: '位置大小' },
        ]
      }
    } else if (handleElement.value.type === 'image') {
      tabs.value = [
        { key: 'image', label: '图片样式' },
        { key: 'common', label: '位置大小' },
      ]
    } else if (handleElement.value.type === 'text') {
      tabs.value = [
        { key: 'style', label: '文本样式' },
        { key: 'common', label: '位置大小' },
      ]
    }
  },
  { deep: true, immediate: true }
)

const updateElement = (id: string, props: Partial<PPTElement>) => {
  slidesStore.updateElement({ id, props })
  addHistorySnapshot()
}

const updateShapeElement = (props: Partial<PPTShapeElement>) => {
  slidesStore.updateElement({ id: handleElementId.value, props })
  addHistorySnapshot()
}

const updateBgColor = (color) => {
  let colorObj: any = {
    type: 'rgb',
    value: '#ffffff',
    transparent: 1,
  }
  if (typeof color === 'string') {
    colorObj.value = color
  } else if (typeof color === 'object') {
    colorObj = color
  }

  const newBackground: SlideBackground = {
    ...background.value,
    type: 'solid',
    color: colorObj,
  }
  slidesStore.updateSlide({ background: newBackground })
  addHistorySnapshot()
}
const uploadLoading = ref(false)
// 上传背景图片
const uploadBackgroundImage = async (files: FileList, type: string) => {
  uploadLoading.value = true
  const imageFile = files[0]
  if (!imageFile) {
    uploadLoading.value = false
    return
  }
  try {
    if (userToken.value) {
      message.info('正在上传图片中，请稍后...')
      const res = await onUploads(imageFile, 'image')
      if (res.url) {
        if (type === 'bg') {
          updateImageBackground(res.url)
        } else {
          updateElement(handleElementId.value, { src: res.url })
        }
        message.closeAll()
      }

      uploadLoading.value = false
    } else {
      getImageDataURL(imageFile).then((dataURL) => {
        if (type === 'bg') {
          updateImageBackground(dataURL)
        } else {
          updateElement(handleElementId.value, { src: dataURL })
        }
        uploadLoading.value = false
      })
    }
  } catch (error) {
    uploadLoading.value = false
  }
}

// 设置图片背景
const updateImageBackground = (url: string) => {
  const newProps = {
    image: {
      size: 'cover',
      src: url,
    },
    type: 'image',
  }
  slidesStore.updateSlide({ background: { ...background.value, ...newProps } })
  addHistorySnapshot()
}

const copyElement = () => {
  const element: PPTElement = JSON.parse(JSON.stringify(handleElement.value))
  addElementsFromData([element])
}

const emitRichTextCommand = (command: string, value?: string) => {
  emitter.emit(EmitterEvents.RICH_TEXT_COMMAND, { action: { command, value } })
}

const updateRotate = (value: number) => {
  const props = { rotate: value }
  slidesStore.updateElement({ id: handleElementId.value, props })
  addHistorySnapshot()
}
const updateSize = (value: any, type: string) => {
  const props: any = {}
  if (type === 'w') {
    props.width = value
  } else {
    props.height = value
  }
  slidesStore.updateElement({ id: handleElementId.value, props })
  addHistorySnapshot()
}

const setPositionInput = (value: number, type: string) => {
  const props = {}
  if (type === 'left') {
    props.left = value
  }
  if (type === 'top') {
    props.top = value
  }
  slidesStore.updateElement({ id: handleElementId.value, props })
  addHistorySnapshot()
}
const setPosition = (type: string) => {
  if (type === 'left') {
    left.value = left.value - 5
  } else if (type === 'right') {
    left.value = left.value + 5
  } else if (type === 'top') {
    top.value = top.value - 5
  } else if (type === 'bottom') {
    top.value = top.value + 5
  }
  const props = {
    left: left.value,
    top: top.value,
  }
  slidesStore.updateElement({ id: handleElementId.value, props })
  addHistorySnapshot()
}

// 将元素旋转45度（顺时针或逆时针）
const updateRotate45 = (command: '+' | '-') => {
  let _rotate = Math.floor(rotate.value / 45) * 45
  if (command === '+') _rotate = _rotate + 45
  else if (command === '-') _rotate = _rotate - 45

  if (_rotate < -180) _rotate = -180
  if (_rotate > 180) _rotate = 180

  const props = { rotate: _rotate }
  slidesStore.updateElement({ id: handleElementId.value, props })
  addHistorySnapshot()
}

// 修改形状
const changeShape = (shape: ShapePoolItem) => {
  const { width, height } = handleElement.value as PPTShapeElement
  const props: Partial<PPTShapeElement> = {
    viewBox: shape.viewBox,
    path: shape.path,
    special: shape.special,
  }
  if (shape.pathFormula) {
    props.pathFormula = shape.pathFormula
    props.viewBox = [width, height]

    const pathFormula = SHAPE_PATH_FORMULAS[shape.pathFormula]
    if ('editable' in pathFormula) {
      props.path = pathFormula.formula(width, height, pathFormula.defaultValue)
      props.keypoints = pathFormula.defaultValue
    } else props.path = pathFormula.formula(width, height)
  } else {
    props.pathFormula = undefined
    props.keypoints = undefined
  }
  updateShapeElement(props)
}
const updateFontColor = (color: any) => {
  if (!handleElement.value) return
  let colorObj = null
  if (typeof color === 'object') {
    colorObj = JSON.parse(JSON.stringify(color))
  } else {
    colorObj = {
      transparent: 1,
      type: 'rgb',
      value: color,
    }
  }
  color = initColor(color)
  if (
    handleElement.value.type === 'text' ||
    (handleElement.value.type === 'shape' && handleElement.value.text?.content)
  ) {
    emitter.emit(EmitterEvents.RICH_TEXT_COMMAND, {
      action: { command: 'color', value: color },
    })
  }
  if (handleElement.value.type === 'table') {
    const data: TableCell[][] = JSON.parse(
      JSON.stringify(handleElement.value.data)
    )
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data[i].length; j++) {
        const style = data[i][j].style || {}
        data[i][j].style = { ...style, color: colorObj }
      }
    }
    updateElement(handleElementId.value, { data })
  }
  if (handleElement.value.type === 'latex') {
    updateElement(handleElementId.value, { color: colorObj })
  }
}
const handleSetBgColor = (color: any) => {
  let colorObj = null
  if (typeof color === 'object') {
    colorObj = JSON.parse(JSON.stringify(color))
  } else {
    colorObj = {
      transparent: 1,
      type: 'rgb',
      value: color,
    }
  }
  if (activeTab.value === 'style') {
    // 字体背景颜色
    const value = initColor(color)
    emitRichTextCommand('backcolor', value)
  } else {
    // 背景填充
    updateFill(colorObj)
  }
}
const updateFill = (colorObj: any) => {
  if (!handleElement.value) return
  if (
    handleElement.value.type === 'text' ||
    handleElement.value.type === 'shape' ||
    handleElement.value.type === 'chart'
  ) {
    updateElement(handleElementId.value, { fill: colorObj })
  }

  if (handleElement.value.type === 'table') {
    const data: TableCell[][] = JSON.parse(
      JSON.stringify(handleElement.value.data)
    )
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data[i].length; j++) {
        const style = data[i][j].style || {}
        data[i][j].style = { ...style, backcolor: colorObj }
      }
    }
    updateElement(handleElementId.value, { data })
  }

  if (handleElement.value.type === 'audio') {
    updateElement(handleElementId.value, { color: colorObj })
  }
}
</script>

<style lang="scss" scoped>
.element-toolbar {
  @include mobile-element-toolber();
  padding: 10rem;
  height: 380rem;
  color: #1a1a1a;
  font-size: 12rem;
  ::v-deep(.tab) {
    font-weight: 400 !important;
  }

  ::v-deep(.number-input input) {
    height: 40rem !important;
    line-height: 40rem !important;
  }
  ::v-deep(input&:focus-visible) {
    outline: none !important;
  }

  ::v-deep(button) {
    height: 40rem !important;
    line-height: 40rem !important;
  }
}
.background-image {
  font-size: 14rem;
  height: 0;
  padding-bottom: 56.25%;
  border: 1rem dashed $borderColor;
  border-radius: 20rem;
  background-size: 100% 100%;
  position: relative;
  transition: all $transitionDelay;
  border-color: $themeColor;
  color: $themeColor;

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
  ::-webkit-scrollbar {
    width: 0rem;
    height: 0rem;
  }
}

.shape-pool {
  width: 100%;
  height: 100rem;
  overflow: auto;
  margin-bottom: 20rem;
  border-radius: 6rem;
  padding: 0;
  box-sizing: border-box;
}
.shape-list {
  @include flex-grid-layout();
}
.shape-item {
  @include flex-grid-layout-children(10, 14%);

  height: 0;
  padding-bottom: 14%;
  flex-shrink: 0;
}

.text-btn {
  height: 30rem;
  line-height: 30rem;
  text-align: center;
  cursor: pointer;
  font-size: 14rem;
  border-radius: 6rem;
  margin-left: 5rem;
  border: 1rem solid #dddaff;

  &:hover {
    background-color: #efefef;
  }
}

.content {
  padding: 10rem;
  flex: 1;
  overflow: auto;
}
.row {
  width: 100%;
  display: flex;
  align-items: center;
  margin-bottom: 10rem;

  .icon {
    margin-right: 3rem;
  }
}

.row-box {
  display: flex;
  align-items: center;
  padding: 8rem 10rem;
  border-radius: 10rem;
  background: #f9f9f9;
  margin-bottom: 10rem;
  .row-name {
    width: 80rem;
    font-size: 14rem;
    user-select: none;
  }

  .row-content {
    flex-wrap: wrap;
    margin-bottom: 0;
    .position-leve {
      width: 49%;
      margin: 2rem 2rem 2rem 0;
    }

    .algin-btn {
      width: 32%;
      margin: 2rem 2rem 2rem 0;
      padding: 0 10rem !important;
    }
    .button + button {
      margin-left: 2rem;
    }

    .button.default {
      color: #6d6c6c;
    }

    .selec-text-algin {
      margin-bottom: 0;
      button.button:first-child {
        border-radius: 6rem !important;
        border-right-width: 1rem;
      }
      .button + button {
        margin: 0 2rem;
        border-radius: 6rem;
        border-right-width: 1rem;
      }
    }
  }
}

.name-one-line {
  flex-wrap: wrap;
  .row-name {
    width: 100%;
    margin: 10rem 0;
    user-select: none;
  }
  .bg_colors {
    justify-content: space-between;
  }
}
.element-image-bbox {
  flex-wrap: wrap;
  .row-name {
    width: 100%;
    margin: 10rem 0;
    user-select: none;
  }

  .element-image {
    justify-content: flex-end;
    .file-input {
      width: 100%;
      height: 100%;
      .background-image {
        border-radius: 10rem;
      }
      .content {
        background-color: rgba(236, 234, 234, 0.453);
        color: #201f1f;
      }
    }
  }
}
.font-size-btn-moblie {
  width: 30rem;
  font-size: 18rem;
  color: #6d6c6c;
  text-align: center;
}
.fontStyle {
  .button + button {
    margin-left: 10rem;
  }
}
.row-block {
  margin-bottom: 10rem;
  background-color: $hoverbg;
  border-radius: $borderRadius;
  padding: 10rem;
}
.label {
  font-size: 14rem;
  margin-bottom: 20rem;
  margin-left: 6rem;
}
.colors {
  @include flex-grid-layout();
}
.color {
  @include flex-grid-layout-children(8, 12%);
  padding-bottom: 5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .color-block {
    width: 30rem;
    height: 30rem;
    border-radius: 50%;
  }
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

.bg_tab {
  font-size: 16rem;
  display: flex;
  background-color: #f2f2f4;
  border-radius: 10rem;
  margin-bottom: 14rem;
  .bg_tab_item {
    width: 50%;
    text-align: center;
    line-height: 40rem;
  }

  .bg_tab_active {
    background-color: $themeColor;
    color: #fff;
    border-radius: 10rem;
  }
}

.tips-name {
  font-size: 14rem;
  padding-bottom: 10rem;
  color: #6d6c6c;
  padding-left: 10rem;
}

.bg_colors {
  padding-bottom: 5rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;

  .color-block {
    margin: 4rem 5rem;
    width: 63rem;
    height: 24rem;
    border-radius: 30rem;
    border: 1rem solid #dddaff;
  }
}
</style>
<style lang="scss">
.element-toolbar {
  input,
  input:focus {
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  }
}
</style>
