<template>
  <div class="node-style-box" :class="isEnglish ? 'english-style-width' : ''">
    <Tabs :tabs="currentTabs" v-model:value="toolbarState" />
    <div class="node-content">
      <template v-if="toolbarState === 'text'">
        <TextStylePanel />
      </template>
      <template v-if="toolbarState === 'border'">
        <TextStylePanel :borderShow="true" />
      </template>
      <template v-if="toolbarState === 'position'">
        <ElementPositionPanel />
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import Tabs from '@/components/Tabs.vue'
import TextStylePanel from '@/views/Editor/Toolbar/ElementStylePanel/TextStylePanel.vue'
import ElementPositionPanel from '@/views/Editor/Toolbar/ElementPositionPanel.vue'
import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n()
const currentTabs = reactive([
  { label: t('toolbar.textFontStyle'), key: 'text' },
  { label: t('toolbar.shapStyle'), key: 'border' },
  { label: t('toolbar.postion'), key: 'position' },
])
const isEnglish = computed(() => {
  return locale.value === 'en-US'
})
const toolbarState = ref<string>('text')
</script>
<style lang="scss">
.node-style-box {
  min-height: 592rem;
  .node-content {
    padding-top: 20rem;
  }
}
</style>
