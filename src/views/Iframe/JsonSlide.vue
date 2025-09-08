<template>
  <div class="iframe-slide-JsonOne">
    <template v-if="slideList">
      <template v-for="(item, index) in slideList" :key="index.id">
        <div class="layout-item">
          <ThumbnailSlide
            v-if="item"
            class="thumbnail"
            :slide="item"
            :size="size"
          />
          <div class="marck"></div>
        </div>
      </template>
    </template>

    <template v-if="loading">
      <div class="loding-status" style="background-color: #fff">
        <div class="loading-box">
          <img
            class="beautifyLoading-gif"
            src="@/assets/image/f-3.gif"
            alt=""
          />
        </div>
        <p style="color: #333">AI渲染中...</p>
      </div>
    </template>
  </div>
</template>
<script lang="ts" setup>
import { onMounted, ref, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore, useMainStore } from '@/store'
import ThumbnailSlide from '@/views/components/ThumbnailSlide/index.vue'
import useIframeMessage from '@/hooks/useIframeMessage'
import useInitSlides from '@/hooks/useInitSlides'
import { fetchUrl } from '@/utils/common'
const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const { presentation } = storeToRefs(mainStore)
const { initThemeModelSlids, fontSizeResize } = useInitSlides()

const props = withDefaults(
  defineProps<{
    slideData?: any
  }>(),
  {
    slideData: null,
  }
)
const loading = ref(true)
const size = ref(800)
const allDeepViewData = ref(null)
const slideList = ref([])
const initList = async () => {
  loading.value = true
  if (props.slideData) {
    size.value = props.slideData?.size || 800
  }

  let content: any = ''
  try {
    content = await fetchUrl(props.slideData.jsonUrl)
    if (!content) return ''
    const jsonData = JSON.parse(content)
    const themeColorData = jsonData?.presentation?.docTheme?.themeColors
    mainStore.setPresentationItem({
      width: jsonData.presentation.width,
      height: jsonData.presentation.height,
      name: allDeepViewData.value?.title,
      docTheme: jsonData.presentation.docTheme,
    })
    slidesStore.setThemeColorList(themeColorData)
    const w = presentation.value.width
    const h = presentation.value.height

    slidesStore.setViewportSize(w)
    slidesStore.setViewportRatio(h / w)

    jsonData.slides = initThemeModelSlids(jsonData.slides)
    slideList.value = jsonData.slides
    nextTick(() => {
      fontSizeResize(slideList.value)
    })

    loading.value = false
  } catch (error) {
    loading.value = false
    console.error('Error fetching data:', error)
  }
}

onMounted(async () => {
  initList()
})
</script>

<style lang="scss" scope>
.iframe-slide-JsonOne {
  position: relative;
  overflow: auto;
  width: 100%;
  height: 100%;

  .layout-item {
    position: relative;
    overflow: hidden;
  }

  .loding-status {
    position: absolute;
    left: 0%;
    top: 0%;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: rgba($color: #000, $alpha: 0.5);
    .beautifyLoading-gif {
      width: 45rem;
    }
  }
}
</style>
