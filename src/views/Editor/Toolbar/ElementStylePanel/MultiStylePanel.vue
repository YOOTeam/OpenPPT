<template>
  <div class="multi-style-panel">
    <!-- <div class="row" v-if="handleElement?.name">
      <div style="width: 40%">图层名称</div>
      <div style="width: 60%">{{ handleElement.name }}</div>
    </div> -->

    <div class="row">
      <div style="width: 30%">{{ $t('toolbar.fileColor') }}</div>
      <Popover trigger="click" style="width: 70%">
        <template #content>
          <ColorPicker
            :modelValue="initColor(fill)"
            @update:modelValue="(value) => updateFill(value)"
          />
        </template>
        <ColorButton :color="initColor(fill)" />
      </Popover>
    </div>

    <Divider />

    <div class="row">
      <div style="width: 30%">{{ $t('toolbar.borderStyle') }}</div>
      <Select
        style="width: 70%"
        :value="outline.style || ''"
        @update:value="value => updateOutline({ style: value as 'solid' | 'dashed' })"
        :options="[
          { label: t('toolbar.noneBoder'), value: 'none' },
          { label: t('toolbar.solidBorder'), value: 'solid' },
          { label: t('toolbar.dashedBorder'), value: 'dashed' },
        ]"
      />
    </div>
    <template v-if="outline.style !== 'none'">
      <div class="row">
        <div style="width: 30%">{{ $t('toolbar.borderColor') }}</div>
        <Popover trigger="click" style="width: 70%">
          <template #content>
            <ColorPicker
              :modelValue="initColor(outline.color)"
              @update:modelValue="(value) => updateOutline({ color: value })"
            />
          </template>
          <ColorButton :color="initColor(outline.color) || '#000'" />
        </Popover>
      </div>
      <div class="row">
        <div style="width: 30%">{{ $t('toolbar.borderWidth') }}</div>
        <NumberInput
          :value="outline.width || 0"
          @update:value="(value) => updateOutline({ width: value })"
          style="width: 70%"
        />
      </div>
    </template>

    <Divider />

    <div class="row">
      <div style="width: 30%">{{ $t('toolbar.fontName') }}</div>
      <Select
        style="width: 70%"
        :value="richTextAttrs.fontname"
        @update:value="value => updateFontStyle('fontname', value as string)"
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
          :value="richTextAttrs.fontsize"
          @update:value="value => updateFontStyle('fontsize', value as string)"
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
          @click="updateFontStyle('fontsize-add', '2')"
          ><IconFontSize />+</Button
        >
        <Button
          last
          class="font-size-btn"
          style="width: 20%"
          v-tooltip="t('toolbar.reduceSize')"
          @click="updateFontStyle('fontsize-reduce', '2')"
          ><IconFontSize />-</Button
        >
      </div>
    </div>

    <div class="row">
      <div style="width: 30%">{{ $t('toolbar.fontColor') }}</div>
      <Popover trigger="click" style="width: 70%">
        <template #content>
          <ColorPicker
            :modelValue="initColor(richTextAttrs.color)"
            @update:modelValue="(value) => updateFontStyle('color', value)"
          />
        </template>
        <ColorButton :color="initColor(richTextAttrs.color)" />
      </Popover>
    </div>

    <div class="row">
      <div style="width: 30%">{{ $t('toolbar.bgColor1') }}</div>
      <Popover trigger="click" style="width: 70%">
        <template #content>
          <ColorPicker
            :modelValue="initColor(richTextAttrs.backcolor)"
            @update:modelValue="(value) => updateFontStyle('backcolor', value)"
          />
        </template>
        <ColorButton :color="initColor(richTextAttrs.backcolor)" />
      </Popover>
    </div>
    <div class="row" style="align-items: self-start">
      <div style="width: 30%; padding-top: 10rem">
        {{ $t('toolbar.textStyle') }}
      </div>
      <div style="width: 70%">
        <RadioGroup
          class="row"
          button-style="solid"
          :value="richTextAttrs.align"
          @update:value="(value) => updateFontStyle('align', value)"
        >
          <RadioButton
            value="left"
            style="flex: 1"
            v-tooltip="t('toolbar.alignLeft')"
            ><i class="iconfont icon-zuoduiqi toobar-icon-sizes"></i
          ></RadioButton>
          <RadioButton
            value="center"
            style="flex: 1"
            v-tooltip="t('toolbar.alignCenter')"
            ><i class="iconfont toobar-icon-sizes icon-juzhongduiqi"></i
          ></RadioButton>
          <RadioButton
            value="right"
            style="flex: 1"
            v-tooltip="t('toolbar.alignRight')"
            ><i class="iconfont toobar-icon-sizes icon-youduiqi"></i
          ></RadioButton>
          <RadioButton
            value="justify"
            style="flex: 1"
            v-tooltip="t('toolbar.justify')"
            ><i class="iconfont toobar-icon-sizes icon-liangduanduiqi"></i
          ></RadioButton>
        </RadioGroup>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import type { PPTElement, PPTElementOutline, TableCell } from '@/types/slides'
import emitter, { EmitterEvents } from '@/utils/emitter'
import { WEB_FONTS } from '@/configs/font'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'

import ColorButton from '@/components/ColorButton.vue'
import ColorPicker from '@/components/ColorPicker/index.vue'
import Divider from '@/components/Divider.vue'
import Button from '@/components/Button.vue'
import RadioButton from '@/components/RadioButton.vue'
import RadioGroup from '@/components/RadioGroup.vue'
import NumberInput from '@/components/NumberInput.vue'
import Select from '@/components/Select.vue'
import Popover from '@/components/Popover.vue'
import useColor from '@/hooks/useColor'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const { initColor } = useColor()

const slidesStore = useSlidesStore()
const { richTextAttrs, availableFonts, activeElementList } = storeToRefs(
  useMainStore()
)

const { addHistorySnapshot } = useHistorySnapshot()

const updateElement = (id: string, props: Partial<PPTElement>) => {
  slidesStore.updateElement({ id, props })
  addHistorySnapshot()
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

const fill = ref('#fff')
const outline = ref<PPTElementOutline>({
  width: 0,
  color: '#fff',
  style: 'none',
})

// 批量修改填充色（表格元素为单元格填充、音频元素为图标颜色）
const updateFill = (value: any) => {
  for (const el of activeElementList.value) {
    if (el.type === 'text' || el.type === 'shape' || el.type === 'chart') {
      updateElement(el.id, { fill: value })
    }

    if (el.type === 'table') {
      const data: TableCell[][] = JSON.parse(JSON.stringify(el.data))
      for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
          const style = data[i][j].style || {}
          data[i][j].style = { ...style, backcolor: value }
        }
      }
      updateElement(el.id, { data })
    }

    if (el.type === 'audio') updateElement(el.id, { color: value })
  }
  fill.value = value
}

// 修改边框/线条样式
const updateOutline = (outlineProps: Partial<PPTElementOutline>) => {
  for (const el of activeElementList.value) {
    if (
      el.type === 'text' ||
      el.type === 'image' ||
      el.type === 'shape' ||
      el.type === 'table' ||
      el.type === 'chart'
    ) {
      const outline = el.outline || { width: 2, color: '#000', style: 'solid' }
      const props = { outline: { ...outline, ...outlineProps } }
      updateElement(el.id, props)
    }

    if (el.type === 'line') updateElement(el.id, outlineProps)
  }
  outline.value = { ...outline.value, ...outlineProps }
}

// 修改文字样式
const updateFontStyle = (command: string, value: any) => {
  if (command === 'color' || command === 'backcolor') {
    value = initColor(value)
  }
  for (const el of activeElementList.value) {
    if (el.type === 'text' || (el.type === 'shape' && el.text?.content)) {
      emitter.emit(EmitterEvents.RICH_TEXT_COMMAND, {
        target: el.id,
        action: { command, value },
      })
    }
    if (el.type === 'table') {
      const data: TableCell[][] = JSON.parse(JSON.stringify(el.data))
      for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
          const style = data[i][j].style || {}
          data[i][j].style = { ...style, [command]: value }
        }
      }
      updateElement(el.id, { data })
    }
    if (el.type === 'latex' && command === 'color') {
      updateElement(el.id, { color: value })
    }
  }
}
</script>

<style lang="scss" scoped>
.row {
  width: 100%;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
</style>
