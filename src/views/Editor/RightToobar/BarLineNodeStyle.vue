<template>
  <div class="node-style-box">
    <Tabs :tabs="currentTabs" v-model:value="toolbarState" />
    <div class="node-content">
      <template v-if="toolbarState === 'shape'"> <LineStylePanel /> </template>
      <template v-if="toolbarState === 'position'">
        <ElementPositionPanel />
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive } from 'vue'
import Tabs from '@/components/Tabs.vue'
import LineStylePanel from '@/views/Editor/Toolbar/ElementStylePanel/LineStylePanel.vue'
import ElementPositionPanel from '@/views/Editor/Toolbar/ElementPositionPanel.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const currentTabs = reactive([
  { label: t('toolbar.shapStyle'), key: 'shape' },
  { label: t('toolbar.postion'), key: 'position' },
])

const toolbarState = ref<string>('shape')
</script>
<style lang="scss">
.node-content {
  padding-top: 20rem;
}
</style>
