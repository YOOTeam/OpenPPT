<template>
  <div
    class="mobile"
    id="editorDomWaterMark"
    :style="{ background: resourcesData?.main_color }"
  >
    <component :is="currentComponent" :changeMode="changeMode"></component>
    <LoadingMarks v-if="showLoadingMarks" />
    <!-- 全文美化  -->
    <BeautifyPage v-if="showBeautifyPage" />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import type { Mode } from '@/types/mobile'
import BeautifyPage from '@/views/components/BeautifyPage/mobileBeautify.vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import MobileEditor from './MobileEditor/index.vue'
import MobilePlayer from './MobilePlayer.vue'
import MobilePreview from './MobilePreview.vue'
import LoadingMarks from '@/views/components/element/LoadingMarks.vue'
const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const { resourcesData } = storeToRefs(slidesStore)
const { showLoadingMarks, showBeautifyPage, mobileChatResule } =
  storeToRefs(mainStore)
const mode = ref('preview')
const flage = ref('')
const changeMode = (_mode: Mode, from?: string) => {
  mainStore.setMobileChangeMode(_mode)
  if (_mode === 'preview' && from === 'editor') {
    mode.value = 'preview'
  } else {
    if (flage.value) {
      mode.value = flage.value
      flage.value = ''
    } else {
      mode.value = _mode
    }
    if (from) {
      flage.value = from
    }
  }
}

const currentComponent = computed(() => {
  const componentMap = {
    editor: MobileEditor,
    player: MobilePlayer,
    preview: MobilePreview,
  }
  return componentMap[mode.value] || null
})

watch(
  mobileChatResule,
  (newVal, onlValue) => {
    if (newVal !== onlValue && newVal && mode.value === 'preview') {
      mode.value = 'editor'
    }
  },
  {
    immediate: true,
  }
)
</script>

<style lang="scss" scoped>
.mobile {
  height: 100%;
  background: rgba(157, 46, 255, 1);
}
</style>
