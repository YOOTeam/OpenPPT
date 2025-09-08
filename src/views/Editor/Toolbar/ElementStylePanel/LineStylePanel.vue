<template>
  <div class="line-style-panel">
    <div class="row" v-if="handleElement?.name">
      <div style="width: 40%">图层名称</div>
      <div style="width: 60%">{{ handleElement.name }}</div>
    </div>
    <div class="row">
      <div style="width: 40%">线条样式</div>
      <Select
        style="width: 60%"
        :value="handleLineElement?.style || ''"
        @update:value="value => updateLine({ style: value as 'solid' | 'dashed' })"
        :options="[
          { label: '实线线条', value: 'solid' },
          { label: '虚线线条', value: 'dashed' },
        ]"
      />
    </div>
    <div class="row">
      <div style="width: 40%">填充方式</div>
      <div style="width: 60%">
        <Select
          :value="fillType"
          @update:value="(value) => updateFillType(value)"
          :options="[
            { label: '纯色填充', value: 'fill' },
            { label: '渐变填充', value: 'gradient' },
          ]"
        />
      </div>
    </div>
    <div class="row" v-if="fillType === 'fill'">
      <div style="width: 40%">线条颜色</div>
      <Popover trigger="click" style="width: 60%">
        <template #content>
          <ColorPicker
            :modelValue="initColor(handleLineElement.color)"
            @update:modelValue="(value) => updateLine({ color: value })"
          />
        </template>
        <ColorButton :color="initColor(handleLineElement.color) || ''" />
      </Popover>
    </div>
    <template v-if="fillType === 'gradient'">
      <div class="row">
        <div style="width: 40%">渐变方式</div>
        <Select
          style="flex: 1"
          :value="gradient.type"
          @update:value="value => updateGradient({ type: value as GradientType })"
          :options="[
            { label: '线性渐变', value: 'linear' },
            { label: '径向渐变', value: 'radial' },
          ]"
        />
      </div>
      <div class="row">
        <div style="width: 40%">渐变颜色</div>
        <GradientBar
          style="flex: 1"
          :value="gradient.colors"
          @update:value="(value) => updateGradient({ colors: value })"
          @update:index="(index) => (currentGradientIndex = index)"
        />
      </div>
      <div class="row">
        <div style="width: 40%">当前色块</div>
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
        <div style="width: 40%">渐变角度</div>
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
    <div class="row">
      <div style="width: 40%">线条宽度</div>
      <NumberInput
        :step="0.5"
        :value="handleLineElement.width"
        @update:value="(value) => updateLine({ width: value })"
        style="width: 60%"
      />
    </div>

    <div class="row" v-if="handleLineElement?.points">
      <div style="width: 40%">起点样式</div>
      <Select
        style="width: 60%"
        :value="handleLineElement?.points[0] || ''"
        @update:value="value => updateLine({ points: [value as 'arrow' | 'dot', handleLineElement.points[1]] })"
        :options="[
          { label: '无', value: '' },
          { label: '箭头', value: 'arrow' },
          { label: '圆点', value: 'dot' },
        ]"
      />
    </div>
    <div class="row" v-if="handleLineElement?.points">
      <div style="width: 40%">终点样式</div>
      <Select
        style="width: 60%"
        :value="handleLineElement.points[1] || ''"
        @update:value="value => updateLine({ points: [handleLineElement.points[0], value as 'arrow' | 'dot'] })"
        :options="[
          { label: '无', value: '' },
          { label: '箭头', value: 'arrow' },
          { label: '圆点', value: 'dot' },
        ]"
      />
    </div>

    <!-- <Divider />

    <div class="row">
      <Button
        style="flex: 1"
        @click="
          updateLine({
            start: handleLineElement.end,
            end: handleLineElement.start,
          })
        "
        ><IconSwitch /> 交换方向</Button
      >
    </div>

    <Divider /> -->
    <ElementShadow />
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import type { PPTLineElement } from '@/types/slides'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import useColor from '@/hooks/useColor'

import ElementShadow from '../common/ElementShadow.vue'
import Button from '@/components/Button.vue'
import ColorButton from '@/components/ColorButton.vue'
import ColorPicker from '@/components/ColorPicker/index.vue'
import Divider from '@/components/Divider.vue'
import NumberInput from '@/components/NumberInput.vue'
import Select from '@/components/Select.vue'
import Popover from '@/components/Popover.vue'
import GradientBar from '@/components/GradientBar.vue'
import Slider from '@/components/Slider.vue'

const { initColor } = useColor()
const slidesStore = useSlidesStore()
const { handleElement, handleElementId } = storeToRefs(useMainStore())

const handleLineElement = handleElement as Ref<PPTLineElement>

const fillType = ref('fill')
const gradient = ref<Gradient>({
  type: 'linear',
  rotate: 0,
  colors: [
    { pos: 0, color: '#fff' },
    { pos: 100, color: '#fff' },
  ],
})
const currentGradientIndex = ref(0)

const { addHistorySnapshot } = useHistorySnapshot()

watch(
  handleElement,
  () => {
    if (!handleElement.value || handleElement.value.type !== 'line') return
    const defaultGradientColor = [
      { pos: 0, color: handleElement.value.color },
      { pos: 100, color: '#fff' },
    ]
    gradient.value = handleElement.value.gradient || {
      type: 'linear',
      rotate: 0,
      colors: defaultGradientColor,
    }

    if (handleElement.value.gradient) {
      fillType.value = 'gradient'
    } else {
      fillType.value = 'fill'
    }
  },
  { deep: true, immediate: true }
)

const updateLine = (props: Partial<PPTLineElement>) => {
  if (!handleElement.value) return
  slidesStore.updateElement({ id: handleElement.value.id, props })
  addHistorySnapshot()
}

// 设置填充类型渐变、纯色
const updateFillType = (type: string) => {
  if (type === 'fill') {
    slidesStore.removeElementProps({
      id: handleElementId.value,
      propName: 'gradient',
    })
    addHistorySnapshot()
  } else if (type === 'gradient') {
    currentGradientIndex.value = 0
    updateLine({ gradient: gradient.value })
  }
}

// 设置渐变填充
const updateGradient = (gradientProps: Partial<Gradient>) => {
  if (!gradient.value) return
  const _gradient = { ...gradient.value, ...gradientProps }
  updateLine({ gradient: _gradient })
}
const updateGradientColors = (color: string) => {
  const colors = gradient.value.colors.map((item, index) => {
    if (index === currentGradientIndex.value) return { ...item, color }
    return item
  })
  updateGradient({ colors })
}
</script>

<style lang="scss" scoped>
.row {
  width: 100%;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.line-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 !important;

  .line-wrapper {
    margin-left: 8px;
  }
}
.line-wrapper {
  overflow: visible;
}
.line-btn-icon {
  width: 30px;
  font-size: 12px;
  margin-top: 2px;
  color: #bfbfbf;
}
.preset-point-style {
  padding: 0 10px;

  & + .preset-point-style {
    margin-top: 10px;
  }
}
</style>
