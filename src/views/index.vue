<template>
  <!-- <template v-if="!loadingUser"> -->
  <Screen v-if="screening" />
  <Editor v-else-if="_isPC" />
  <Mobile v-else />

  <CarpSlideHTML v-if="showCarpSlide?.show" />
  <!-- </template> -->
  <OpenModal :visible="openNoTokenModal" width="600" />
  <LoadingFirst
    :loading="showLoadingPage"
    :isPPTLoading="showPPTTips"
    tip="初始化中..."
    :time="loadingTimeTips"
  />
</template>

<script lang="ts" setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useScreenStore, useMainStore, useSlidesStore } from '@/store'

import { isPC } from '@/utils/common'
import Editor from '@/views/Editor/index.vue'
import Screen from '@/views/Screen/index.vue'
import Mobile from '@/views/Mobile/index.vue'
import CarpSlideHTML from '@/views/components/CarpSlideHTML.vue'
import LoadingFirst from '@/components/LoadingFirst.vue'
import useInitCreate from '@/hooks/useInitCreate'
import OpenModal from '@/components/OpenModal.vue'
import { useI18n } from 'vue-i18n'
const { locale } = useI18n()
const slidesStore = useSlidesStore()
const mainStore = useMainStore()
const { showCarpSlide, chatPPTBeautify, openNoTokenModal } =
  storeToRefs(mainStore)
const _isPC = isPC()
const { screening } = storeToRefs(useScreenStore())

const {
  defualtSlide,
  showLoadingPage,
  showPPTTips,
  loadingTimeTips,
  useFileId,
} = useInitCreate()

const initSlide = () => {
  // 获取链接参数

  let cache: any = sessionStorage.getItem('storeDatajson')
  if (cache) {
    try {
      cache = JSON.parse(cache)
      // 把缓存数据直接写回 slidesStore
      slidesStore.setResourcesData({
        title: cache.datajson?.title ?? '未命名文档',
        main_color: cache.bg_color,
        json_url: cache.datajson?.json_url,
      })
      slidesStore.setTitle(cache.datajson?.title ?? '未命名文档')
      slidesStore.setOldTilte(cache.datajson?.title ?? '未命名文档')
    } catch {}
  }
  // 如果存在 fileId，直接 return，什么都不做
  if (useFileId.value && useFileId.value !== 'null') return
  if (chatPPTBeautify.value === 'chatPPTBeautify') {
    return
  }
  if (chatPPTBeautify.value === 'importPPT') {
    return
  }
  if (localStorage.getItem('linkType') === 'CreateEmpty') {
    return
  }
  defualtSlide()
}

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search)
  const lang = urlParams.get('lang')
  if (lang) {
    localStorage.setItem('lang', lang)
    locale.value = lang
  }
  initSlide()
  mainStore.setToken(window._APPKEYTOKEN)
})

onBeforeUnmount(() => {
  localStorage.removeItem('importPPT')
})
</script>
