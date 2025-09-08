<template>
  <div class="rich-text-base">
    <div class="row">
      <div style="width: 30%">{{ $t('toolbar.fontName') }}</div>
      <Select
        class="font-select"
        style="width: 70%"
        :value="richTextAttrs.fontname"
        @update:value="value => emitRichTextCommand('fontname', value as string)"
        :options="[...availableFonts, ...WEB_FONTS()]"
      >
        <template #icon>
          <IconFontSize />
        </template>
      </Select>
    </div>
    <div class="row">
      <div style="width: 30%">{{ $t('toolbar.fontSize') }}</div>
      <div style="width: 70%; display: flex; justify-content: space-between">
        <Select
          :showIntput="true"
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
        <Button
          class="font-size-btn"
          style="width: 20%"
          v-tooltip="t('toolbar.addSize')"
          @click="emitRichTextCommand('fontsize-add')"
        >
          <IconFontSize />+
        </Button>
        <Button
          last
          class="font-size-btn"
          style="width: 20%"
          v-tooltip="t('toolbar.reduceSize')"
          @click="emitRichTextCommand('fontsize-reduce')"
        >
          <IconFontSize />-
        </Button>
      </div>
    </div>

    <div class="row">
      <div style="width: 30%">{{ $t('toolbar.fontColor') }}</div>
      <Popover trigger="click" style="width: 70%">
        <template #content>
          <ColorPicker
            :modelValue="richTextAttrs.color"
            @update:modelValue="(value) => emitRichTextCommand('color', value)"
          />
        </template>
        <ColorButton :color="richTextAttrs.color" />
      </Popover>
    </div>

    <div class="row">
      <div style="width: 30%">{{ $t('toolbar.bgColor') }}</div>
      <Popover trigger="click" style="width: 70%">
        <template #content>
          <ColorPicker
            :modelValue="richTextAttrs.backcolor"
            @update:modelValue="
              (value) => emitRichTextCommand('backcolor', value)
            "
          />
        </template>
        <ColorButton :color="richTextAttrs.backcolor" />
      </Popover>
    </div>
    <div class="row" style="align-items: flex-start">
      <div style="width: 30%; padding-top: 10rem">
        {{ $t('toolbar.textStyle') }}
      </div>
      <div style="width: 70%">
        <ButtonGroup class="row" style="width: 100%">
          <CheckboxButton
            style="
              flex: 1;
              border-top-left-radius: 8rem;
              border-bottom-left-radius: 8rem;
            "
            :checked="richTextAttrs.bold"
            v-tooltip="t('toolbar.bold')"
            @click="emitRichTextCommand('bold')"
          >
            <i class="iconfont toobar-icon-sizes icon-jiacu"></i>
          </CheckboxButton>
          <CheckboxButton
            style="flex: 1"
            :checked="richTextAttrs.em"
            v-tooltip="t('toolbar.italic')"
            @click="emitRichTextCommand('em')"
          >
            <i class="iconfont toobar-icon-sizes icon-xieti"></i>
          </CheckboxButton>
          <CheckboxButton
            style="flex: 1"
            :checked="richTextAttrs.underline"
            v-tooltip="t('toolbar.underline')"
            @click="emitRichTextCommand('underline')"
          >
            <i class="iconfont toobar-icon-sizes icon-xiahuaxian"></i>
          </CheckboxButton>
          <CheckboxButton
            style="flex: 1"
            :checked="richTextAttrs.strikethrough"
            v-tooltip="t('toolbar.strikethrough')"
            @click="emitRichTextCommand('strikethrough')"
          >
            <i class="iconfont toobar-icon-sizes icon-shanchuxian1"></i>
          </CheckboxButton>
        </ButtonGroup>
        <ButtonGroup>
          <CheckboxButton
            style="
              flex: 1;
              border-top-left-radius: 8rem;
              border-bottom-left-radius: 8rem;
            "
            :checked="richTextAttrs.superscript"
            v-tooltip="t('toolbar.sup')"
            @click="emitRichTextCommand('superscript')"
          >
            <i class="iconfont toobar-icon-sizes icon-shangbiao"></i>
          </CheckboxButton>
          <CheckboxButton
            style="flex: 1"
            :checked="richTextAttrs.subscript"
            v-tooltip="t('toolbar.sub')"
            @click="emitRichTextCommand('subscript')"
          >
            <i class="iconfont toobar-icon-sizes icon-xiabiao"></i
          ></CheckboxButton>
          <CheckboxButton
            style="flex: 1"
            :checked="richTextAttrs.code"
            v-tooltip="t('toolbar.code')"
            @click="emitRichTextCommand('code')"
          >
            <i class="iconfont toobar-icon-sizes icon-hangneidaima"></i>
          </CheckboxButton>
          <CheckboxButton
            style="flex: 1"
            :checked="richTextAttrs.blockquote"
            v-tooltip="t('toolbar.blockquote')"
            @click="emitRichTextCommand('blockquote')"
          >
            <i class="iconfont toobar-icon-sizes icon-yinyong"></i>
          </CheckboxButton>
        </ButtonGroup>
      </div>
    </div>

    <Divider />
    <div class="row">
      <div style="width: 30%">{{ $t('toolbar.textAlign') }}</div>
      <div style="width: 70%">
        <RadioGroup
          class="row"
          style="margin-bottom: 0"
          button-style="solid"
          :value="richTextAttrs.align"
          @update:value="(value) => emitRichTextCommand('align', value)"
        >
          <RadioButton
            value="left"
            v-tooltip="t('toolbar.alignLeft')"
            style="flex: 1"
            ><i class="iconfont icon-zuoduiqi toobar-icon-sizes"></i
          ></RadioButton>
          <RadioButton
            value="center"
            v-tooltip="t('toolbar.alignCenter')"
            style="flex: 1"
            ><i class="iconfont toobar-icon-sizes icon-juzhongduiqi"></i
          ></RadioButton>
          <RadioButton
            value="right"
            v-tooltip="t('toolbar.alignRight')"
            style="flex: 1"
            ><i class="iconfont toobar-icon-sizes icon-youduiqi"></i
          ></RadioButton>
          <RadioButton
            value="justify"
            v-tooltip="t('toolbar.justify')"
            style="flex: 1"
            ><i class="iconfont toobar-icon-sizes icon-liangduanduiqi"></i
          ></RadioButton>
        </RadioGroup>
      </div>
    </div>

    <slot name="align"></slot>

    <div class="row">
      <div style="width: 30%">{{ $t('toolbar.pCode') }}</div>
      <div style="width: 70%">
        <div class="row" style="margin-bottom: 0">
          <ButtonGroup style="flex: 1" passive>
            <Button
              first
              :type="richTextAttrs.bulletList ? 'primary' : 'default'"
              style="flex: 1"
              v-tooltip="t('toolbar.bulletList')"
              @click="emitRichTextCommand('bulletList')"
              ><i class="iconfont toobar-icon-sizes icon-xiangmufuhao1"></i
            ></Button>
            <Popover trigger="click" v-model:value="bulletListPanelVisible">
              <template #content>
                <div class="list-wrap">
                  <div
                    class="list"
                    v-for="item in bulletListStyleTypeOption"
                    :key="item.key"
                    @click="emitRichTextCommand('bulletList', item.key)"
                  >
                    <i
                      class="iconfont"
                      :class="`icon-${item.icon}`"
                      style="font-size: 34px"
                    ></i>
                  </div>
                </div>
              </template>
              <Button last class="popover-btn">
                <IconDown />
              </Button>
            </Popover>
          </ButtonGroup>
          <div style="width: 10px"></div>
          <ButtonGroup style="flex: 1" passive>
            <Button
              first
              :type="richTextAttrs.orderedList ? 'primary' : 'default'"
              style="flex: 1"
              v-tooltip="t('toolbar.orderedList')"
              @click="emitRichTextCommand('orderedList')"
              ><i class="iconfont toobar-icon-sizes icon-bianhao1"></i
            ></Button>
            <Popover trigger="click" v-model:value="orderedListPanelVisible">
              <template #content>
                <div class="list-wrap" style="width: 158px">
                  <div
                    class="list"
                    v-for="item in orderedListStyleTypeOption"
                    :key="item.key"
                    @click="emitRichTextCommand('orderedList', item.key)"
                  >
                    <i
                      class="iconfont"
                      :class="`icon-${item.icon}`"
                      style="font-size: 34px"
                    ></i>
                  </div>

                  <!-- <ul
                    class="list"
                    v-for="item in orderedListStyleTypeOption"
                    :key="item"
                    :style="{ listStyleType: item }"
                    @click="emitRichTextCommand('orderedList', item)"
                  >
                    <li class="list-item" v-for="key in 3" :key="key">
                      <span></span>
                    </li>
                  </ul> -->
                </div>
              </template>
              <Button last class="popover-btn">
                <IconDown />
              </Button>
            </Popover>
          </ButtonGroup>
        </div>
      </div>
    </div>

    <div class="row">
      <div style="width: 30%">{{ $t('toolbar.pEm') }}</div>
      <div style="width: 70%">
        <div class="row" style="margin-bottom: 0">
          <!-- <ButtonGroup style="flex: 1" passive> -->
          <Button
            style="flex: 1"
            class="btn-color"
            v-tooltip="t('toolbar.indent')"
            @click="emitRichTextCommand('indent', '-1')"
            ><i class="iconfont toobar-icon-sizes icon-jianxiaoduanlasuojin"></i
          ></Button>

          <div style="width: 10px"></div>
          <Button
            style="flex: 1"
            class="btn-color"
            v-tooltip="t('toolbar.indentAdd')"
            @click="emitRichTextCommand('indent', '+1')"
            ><i class="iconfont toobar-icon-sizes icon-zengdaduanlasuojin"></i
          ></Button>
        </div>
      </div>
    </div>
    <div class="row">
      <div style="width: 30%">{{ $t('toolbar.em') }}</div>
      <div style="width: 70%">
        <div class="row" style="margin-bottom: 0">
          <Button
            class="btn-color"
            style="flex: 1"
            v-tooltip="t('toolbar.reduceEm')"
            @click="emitRichTextCommand('textIndent', '-1')"
            ><i class="iconfont toobar-icon-sizes icon-suojin1"></i
          ></Button>
          <div style="width: 10px"></div>
          <Button
            class="btn-color"
            style="flex: 1"
            v-tooltip="t('toolbar.addEm')"
            @click="emitRichTextCommand('textIndent', '+1')"
            ><i class="iconfont toobar-icon-sizes icon-suojin2"></i
          ></Button>
        </div>
      </div>
    </div>
    <slot name="paragraph"></slot>
    <div class="row" style="margin-top: 20rem; justify-content: center" passive>
      <!-- v-tooltip="'清除格式'" -->
      <Button
        @click="emitRichTextCommand('clear')"
        style="margin-right: 5rem; padiing: 0; flex: 1"
      >
        <i class="iconfont toobar-icon-sizes icon-geshiqingchu"></i>
        {{ $t('toolbar.clearStyle') }}</Button
      >
      <!-- v-tooltip="'格式刷（双击连续使用）'" -->

      <Button
        :checked="!!textFormatPainter"
        @click="toggleTextFormatPainter()"
        @dblclick="toggleTextFormatPainter(true)"
        style="padiing: 0; flex: 1"
      >
        <i class="iconfont toobar-icon-sizes icon-geshishua"></i>
        {{ $t('toolbar.formatePainter') }}</Button
      >
      <!-- <Popover
        placement="bottom-end"
        trigger="click"
        v-model:value="linkPopoverVisible"
        style="width: 33.33%"
      >
        <template #content>
          <div class="link-popover">
            <Input v-model:value="link" placeholder="请输入超链接" />
            <div class="btns">
              <Button
                size="small"
                :disabled="!richTextAttrs.link"
                @click="removeLink()"
                style="margin-right: 5px"
                >移除</Button
              >
              <Button size="small" type="primary" @click="updateLink(link)"
                >确认</Button
              >
            </div>
          </div>
        </template>
        <CheckboxButton
          last
          style="width: 100%"
          :checked="!!richTextAttrs.link"
          v-tooltip="'超链接'"
          @click="openLinkPopover()"
          ><IconLinkOne
        /></CheckboxButton>
      </Popover> -->
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import emitter, { EmitterEvents } from '@/utils/emitter'
import { WEB_FONTS } from '@/configs/font'
import useTextFormatPainter from '@/hooks/useTextFormatPainter'
import message from '@/utils/message'
import ColorButton from '@/components/ColorButton.vue'
import CheckboxButton from '@/components/CheckboxButton.vue'
import ColorPicker from '@/components/ColorPicker/index.vue'

import Button from '@/components/Button.vue'
import ButtonGroup from '@/components/ButtonGroup.vue'
import Select from '@/components/Select.vue'
import Divider from '@/components/Divider.vue'
import Popover from '@/components/Popover.vue'
import RadioButton from '@/components/RadioButton.vue'
import RadioGroup from '@/components/RadioGroup.vue'

import useColor from '@/hooks/useColor'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const { initColor } = useColor()

const { richTextAttrs, availableFonts, textFormatPainter, handleElement } =
  storeToRefs(useMainStore())

const { toggleTextFormatPainter } = useTextFormatPainter()

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

const emitRichTextCommand = (command: string, value?: any) => {
  let colorObj = null
  if (command === 'color' || command === 'backcolor') {
    if (typeof value === 'object') {
      colorObj = JSON.parse(JSON.stringify(value))
    } else {
      colorObj = {
        transparent: 1,
        type: 'rgb',
        value: value,
      }
    }
    value = initColor(value)
  }

  if (command.indexOf('fontsize') > -1) {
    if (handleElement?.value?.autoSize === 'textFitShape') {
      handleElement.value.autoSize = 'none'
    }
  }
  emitter.emit(EmitterEvents.RICH_TEXT_COMMAND, {
    action: { command, value, colorObj },
  })
}

const bulletListPanelVisible = ref(false)
const orderedListPanelVisible = ref(false)
const indentLeftPanelVisible = ref(false)
const indentRightPanelVisible = ref(false)

const bulletListStyleTypeOption = ref([
  {
    key: 'disc',
    icon: 'xiangmufuhao1',
  },
  {
    key: 'circle',
    icon: 'xiangmufuhao3',
  },
  {
    key: 'square',
    icon: 'xiangmufuhao2',
  },
])
const orderedListStyleTypeOption = ref([
  {
    key: 'decimal',
    icon: 'bianhao1',
  },
  {
    key: 'lower-roman',
    icon: 'bianhao4',
  },
  {
    key: 'upper-roman',
    icon: 'bianhao3',
  },
  {
    key: 'lower-alpha',
    icon: 'bianhao6',
  },
  {
    key: 'upper-alpha',
    icon: 'bianhao5',
  },
  {
    key: 'lower-greek',
    icon: 'bianhao2',
  },
])

const link = ref('')
const linkPopoverVisible = ref(false)

watch(richTextAttrs, () => {
  linkPopoverVisible.value = false
  link.value = richTextAttrs.value.link
})

const openLinkPopover = () => {
  link.value = richTextAttrs.value.link
}
const startsWithWWW = (str: string): boolean => {
  return str.startsWith('www.')
}
const updateLink = (link?: string) => {
  const linkRegExp =
    /^(https?):\/\/[\w\-]+(\.[\w\-]+)+([\w\-.,@?^=%&:\/~+#]*[\w\-@?^=%&\/~+#])?$/
  if (link) {
    if (startsWithWWW(link)) {
      link = 'https://' + link
    }
  }
  if (!link || !linkRegExp.test(link)) {
    return message.error('不是正确的网页链接地址')
  }

  emitRichTextCommand('link', link)
  linkPopoverVisible.value = false
}

const removeLink = () => {
  emitRichTextCommand('link')
  linkPopoverVisible.value = false
}
</script>

<style lang="scss" scoped>
.rich-text-base {
  user-select: none;
}
.row {
  width: 100%;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.link-popover {
  width: 240px;

  .btns {
    margin-top: 10px;
    text-align: right;
  }
}
.list-wrap {
  color: #666;
  padding: 8px;
  margin: -12px;
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
}
.list {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: $hoverbg;
  padding: 4px 4px 4px 4px;
  cursor: pointer;

  &:not(:nth-child(3n)) {
    margin-right: 8px;
  }

  &:nth-child(4),
  &:nth-child(5),
  &:nth-child(6) {
    margin-top: 8px;
  }

  &:hover {
    color: $themeColor;

    span {
      background-color: $themeColor;
    }
  }
}
.list-item {
  width: 24px;
  height: 12px;
  position: relative;
  font-size: 12px;
  top: -3px;

  span {
    width: 100%;
    height: 2px;
    display: inline-block;
    position: absolute;
    top: 8px;
    background-color: #666;
  }
}
.popover-btn {
  padding: 0 3px;
}
</style>
