<template>
  <div class="text-style-panel">
    <!-- <div class="preset-style">
      <div
        class="preset-style-item"
        v-for="item in presetStyles"
        :key="item.label"
        :style="item.style"
        @click="emitBatchRichTextCommand(item.cmd)"
      >
        {{ item.label }}
      </div>
    </div>
    

    <Divider /> -->

    <template v-if="!borderShow">
      <div class="row" v-if="name">
        <div style="width: 30%">{{ $t('toolbar.viewname') }}</div>
        <div style="width: 70%">{{ name }}</div>
      </div>
      <RichTextBase>
        <template #paragraph>
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
    </template>
    <template v-else>
      <div class="row">
        <div style="width: 40%">{{ $t('toolbar.fileColor') }}</div>
        <Popover trigger="click" style="width: 60%">
          <template #content>
            <ColorPicker
              :modelValue="fill"
              @update:modelValue="(value) => updateFill(value)"
            />
          </template>
          <ColorButton :color="fill" />
        </Popover>
      </div>
      <!-- <Divider /> -->
      <ElementOutline />
      <Divider />
      <ElementShadow />
      <Divider />
      <ElementOpacity />
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import type { PPTTextElement } from '@/types/slides'
import emitter, { EmitterEvents, type RichTextAction } from '@/utils/emitter'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import FontSizeBox from '../common/FontSizeBox.vue'
import ElementOpacity from '../common/ElementOpacity.vue'
import ElementOutline from '../common/ElementOutline.vue'
import ElementShadow from '../common/ElementShadow.vue'
import RichTextBase from '../common/RichTextBase.vue'
import ColorButton from '@/components/ColorButton.vue'
import ColorPicker from '@/components/ColorPicker/index.vue'
import Divider from '@/components/Divider.vue'
import Select from '@/components/Select.vue'
import Popover from '@/components/Popover.vue'
import useColor from '@/hooks/useColor'
import RadioGroup from '@/components/RadioGroup.vue'
import RadioButton from '@/components/RadioButton.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const props = withDefaults(
  defineProps<{
    borderShow?: boolean
  }>(),
  {
    borderShow: false,
  }
)

// 注意，存在一个未知原因的BUG，如果文本加粗后文本框高度增加，画布的可视区域定位会出现错误
// 因此在执行预置样式命令时，将加粗命令放在尽可能靠前的位置，避免字号增大后再加粗
const presetStyles = [
  {
    label: '大标题',
    style: {
      fontSize: '26rem',
      fontWeight: 700,
    },
    cmd: [
      { command: 'clear' },
      { command: 'bold' },
      { command: 'fontsize', value: '66rem' },
      { command: 'align', value: 'center' },
    ],
  },
  {
    label: '小标题',
    style: {
      fontSize: '22rem',
      fontWeight: 700,
    },
    cmd: [
      { command: 'clear' },
      { command: 'bold' },
      { command: 'fontsize', value: '40rem' },
      { command: 'align', value: 'center' },
    ],
  },
  {
    label: '正文',
    style: {
      fontSize: '20rem',
    },
    cmd: [{ command: 'clear' }, { command: 'fontsize', value: '20rem' }],
  },
  {
    label: '正文[小]',
    style: {
      fontSize: '18rem',
    },
    cmd: [{ command: 'clear' }, { command: 'fontsize', value: '18rem' }],
  },
  {
    label: '注释 1',
    style: {
      fontSize: '16rem',
      fontStyle: 'italic',
    },
    cmd: [
      { command: 'clear' },
      { command: 'fontsize', value: '16rem' },
      { command: 'em' },
    ],
  },
  {
    label: '注释 2',
    style: {
      fontSize: '16rem',
      textDecoration: 'underline',
    },
    cmd: [
      { command: 'clear' },
      { command: 'fontsize', value: '16rem' },
      { command: 'underline' },
    ],
  },
]

const textAlign = ref('top')
const { initColor } = useColor()
const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const { handleElement, handleElementId } = storeToRefs(mainStore)

const { addHistorySnapshot } = useHistorySnapshot()

const updateElement = (props: Partial<PPTTextElement>) => {
  slidesStore.updateElement({ id: handleElementId.value, props })
  addHistorySnapshot()
}

const fill = ref<string>('#000')
const lineHeight = ref<number>()
const wordSpace = ref<number>()
const paragraphSpace = ref<number>()
const autoSize = ref('')
const name = ref<string>('')

watch(
  handleElement,
  () => {
    if (!handleElement.value || handleElement.value.type !== 'text') return
    name.value = handleElement.value.name
    textAlign.value = handleElement.value?.verticalAlign || 'top'

    fill.value = initColor(handleElement.value.fill) || '#fff'
    lineHeight.value =
      parseFloat(handleElement.value?.lineHeight?.toFixed(2)) || 1.5
    wordSpace.value =
      parseFloat(handleElement.value?.wordSpace?.toFixed(2)) || 0
    autoSize.value = handleElement.value?.autoSize || 'none'
    paragraphSpace.value =
      handleElement.value.paragraphSpace === undefined
        ? 0
        : handleElement.value.paragraphSpace
    emitter.emit(EmitterEvents.SYNC_RICH_TEXT_ATTRS_TO_STORE)
  },
  { deep: true, immediate: true }
)

const lineHeightOptions = [
  0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.4, 1.5, 1.8, 2.0, 2.5, 3.0,
]
const wordSpaceOptions = [0, 1, 2, 3, 4, 5, 6, 8, 10]

const paragraphSpaceOptions = [0, 5, 10, 15, 20, 25, 30, 40, 50, 80]

const resectHtmlContent = (style: string) => {
  const content = handleElement.value.content
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
  updateElement({ lineHeight: value, content: content })
}

// 段落对其
const updateTextAlign = (value: 'top' | 'center' | 'bottom') => {
  updateElement({ verticalAlign: value })
}

// 设置段间距
const updateParagraphSpace = (value: number) => {
  const content = resectHtmlContent('margin-top')
  updateElement({ paragraphSpace: value, content: content })
}

// 设置字间距
const updateWordSpace = (value: number) => {
  updateElement({ wordSpace: value })
}

// 设置文本框填充
const updateFill = (value: any) => {
  updateElement({
    fill: value,
  })
}

// 发送富文本设置命令（批量）
const emitBatchRichTextCommand = (action: RichTextAction[]) => {
  emitter.emit(EmitterEvents.RICH_TEXT_COMMAND, { action })
}
</script>

<style lang="scss" scoped>
.text-style-panel {
  user-select: none;
}
.row {
  width: 100%;
  display: flex;
  align-items: center;
  margin-bottom: 10rem;
}
.preset-style {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 10rem;
}
.preset-style-item {
  width: 50%;
  height: 50rem;
  border: solid 1rem #d6d6d6;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  cursor: pointer;
  transition: all $transitionDelay;

  &:hover {
    border-color: $themeColor;
    color: $themeColor;
    z-index: 1;
  }

  &:nth-child(2n) {
    margin-left: -1rem;
  }
  &:nth-child(n + 3) {
    margin-top: -1rem;
  }
}
</style>
