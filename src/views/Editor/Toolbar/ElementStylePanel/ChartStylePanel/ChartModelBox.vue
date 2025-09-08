<template>
  <Modal v-model:visible="chartDataEditorVisible" :width="640">
    <div class="mode-tips-title"><span>编辑图表数据</span></div>
    <ChartDataEditor
      :data="handleChartElement?.data"
      @close="chartDataEditorVisible = false"
      @save="(value) => updateData(value)"
    />
  </Modal>
</template>

<script lang="ts" setup>
import { onUnmounted, ref, type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import type { PPTChartElement } from '@/types/slides'
import emitter, { EmitterEvents } from '@/utils/emitter'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import ChartDataEditor from './ChartDataEditor.vue'
import Modal from '@/components/Modal.vue'
const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const { handleElement, handleElementId } = storeToRefs(mainStore)

const handleChartElement = handleElement as Ref<PPTChartElement>

const chartDataEditorVisible = ref(false)
const { addHistorySnapshot } = useHistorySnapshot()
const updateElement = (props: Partial<PPTChartElement>) => {
  slidesStore.updateElement({ id: handleElementId.value, props })
  addHistorySnapshot()
}
// 设置图表数据
const updateData = (data: ChartData) => {
  chartDataEditorVisible.value = false
  updateElement({ data })
}
const openDataEditor = () => {
  chartDataEditorVisible.value = true
}

emitter.on(EmitterEvents.OPEN_CHART_DATA_EDITOR, openDataEditor)
onUnmounted(() => {
  emitter.off(EmitterEvents.OPEN_CHART_DATA_EDITOR, openDataEditor)
})
</script>
