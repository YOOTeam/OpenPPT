<template>
  <Iframe v-if="linkType === 'iframe'" />
  <Editor v-else />
</template>

<script lang="ts" setup>
import { onMounted, nextTick, ref, onBeforeUnmount } from 'vue'
import { useScreenStore } from '@/store'
import { isPC } from './utils/common'
import Iframe from '@/views/Iframe/index.vue'
import Editor from '@/views/index.vue'
import message from '@/utils/message'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const linkType = ref(localStorage.getItem('linkType'))
const _isPC = isPC()

const screenStore = useScreenStore()

onMounted(() => {
  handleResize()
  
})
const handleResize = () => {
  nextTick(() => {
    const htmls: any = document.querySelector('html')
    let rem: number
    let isSetPc = false
    const appKeyList = ['isTablet', 'Tablet']
    if (appKeyList.includes(localStorage.getItem('appKey'))) {
      isSetPc = true
    }
    if (_isPC || isSetPc) {
      rem = htmls.offsetWidth / 1920
    } else {
      rem = htmls.offsetWidth / 460
    }

    if (rem < 0.7) {
      rem = 0.732292
    }
    htmls.style.fontSize = parseFloat(rem.toFixed(3)) + 'px'
    screenStore.setRem(parseFloat(rem.toFixed(3)))
  })
}
const offLine = () => {
  message.error(t('offLine'))
}
const online = () => {
  message.success(t('online'))
}
window.addEventListener('offline', offLine)
window.addEventListener('online', online)

window.addEventListener('resize', handleResize)

onBeforeUnmount(() => {
  sessionStorage.removeItem('themeModle')
  sessionStorage.removeItem('singlePageId')
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('offline', offLine)
  window.removeEventListener('online', online)
  sessionStorage.removeItem('loactionUrlInfo')
})
</script>

<style lang="scss">
#app {
  height: 100%;
  width: 100%;
}
</style>
