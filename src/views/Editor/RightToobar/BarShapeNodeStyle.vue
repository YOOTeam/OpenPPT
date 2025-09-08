<template>
  <div class="node-style-box">
    <Tabs :tabs="currentTabs" v-model:value="toolbarState" />
    <div class="node-content">
      <template v-if="toolbarState === 'shape'"> <ShapeStylePanel /> </template>
      <template v-if="toolbarState === 'text'">
        <ShapeStylePanel :textShow="true" />
      </template>
      <template v-if="toolbarState === 'position'">
        <ElementPositionPanel />
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import Tabs from '@/components/Tabs.vue'
import ShapeStylePanel from '@/views/Editor/Toolbar/ElementStylePanel/ShapeStylePanel.vue'
import ElementPositionPanel from '@/views/Editor/Toolbar/ElementPositionPanel.vue'
const mainStore = useMainStore()
const { handleElement } = storeToRefs(mainStore)
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const currentTabs = ref([
  { label: t('toolbar.shapStyle'), key: 'shape' },
  { label: t('toolbar.postion'), key: 'position' },
])
watch(
  handleElement,
  () => {
    if (handleElement.value?.text?.content) {
      currentTabs.value = [
        { label: t('toolbar.shapStyle'), key: 'shape' },
        { label: t('toolbar.textStyle'), key: 'text' },
        { label: t('toolbar.postion'), key: 'position' },
      ]
    } else {
      currentTabs.value = [
        { label: t('toolbar.shapStyle'), key: 'shape' },
        { label: t('toolbar.postion'), key: 'position' },
      ]
    }
  },
  { deep: true, immediate: true }
)
const toolbarState = ref<string>('shape')
</script>
<style lang="scss">
.node-content {
  padding-top: 20rem;
}
</style>
