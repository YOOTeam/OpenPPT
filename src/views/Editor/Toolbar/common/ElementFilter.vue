<template>
  <div class="element-filter">
    <!-- <div class="row">
      <div style="flex: 2">{{$t('toolbar.filterImg')}}</div>
      <div class="switch-wrapper" style="flex: 3">
        <Switch
          :value="hasFilters"
          @update:value="(value) => toggleFilters(value)"
        />
      </div>
    </div> -->

    <div class="row">
      <div style="width: 40%">{{ $t('toolbar.filterImg') }}</div>
      <Select
        style="width: 60%"
        :value="hasFilters"
        @update:value="(value) => toggleFilters(value as string)"
        :options="[
          { label: t('toolbar.nofilter'), value: 'none' },
          { label: t('toolbar.colorFilter'), value: 'show' },
        ]"
      />
    </div>

    <div class="filter" v-if="hasFilters !== 'none'">
      <div
        class="filter-item"
        v-for="filter in filterOptions"
        :key="filter.key"
      >
        <div class="name">{{ filter.label }}</div>
        <Slider
          class="filter-slider"
          :max="filter.max"
          :min="0"
          :step="filter.step"
          :value="filter.value"
          @update:value="value => updateFilter(filter, value as number)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import type { ImageElementFilterKeys, PPTImageElement } from '@/types/slides'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import Select from '@/components/Select.vue'
import Slider from '@/components/Slider.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
interface FilterOption {
  label: string
  key: ImageElementFilterKeys
  default: number
  value: number
  unit: string
  max: number
  step: number
}

const defaultFilters: FilterOption[] = [
  {
    label: t('toolbar.blur'),
    key: 'blur',
    default: 0,
    value: 0,
    unit: 'px',
    max: 10,
    step: 1,
  },
  {
    label: t('toolbar.brightness'),
    key: 'brightness',
    default: 100,
    value: 100,
    unit: '%',
    max: 200,
    step: 5,
  },
  {
    label: t('toolbar.contrast'),
    key: 'contrast',
    default: 100,
    value: 100,
    unit: '%',
    max: 200,
    step: 5,
  },
  {
    label: t('toolbar.grayscale'),
    key: 'grayscale',
    default: 0,
    value: 0,
    unit: '%',
    max: 100,
    step: 5,
  },
  {
    label: t('toolbar.saturate'),
    key: 'saturate',
    default: 100,
    value: 100,
    unit: '%',
    max: 200,
    step: 5,
  },
  {
    label: t('toolbar.sepia'),
    key: 'hue-rotate',
    default: 0,
    value: 0,
    unit: 'deg',
    max: 360,
    step: 10,
  },
  {
    label: t('toolbar.opacity'),
    key: 'opacity',
    default: 100,
    value: 100,
    unit: '%',
    max: 100,
    step: 5,
  },
]

const slidesStore = useSlidesStore()
const { handleElement, handleElementId } = storeToRefs(useMainStore())

const filterOptions = ref<FilterOption[]>(
  JSON.parse(JSON.stringify(defaultFilters))
)
const hasFilters = ref('none')

const { addHistorySnapshot } = useHistorySnapshot()

watch(
  handleElement,
  () => {
    if (!handleElement.value || handleElement.value.type !== 'image') return

    const filters = handleElement.value.filters
    if (filters) {
      filterOptions.value = defaultFilters.map((item) => {
        const filterItem = filters[item.key]
        if (filterItem) return { ...item, value: parseInt(filterItem) }
        return item
      })
      hasFilters.value = 'show'
    } else {
      filterOptions.value = JSON.parse(JSON.stringify(defaultFilters))
      hasFilters.value = 'none'
    }
  },
  { deep: true, immediate: true }
)

// 设置滤镜
const updateFilter = (filter: FilterOption, value: number) => {
  const _handleElement = handleElement.value as PPTImageElement

  const originFilters = _handleElement.filters || {}
  const filters = { ...originFilters, [filter.key]: `${value}${filter.unit}` }
  slidesStore.updateElement({ id: handleElementId.value, props: { filters } })
  addHistorySnapshot()
}

const toggleFilters = (value: string) => {
  if (!handleElement.value) return
  if (value === 'show') {
    slidesStore.updateElement({
      id: handleElement.value.id,
      props: { filters: {} },
    })
  } else {
    slidesStore.removeElementProps({
      id: handleElement.value.id,
      propName: 'filters',
    })
  }
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
.filter {
  font-size: 14rem;
}
.filter-item {
  padding: 8rem 0;
  display: flex;
  justify-content: center;
  align-items: center;

  .name {
    width: 70rem;
  }
  .filter-slider {
    flex: 1;
    margin: 0 6rem;
  }
}
</style>
