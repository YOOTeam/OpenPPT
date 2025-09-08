<template>
  <div class="node-style-box">
    <Tabs :tabs="currentTabs" v-model:value="toolbarState" />
    <div class="node-content">
      <template v-if="toolbarState === 'iframe'">
        <IframeStylePanel />
      </template>
      <template v-else-if="toolbarState === 'htmls'">
        <IframeHtmlPanel />
      </template>
      <template v-else-if="toolbarState === 'position'">
        <ElementPositionPanel />
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive } from 'vue'
import Tabs from '@/components/Tabs.vue'
import IframeHtmlPanel from '@/views/Editor/Toolbar/ElementStylePanel/iframeHtmlPanel.vue'
import IframeStylePanel from '@/views/Editor/Toolbar/ElementStylePanel/IframeStylePanel.vue'
import ElementPositionPanel from '@/views/Editor/Toolbar/ElementPositionPanel.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const currentTabs = reactive([
  { label: t('toolbar.iframeStyle'), key: 'iframe' },
  { label: t('toolbar.iframeHtml'), key: 'htmls' },
  { label: t('toolbar.postion'), key: 'position' },
])

const toolbarState = ref<string>('iframe')
</script>
<style lang="scss">
.node-content {
  position: relative;
  padding-top: 20rem;
}
</style>
