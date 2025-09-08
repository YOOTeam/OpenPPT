<template>
  <div class="node-style-box">
    <Tabs :tabs="currentTabs" v-model:value="toolbarState" />
    <div class="node-content">
      <template v-if="toolbarState === 'setting'">
        <MultiStylePanel />
      </template>
      <template v-if="toolbarState === 'position'">
        <MultiPositionPanel />
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive } from 'vue'
import Tabs from '@/components/Tabs.vue'
import MultiStylePanel from '@/views/Editor/Toolbar/ElementStylePanel/MultiStylePanel.vue'
import MultiPositionPanel from '@/views/Editor/Toolbar/MultiPositionPanel.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const currentTabs = reactive([
  { label: t('toolbar.styleSet'), key: 'setting' },
  { label: t('toolbar.postion'), key: 'position' },
])

const toolbarState = ref<string>('setting')
</script>
<style lang="scss">
.node-content {
  padding-top: 20rem;
}
</style>
