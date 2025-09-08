<template>
  <div class="online-screen" id="editorDomWaterMark" @click="handleAreaClick">
    <BaseView :changeViewMode="changeViewMode" v-if="viewMode === 'base'" />
    <PresenterView
      :changeViewMode="changeViewMode"
      v-else-if="viewMode === 'presenter'"
    />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useScreenStore, useSlidesStore, useMainStore } from '@/store'
import { KEYS } from '@/configs/hotkey'
import useScreening from '@/hooks/useScreening'

import BaseView from './BaseView.vue'
import PresenterView from './PresenterView.vue'

const viewMode = ref<'base' | 'presenter'>('base')
const mainStore = useMainStore()

const changeViewMode = (mode: 'base' | 'presenter') => {
  mainStore.setPlayModal(mode)
  viewMode.value = mode
}

const { exitScreening } = useScreening()
const { slides } = storeToRefs(useSlidesStore())
const ctrlKeyState = ref(false)
const shiftKeyState = ref(false)

// 快捷键退出放映
const keydownListener = (e: KeyboardEvent) => {
  const keys = e.key.toUpperCase()
  if (keys === KEYS.ESC) {
    exitScreening()
  }

  const { ctrlKey, shiftKey, key } = e
  const ctrlOrMetaKeyActive = ctrlKey && shiftKey && key === 'Q'
  if (ctrlOrMetaKeyActive && !ctrlKeyState.value && !shiftKeyState.value) {
    ctrlKeyState.value = true
    shiftKeyState.value = true
  }
}

const handleAreaClick = () => {
  if (ctrlKeyState.value && shiftKeyState.value) {
    alert('a5c21c4651343935')
  }
}

const clearListener = () => {
  if (ctrlKeyState.value) ctrlKeyState.value = false
  if (shiftKeyState.value) shiftKeyState.value = false
}
onMounted(() => {
  if (mainStore.playModal === 'presenter') {
    changeViewMode('presenter')
  }
  document.addEventListener('keyup', clearListener)
  window.addEventListener('blur', clearListener)
  document.addEventListener('keydown', keydownListener)
})
onUnmounted(() => {
  document.addEventListener('keyup', clearListener)
  window.addEventListener('blur', clearListener)
  document.removeEventListener('keydown', keydownListener)
})
</script>

<style lang="scss" scoped>
.online-screen {
  background: #000;
  width: 100%;
  height: 100%;
}
</style>
