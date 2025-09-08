<template>
  <div
    class="base-element-chart"
    :class="{ 'is-thumbnail': target === 'thumbnail' }"
    :style="{
      top: elementInfo.top + 'px',
      left: elementInfo.left + 'px',
      width: elementInfo.width + 'px',
      height: elementInfo.height + 'px',
    }"
  >
    <div
      class="rotate-wrapper"
      :style="{ transform: `rotate(${elementInfo.rotate}deg)` }"
    >
      <div
        class="element-content"
        :style="{
          backgroundColor: initColor(elementInfo.fill),
        }"
      >
        <ElementOutline
          :width="elementInfo.width"
          :height="elementInfo.height"
          :outline="elementInfo.outline"
          :id="elementInfo.id"
          :softEdge="elementInfo.softEdge"
        />
        <Chart
          :width="elementInfo.width"
          :height="elementInfo.height"
          :type="elementInfo.chartType"
          :data="elementInfo.data"
          :themeColors="elementInfo.themeColors"
          :textColor="elementInfo.textColor"
          :options="elementInfo.options"
          :legend="elementInfo.legend"
          :labelValue="elementInfo?.labelValue"
          :labelPosition="elementInfo?.labelPosition"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { PPTChartElement } from '@/types/slides'

import ElementOutline from '@/views/components/element/ElementOutline.vue'
import Chart from './Chart.vue'
import useColor from '@/hooks/useColor'
const { initColor } = useColor()
defineProps<{
  elementInfo: PPTChartElement
  target?: string
}>()
</script>

<style lang="scss" scoped>
.base-element-chart {
  position: absolute;

  &.is-thumbnail {
    pointer-events: none;
  }
}
.rotate-wrapper {
  width: 100%;
  height: 100%;
}
.element-content {
  width: 100%;
  height: 100%;
}
</style>
