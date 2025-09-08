<template>
  <div class="chart-style-panel">
    <!-- <Button class="full-width-btn" @click="chartDataEditorVisible = true">
      <IconEdit class="btn-icon" /> 编辑图表数据
    </Button>
    

    <Divider /> -->
    <template v-if="!showEditor">
      <div class="chart-box">
        <div
          class="chart-item"
          v-for="(chart, index) in chartList"
          :key="index"
        >
          <div
            class="chart-content"
            :class="[activeChart === chart.type ? 'active' : '']"
            @click="selectChart(chart.type)"
          >
            <IconChartLine size="24" v-if="chart.type === 'line'" />
            <IconChartHistogram size="24" v-else-if="chart.type === 'bar'" />
            <IconChartPie size="24" v-else-if="chart.type === 'pie'" />
            <IconChartHistogramOne
              size="24"
              v-else-if="chart.type === 'column'"
            />
            <IconChartLineArea size="24" v-else-if="chart.type === 'area'" />
            <IconChartRing size="24" v-else-if="chart.type === 'ring'" />
            <IconChartScatter size="24" v-else-if="chart.type === 'scatter'" />
            <div style="margin-top: 5rem">
              {{ chart.label }}
            </div>
            <IconCheckOne class="icon" v-if="activeChart === chart.type" />
          </div>
        </div>
      </div>
      <template
        v-if="
          handleChartElement.chartType === 'line' ||
          handleChartElement.chartType === 'area'
        "
      >
        <!-- <div class="row">
          <Checkbox
            @update:value="(value) => updateOptions({ showArea: value })"
            :value="showArea"
            style="flex: 1"
            >面积图样式</Checkbox
          >
          <Checkbox
            @update:value="(value) => updateOptions({ showLine: value })"
            :value="!showLine"
            style="flex: 1"
            >散点图样式</Checkbox
          >
        </div> -->
        <div class="row">
          <Checkbox
            @update:value="(value) => updateOptions({ lineSmooth: value })"
            :value="lineSmooth"
            >{{ $t('toolbar.lineSmooth') }}</Checkbox
          >
        </div>
      </template>
      <div
        class="row"
        v-if="
          handleChartElement.chartType === 'bar' ||
          handleChartElement.chartType === 'column'
        "
      >
        <!-- <Checkbox
          @update:value="(value) => updateOptions({ horizontalBars: value })"
          :value="horizontalBars"
          style="flex: 1"
          >条形图样式</Checkbox
        > -->
        <Checkbox
          @update:value="(value) => updateOptions({ stack: value })"
          :value="stackBars"
          style="flex: 1"
          >{{ $t('toolbar.stack') }}</Checkbox
        >
      </div>
      <!-- <div class="row" v-if="handleChartElement.chartType === 'pie'">
        <Checkbox
          @update:value="(value) => updateOptions({ donut: value })"
          :value="donut"
          >环形图样式</Checkbox
        >
      </div> -->

      <Divider />

      <template v-if="legendNum > 1">
        <div class="row">
          <div style="width: 40%">{{ $t('toolbar.legend') }}</div>
          <Select
            style="width: 60%"
            :value="legend"
            @update:value="value => updateLegend(value as '' | 'top' | 'bottom')"
            :options="[
              { label: t('toolbar.noShowLegend'), value: 'none' },
              { label: t('toolbar.showLegendTop'), value: 'top' },
              { label: t('toolbar.showLegendBottom'), value: 'bottom' },
            ]"
          />
        </div>
        <Divider />
      </template>

      <div class="row" v-for="(color, index) in themeColors" :key="index">
        <div style="width: 40%">
          {{ index === 0 ? t('toolbar.themeColor') : '' }}
        </div>

        <Popover trigger="click" style="width: 60%">
          <template #content>
            <ColorPicker
              :modelValue="initColor(color)"
              @update:modelValue="(value) => updateTheme(value, index)"
            />
          </template>
          <div class="color-btn-wrap" style="width: 100%">
            <ColorButton :color="initColor(color)" />
            <div
              class="delete-color-btn"
              v-tooltip="t('toolbar.deleteTheme')"
              @click.stop="deleteThemeColor(index)"
              v-if="index !== 0"
            >
              <IconCloseSmall />
            </div>
          </div>
        </Popover>
      </div>
      <div class="row">
        <div style="width: 40%"></div>
        <Button
          last
          :disabled="themeColors.length >= 10"
          style="width: 60%"
          @click="addThemeColor()"
        >
          <IconPlus class="btn-icon" /> {{ $t('toolbar.addTheme') }}
        </Button>
      </div>

      <div class="row">
        <div style="width: 40%">{{ $t('toolbar.textColor') }}</div>
        <Popover trigger="click" style="width: 60%">
          <template #content>
            <ColorPicker
              :modelValue="initColor(textColor)"
              @update:modelValue="(value) => updateTextColor(value)"
            />
          </template>
          <ColorButton :color="initColor(textColor)" />
        </Popover>
      </div>

      <div class="row">
        <div style="width: 40%">{{ $t('toolbar.labelPosition') }}</div>
        <Select
          style="width: 60%"
          :value="labelPosition"
          @update:value="(value) => updateLabelPosition(value)"
          :options="labelOpction"
        />
      </div>
      <div class="">
        <div style="width: 40%">{{ $t('toolbar.labelInfo') }}</div>
        <div style="display: flex; margin-top: 15rem">
          <Checkbox
            v-for="(item, index) in labelInfoOpction"
            :key="index"
            @update:value="(value) => handleSelectLable(value, item)"
            :value="labelValue.includes(item.value)"
            style="margin-right: 15rem"
          >
            {{ item.label }}
          </Checkbox>
        </div>

        <!-- <Select
          style="width: 60%"
          :value="labelValue"
          @update:value="(value) => updateLabelValue(value)"
          :options="labelInfoOpction"
        /> -->
      </div>

      <Divider />
      <div class="row">
        <div style="width: 40%">{{ $t('toolbar.bgFill') }}</div>
        <Popover trigger="click" style="width: 60%">
          <template #content>
            <ColorPicker
              :modelValue="initColor(fill)"
              @update:modelValue="(value) => updateFill(value)"
            />
          </template>
          <ColorButton :color="initColor(fill)" />
        </Popover>
      </div>

      <!-- <ButtonGroup class="row" passive>
        <Popover
          trigger="click"
          v-model:open="presetThemesVisible"
          style="width: 40%"
        >
          <template #content>
            <div class="preset-themes">
              <div
                class="preset-theme"
                v-for="(item, index) in presetChartThemes"
                :key="index"
              >
                <div
                  class="preset-theme-color"
                  :class="{
                    select:
                      presetThemeColorHoverIndex[0] === index &&
                      itemIndex <= presetThemeColorHoverIndex[1],
                  }"
                  v-for="(color, itemIndex) in item"
                  :key="color"
                  :style="{ backgroundColor: color }"
                  @click="applyPresetTheme(item, itemIndex)"
                  @mouseenter="presetThemeColorHoverIndex = [index, itemIndex]"
                  @mouseleave="presetThemeColorHoverIndex = [-1, -1]"
                ></div>
              </div>
            </div>
          </template>
          <Button first style="width: 100%">推荐主题</Button>
        </Popover>
        <Button
          last
          :disabled="themeColor.length >= 10"
          style="width: 60%"
          @click="addThemeColor()"
        >
          <IconPlus class="btn-icon" /> 添加主题色
        </Button>
      </ButtonGroup> -->

      <Divider />

      <ElementOutline />
    </template>

    <template v-else>
      <ChartDataEditor
        :data="handleChartElement.data"
        @close="chartDataEditorVisible = false"
        @save="(value) => updateData(value)"
      />
    </template>

    <Modal v-model:visible="chartDataEditorVisible" :width="640">
      <ChartDataEditor
        :data="handleChartElement.data"
        @close="chartDataEditorVisible = false"
        @save="(value) => updateData(value)"
      />
    </Modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import type { ChartData, ChartOptions, PPTChartElement } from '@/types/slides'

import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import ElementOutline from '../../common/ElementOutline.vue'
import ChartDataEditor from './ChartDataEditor.vue'
import ColorButton from '@/components/ColorButton.vue'
import ColorPicker from '@/components/ColorPicker/index.vue'
import Modal from '@/components/Modal.vue'
import Divider from '@/components/Divider.vue'
import Checkbox from '@/components/Checkbox.vue'
import Button from '@/components/Button.vue'
import Select from '@/components/Select.vue'
import Popover from '@/components/Popover.vue'
import useColor from '@/hooks/useColor'

import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const { initColor } = useColor()

const activeChart = ref('')

const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const { handleElement, handleElementId } = storeToRefs(mainStore)
const { theme } = storeToRefs(slidesStore)

const handleChartElement = handleElement as Ref<PPTChartElement>

const chartDataEditorVisible = ref(false)
const presetThemesVisible = ref(false)

const { addHistorySnapshot } = useHistorySnapshot()

const chartList: any = [
  {
    type: 'bar',
    label: t('toolbar.bar'),
  },
  {
    type: 'column',
    label: t('toolbar.column'),
  },
  {
    type: 'line',
    label: t('toolbar.line'),
  },
  {
    type: 'area',
    label: t('toolbar.area'),
  },
  {
    type: 'pie',
    label: t('toolbar.pie'),
  },
  {
    type: 'ring',
    label: t('toolbar.ring'),
  },
]
const fill = ref<string>('#000')

const themeColors = ref<string[]>([])
const textColor = ref('')
const legend = ref('')

const lineSmooth = ref(true)
const stackBars = ref(false)
const legendNum = ref(1)

const props = withDefaults(
  defineProps<{
    showEditor?: boolean
  }>(),
  {
    showEditor: false,
  }
)
const labelPosition = ref('')
const labelValue = ref([])
const labelOpction: any = ref([])
const labelInfoOpction = ref([])
watch(
  handleElement,
  () => {
    if (!handleElement.value || handleElement.value.type !== 'chart') return
    fill.value = handleElement.value.fill || ''

    legendNum.value = handleElement.value?.data?.legends.length
    activeChart.value = handleElement.value?.chartType
    lineSmooth.value = false
    stackBars.value = false
    if (handleElement.value.options) {
      const { lineSmooth: _lineSmooth, stack: _stack } =
        handleElement.value.options

      if (_lineSmooth !== undefined) lineSmooth.value = _lineSmooth
      if (_stack !== undefined) stackBars.value = _stack
    }
    legend.value = handleElement.value.legend || 'bottom'

    themeColors.value = handleElement.value.themeColors
    textColor.value = handleElement.value.textColor || '#333'

    labelPosition.value = handleElement.value?.labelPosition
    labelValue.value = handleElement.value?.labelValue || ['value']
    const lineList = ['bar', 'column', 'line', 'area']
    if (lineList.includes(activeChart.value)) {
      if (!labelPosition.value) {
        labelPosition.value = 'center'
      }
    } else {
      if (!labelPosition.value) {
        labelPosition.value = 'inside'
      }
    }
    if (activeChart.value === 'bar') {
      labelOpction.value = [
        { label: t('toolbar.noShowLegend'), value: 'none' },
        { label: t('toolbar.centerShow'), value: 'center' },
        { label: t('toolbar.topShow'), value: 'top' },
        { label: t('toolbar.bottomShow'), value: 'insideBottom' },
      ]
    } else if (activeChart.value === 'column') {
      labelOpction.value = [
        { label: t('toolbar.noShowLegend'), value: 'none' },
        { label: t('toolbar.centerShow'), value: 'center' },
        { label: t('toolbar.leftShow'), value: 'insideLeft' },
        { label: t('toolbar.rightShow'), value: 'insideRight' },
      ]
    } else if (activeChart.value === 'line' || activeChart.value === 'area') {
      labelOpction.value = [
        { label: t('toolbar.noShowLegend'), value: 'none' },
        { label: t('toolbar.centerShow'), value: 'center' },
        { label: t('toolbar.leftShow'), value: 'left' },
        { label: t('toolbar.rightShow'), value: 'right' },
        { label: t('toolbar.bottomShow'), value: 'insideBottom' },
      ]
    }
    if (lineList.includes(handleElement.value?.chartType)) {
      labelInfoOpction.value = [
        {
          label: t('toolbar.value'),
          value: 'value',
        },
        {
          label: t('toolbar.typeName'),
          value: 'name',
        },
      ]
    } else {
      labelOpction.value = [
        {
          label: t('toolbar.noShowLegend'),
          value: 'none',
        },
        {
          label: t('toolbar.insideShow'),
          value: 'inside',
        },
        {
          label: t('toolbar.outsideShow'),
          value: 'outside',
        },
      ]
      labelInfoOpction.value = [
        {
          label: t('toolbar.value'),
          value: 'value',
        },
        {
          label: t('toolbar.typeName'),
          value: 'name',
        },
        {
          label: t('toolbar.point'),
          value: 'point',
        },
      ]
    }
  },
  { deep: true, immediate: true }
)

const updateElement = (props: Partial<PPTChartElement>) => {
  slidesStore.updateElement({ id: handleElementId.value, props })
  addHistorySnapshot()
}
// 更改图表
const selectChart = (chartType: any) => {
  if (!chartType) return

  activeChart.value = chartType
  const lineList = ['bar', 'column', 'line', 'area']
  labelValue.value = ['value']
  if (lineList.includes(chartType)) {
    labelPosition.value = 'center'
  } else {
    labelPosition.value = 'outside'
  }

  updateElement({
    chartType: chartType,
    labelPosition: labelPosition.value,
    labelValue: labelValue.value,
  })
}

// 设置图表数据
const updateData = (data: ChartData) => {
  chartDataEditorVisible.value = false
  updateElement({ data })
}

// 设置填充色
const updateFill = (value: string) => {
  updateElement({ fill: value })
}

// 设置其他选项柱状图转条形图、折线图转面积图、折线图转散点图、饼图转环形图、折线图开关平滑曲线
const updateOptions = (optionProps: ChartOptions) => {
  const _handleElement = handleElement.value as PPTChartElement

  const newOptions = { ..._handleElement.options, ...optionProps }

  updateElement({ options: newOptions })
}

// 设置主题色
const updateTheme = (color: any, index: number) => {
  const newColor = initColor(color)
  const props = {
    themeColors: themeColors.value.map((c, i) => (i === index ? newColor : c)),
  }
  updateElement(props)
}

// 添加主题色
const addThemeColor = () => {
  const props = {
    themeColors: [...themeColors.value, theme.value.themeColor],
  }

  updateElement(props)
}

// 使用预置主题配色
const applyPresetTheme = (colors: string[], index: number) => {
  const themeColor = colors.slice(0, index + 1)
  updateElement({ themeColor })
  presetThemesVisible.value = false
}

// 删除主题色
const deleteThemeColor = (index: number) => {
  const props = {
    themeColors: themeColors.value.filter((c, i) => i !== index),
  }
  updateElement(props)
}

// 设置文字颜色
const updateTextColor = (textColor: string) => {
  updateElement({ textColor })
}

const updateLabelPosition = (value) => {
  updateElement({ labelPosition: value })
}

const handleSelectLable = (value, item) => {
  if (value) {
    if (!labelValue.value.includes(item.value)) {
      labelValue.value.push(item.value)
    } else {
      labelValue.value = labelValue.value.filter((el) => el !== item.value)
    }
  } else {
    if (labelValue.value.includes(item.value)) {
      labelValue.value = labelValue.value.filter((el) => el !== item.value)
    } else {
      labelValue.value.push(item.value)
    }
  }

  updateElement({ labelValue: labelValue.value })
}
// 设置图例位置/不显示
const updateLegend = (legend: '' | 'top' | 'bottom') => {
  updateElement({ legend })
}
</script>

<style lang="scss" scoped>
.chart-style-panel {
  user-select: none;
}
.row {
  width: 100%;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.full-width-btn {
  width: 100%;
}
.btn-icon {
  margin-right: 3px;
}
.color-btn-wrap {
  position: relative;
}

.chart-box {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
}

.chart-item {
  width: 45%;
  margin-bottom: 10rem;
  border-radius: 10rem;
  border: 1rem solid $lightColor;
  cursor: pointer;
  border-radius: 10rem;
  height: 80rem;
  padding-bottom: 19%;
  flex-shrink: 0;
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #ebe9fd;
    color: $themeColor;
  }
  .chart-content {
    @include absolute-0();
    display: flex;
    justify-content: center;
    align-items: center;
    color: #aaaaaa;
    flex-direction: column;

    &:hover {
      color: $themeColor;
    }
  }
  .icon {
    position: absolute;
    right: 10rem;
    top: 10rem;
    font-size: 18rem;
    color: $themeColor;
  }
  .active {
    color: $themeColor;
  }
}
.delete-color-btn {
  position: absolute;
  width: 30px;
  right: 2px;
  top: 2px;
  bottom: 2px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fff;
  cursor: pointer;
}
.preset-themes {
  width: 250px;
  display: flex;
  margin-bottom: -10px;

  @include flex-grid-layout();
}
.preset-theme {
  display: flex;
  cursor: pointer;

  @include flex-grid-layout-children(2, 48%);
}
.preset-theme-color {
  width: 20px;
  height: 20px;

  &.select {
    transform: scale(1.2);
    transition: transform $transitionDelayFast;
  }
}
</style>
