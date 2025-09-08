<template>
  <ul class="chart-pool">
    <div class="mode-tips-title">
      <span> {{ $t('toolbar.addChart') }} </span>
    </div>
    <div class="chart-box">
      <li class="chart-item" v-for="(chart, index) in chartList" :key="index">
        <div
          class="chart-content"
          :class="[active === chart.type ? 'active' : '']"
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
          <IconCheckOne class="icon" v-if="active === chart.type" />
        </div>
      </li>
    </div>
  </ul>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import type { PresetChartType } from '@/types/slides'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const emit = defineEmits<{
  (event: 'select', payload: PresetChartType): void
}>()
const active = ref('')
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

const selectChart = (chart: PresetChartType) => {
  active.value = chart
  emit('select', chart)
}
</script>

<style lang="scss" scoped>
.chart-pool {
  @include drage-modal-layout();
}

.chart-box {
  margin-top: 15rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.chart-item {
  width: 48%;
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

.chart-content {
  @include absolute-0();

  display: flex;
  justify-content: center;
  align-items: center;
  color: #999;

  &:hover {
    color: $themeColor;
  }
}
</style>
