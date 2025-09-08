<template>
  <div class="iframe-box">
    <SlideModle :slideData="slideData" v-if="type === 'showList'" />
    <ThemeModle :slideData="slideData" v-else-if="type === 'showOneTheme'" />
    <JsonSlide :slideData="slideData" v-else-if="type === 'showJsonSlide'" />
  </div>
</template>
<script lang="ts" setup>
import { onMounted, onBeforeMount, ref, onBeforeUnmount } from 'vue'
import SlideModle from './SlideModle.vue'
import useIframeMessage from '@/hooks/useIframeMessage'
import ThemeModle from './ThemeModle.vue'
import JsonSlide from './JsonSlide.vue'

const { isInIfram } = useIframeMessage()
const slideData = ref(null)
const type = ref('')
const GetIframeMessage = async (event: any) => {
  // 确保消息来源可靠
  const data = event.data
  if (data?.channel === 'editor-parent') {
    slideData.value = data.themeData
    slideData.value.iframeIndex = data?.index || 0
    if (data?.type === 'loadSlideThemeList') {
      type.value = 'showList'
      slideData.value.type = 'loadingList'
    } else if (data?.type === 'refreshThemeList') {
      // 刷新模版
      type.value = 'showList'
      slideData.value.type = 'refreshList'
    } else if (data?.type === 'changeThemeListColor') {
      // 更改颜色
      type.value = 'showList'
      slideData.value.type = 'changeColor'
    } else if (data?.type === 'searchTheme') {
      type.value = 'showOneTheme'
      // 查单个模版
    } else if (data?.type === 'loadJsonUrl') {
      // 用json渲染
      type.value = 'showJsonSlide'
      slideData.value.type = 'loadJsonUrl'
    } else if (data?.type === 'oneThemeChangeColor') {
      type.value = 'showOneTheme'
      slideData.value.type = 'oneThemeChangeColor'
    }
  }
}

onBeforeMount(async () => {
  if (isInIfram()) {
    window.addEventListener('message', GetIframeMessage)
  }
})

onBeforeUnmount(() => {
  localStorage.removeItem('linkType')
  window.removeEventListener('message', GetIframeMessage)
})
</script>
<style lang="scss">
.iframe-box {
  width: 100%;
  height: 100%;
  font-size: 14rem;
}
</style>
