<template>
  <div class="node-style-box latex-box">
    <Tabs :tabs="currentTabs" v-model:value="toolbarState" />
    <div class="node-content">
      <template v-if="toolbarState === 'seting'">
        <LatexStylePanel />
      </template>
      <template v-if="toolbarState === 'position'">
        <ElementPositionPanel />
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive } from 'vue'
import Tabs from '@/components/Tabs.vue'
import LatexStylePanel from '@/views/Editor/Toolbar/ElementStylePanel/LatexStylePanel.vue'
import ElementPositionPanel from '@/views/Editor/Toolbar/ElementPositionPanel.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const currentTabs = reactive([
  { label: t('toolbar.latex'), key: 'seting' },
  { label: t('toolbar.postion'), key: 'position' },
])

const toolbarState = ref<string>('seting')
</script>
<style lang="scss" scope>
.latex-box {
  width: 475rem !important;
}
.node-content {
  padding-top: 20rem;
}
</style>
