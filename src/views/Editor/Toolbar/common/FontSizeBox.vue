<template>
  <div class="element-fontSize">
    <div class="row">
      <div style="width: 35%">{{ $t('toolbar.textBoxSet') }}</div>
      <Select
        style="width: 65%"
        :value="autoSize || 'none'"
        @update:value="(value) => updateAutoSize(value)"
        :options="
          fontBoxSize.map((item) => ({
            label: item.name,
            value: item.value,
          }))
        "
      >
      </Select>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import Select from '@/components/Select.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const fontBoxSize = [
  {
    value: 'none',
    name: t('toolbar.textNone'),
  },
  {
    value: 'textFitShape',
    name: t('toolbar.textFitShape'),
  },
  {
    value: 'shapeFitText',
    name: t('toolbar.shapeFitText'),
  },
]
const autoSize = ref('')
const slidesStore = useSlidesStore()
const { handleElement, handleElementId } = storeToRefs(useMainStore())

watch(
  handleElement,
  () => {
    if (!handleElement.value) return
    autoSize.value = handleElement.value?.autoSize || 'none'
  },
  { deep: true, immediate: true }
)

const { addHistorySnapshot } = useHistorySnapshot()

// 文本框设置
const updateAutoSize = (value: string) => {
  updateElement({ autoSize: value })
}

const updateElement = (props: Partial<PPTTextElement>) => {
  slidesStore.updateElement({ id: handleElementId.value, props })
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
</style>
