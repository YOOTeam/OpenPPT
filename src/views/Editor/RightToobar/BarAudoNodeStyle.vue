<template>
  <div class="node-style-box">
    <Tabs :tabs="currentTabs" v-model:value="toolbarState" />
    <div class="node-content">
      <template v-if="toolbarState === 'audio'"> <AudioStylePanel /> </template>
      <template v-if="toolbarState === 'position'">
        <ElementPositionPanel />
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive } from 'vue'
import Tabs from '@/components/Tabs.vue'
import AudioStylePanel from '@/views/Editor/Toolbar/ElementStylePanel/AudioStylePanel.vue'
import ElementPositionPanel from '@/views/Editor/Toolbar/ElementPositionPanel.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const currentTabs = reactive([
  { label: t('toolbar.audioStyle'), key: 'audio' },
  { label: t('toolbar.postion'), key: 'position' },
])

const toolbarState = ref<string>('audio')
</script>
<style lang="scss">
.node-content {
  padding-top: 20rem;
}
</style>
