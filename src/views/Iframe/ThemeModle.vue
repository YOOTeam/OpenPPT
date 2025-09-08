<template>
  <div class="iframe-slide-one">
    <template v-if="slideList?.length">
      <template v-for="(item, index) in slideList" :key="index.id">
        <div
          class="layout-item"
          v-if="
            item?.tags?.custom?.page_type === 'cover' ||
            (!item?.tags?.custom?.page_type && slideList?.length === 1)
          "
        >
          <ThumbnailSlide
            v-if="item"
            class="thumbnail"
            :slide="item"
            :size="size"
          />
          <div class="marck"></div>
        </div>
      </template>
      <div
        class="silide-box"
        v-if="slideList?.length > 1"
        :style="{ bottom: bottomSize }"
      >
        <div
          class="color_box"
          :style="{ background: slideApiData?.page_color, opacity: '0.7' }"
        ></div>
        <template v-for="(item, index) in slideListChild" :key="index.id">
          <div class="silide-item" v-if="index < 3">
            <ThumbnailSlide
              v-if="item"
              class="thumbnail"
              :slide="item"
              :size="itemSize"
            />
            <div class="marck"></div>
          </div>
        </template>
      </div>
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
import { watch, onMounted, ref, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore, useMainStore } from '@/store'
import ThumbnailSlide from '@/views/components/ThumbnailSlide/index.vue'
import useIframeMessage from '@/hooks/useIframeMessage'
import useThemeFileTemplate from '@/hooks/useThemeFileTemplate'
import useInitSlides from '@/hooks/useInitSlides'
import { fetchUrl } from '@/utils/common'
import { getTemplatColors } from '@/api/careate'
import useCommonApi from '@/hooks/useCommonApi'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const { SendIframeMessage, isInIfram } = useIframeMessage()
const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const { presentation } = storeToRefs(mainStore)
const { elementAddThemeColor, returnFontStyleData, handleRichPages } =
  useThemeFileTemplate()
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
const itemSize = ref(200)
const allDeepViewData: any = ref({})
const slideList = ref([])
const slideListChild = ref([])
const slideApiData: any = ref({})
const bottomSize = ref('5%')
const initList = async () => {
  loading.value = true
  bottomSize.value = props.slideData?.bottomSize || '5%'

  let content: any = ''
  try {
    content = await fetchUrl(props.slideData.jsonUrl)
    if (props.slideData?.title) {
      allDeepViewData.value.title = props.slideData.title
    }

    if (!content) return ''
    const jsonData = JSON.parse(content)
    let themeColorData = jsonData?.presentation?.docTheme?.themeColors
    if (props.slideData?.colorList?.length) {
      const colors = JSON.parse(JSON.stringify(props.slideData.colorList))
      const colorObj: any = {}
      const key = [
        'bg1',
        'text1',
        'bg2',
        'text2',
        'accent1',
        'accent2',
        'accent3',
        'accent4',
        'accent5',
        'accent6',
        'hyperLink',
        'followedHyperlink',
      ]
      colors.forEach((item: any, index: number) => {
        colorObj[key[index]] = item
      })
      themeColorData = JSON.parse(JSON.stringify(colorObj))
    }
    mainStore.setPresentationItem({
      width: jsonData?.presentation?.width || 960,
      height: jsonData?.presentation?.height || 540,
      name: allDeepViewData.value?.title,
      docTheme: jsonData?.presentation?.docTheme,
    })
    slideApiData.value.page_color = themeColorData.accent1
    slidesStore.setThemeColorList(themeColorData)
    const w = presentation.value.width
    const h = presentation.value.height

    slidesStore.setViewportSize(w)
    slidesStore.setViewportRatio(h / w)

    jsonData.slides = initThemeModelSlids(jsonData.slides)
    slideList.value = jsonData.slides
    if (allDeepViewData.value?.title && !slideApiData.value?.style) {
      slideApiData.value.style = await useCommonApi().getAnalyseStyle(
        allDeepViewData.value.title
      )
    }
    const fontStyleData = JSON.parse(
      JSON.stringify(returnFontStyleData(slideApiData.value?.style))
    )

    slideList.value = await Promise.all(
      slideList.value.map(async (item: any) => {
        if (
          item?.tags?.custom?.page_type === 'cover' ||
          item?.tags?.custom?.page_type === 'end' ||
          (!item?.tags?.custom?.page_type && slideList.value?.length === 1)
        ) {
          const viewdata = JSON.parse(JSON.stringify(allDeepViewData.value))

          if (item?.tags?.custom?.page_type === 'end') {
            viewdata.title = t('create.endTitle')
          }
          item = await handleRichPages(null, item, fontStyleData, viewdata)
        }

        return item
      })
    )

    nextTick(() => {
      fontSizeResize(slideList.value)
      const list = JSON.parse(JSON.stringify(slideList.value)).filter(
        (item: any) => item?.tags?.custom?.page_type !== 'cover'
      )
      const hasEnd = list.some(
        (item) => item?.tags?.custom?.page_type === 'end'
      )
      const contentKey = ['background', 'multcontent', 'content']
      let newList = []
      if (!hasEnd) {
        list.forEach((item) => {
          if (
            item?.tags?.custom?.page_type === 'chapter' ||
            item?.tags?.custom?.page_type === 'catalog'
          ) {
            newList.push(item)
          }
          const hasContent = newList.find((item) =>
            contentKey.includes(item?.tags?.custom?.page_type)
          )

          if (
            !hasContent &&
            contentKey.includes(item?.tags?.custom?.page_type)
          ) {
            newList.push(item)
          }
        })
      } else {
        newList = list.filter(
          (item) => !contentKey.includes(item?.tags?.custom?.page_type)
        )
      }
      slideListChild.value = newList
    })

    if (props.slideData.color) {
      await handleChangColor(props.slideData.color)
    }

    loading.value = false
    const data: any = {
      id: '',
      fontStyle: fontStyleData,
      color_style: props.slideData.color,
      page_color: themeColorData?.accent1,
      style: '',
      jsonUrl: props.slideData.jsonUrl,
      themeColorData: themeColorData,
      title: props.slideData?.title,
    }
    if (props.slideData?.colorList?.length) {
      data.colorList = props.slideData.colorList
    }
    SendIframeMessage({
      type: 'choseOne',
      datas: data,
      iframeIndex: props.slideData?.iframeIndex,
    })
  } catch (error) {
    console.error('Error fetching data:', error)
    loading.value = false
  }
}
// 主题颜色
const getColorsStyle = async (limite?: number, color?: string) => {
  const params: any = {
    limit: limite || 16,
    color_style: color,
  }
  const res: any = await getTemplatColors(params)
  const data = res.code === 200 ? res.data.data : []
  return data
}
const handleChangColor = async (color: string) => {
  if (!color) return
  const colorRes = await getColorsStyle(5, color)
  if (!colorRes?.length) return
  const randomIndex = Math.floor(Math.random() * colorRes.length)
  const colorData = colorRes[randomIndex]
  colorData.colorList = colorData.colors ? JSON.parse(colorData.colors) : []
  if (colorData.colorList?.length) {
    const colorObj: any = {}
    const key = [
      'bg1',
      'text1',
      'bg2',
      'text2',
      'accent1',
      'accent2',
      'accent3',
      'accent4',
      'accent5',
      'accent6',
      'hyperLink',
      'followedHyperlink',
    ]
    colorData.colorList.forEach((item: any, index: number) => {
      colorObj[key[index]] = item
    })
    colorData.themeColorData = JSON.parse(JSON.stringify(colorObj))
  }
  slideApiData.value.page_color = colorData.themeColorData.accent1
  slidesStore.setThemeColorList(colorData.themeColorData)

  slideList.value = slideList.value.map((item: any) => {
    return elementAddThemeColor(item, colorData.themeColorData)
  })
}

onMounted(async () => {
  if (props.slideData) {
    size.value = props.slideData?.size || 800
    itemSize.value = props.slideData?.itemSize || 200
    slideApiData.value.style = props.slideData?.style || ''
  }
  allDeepViewData.value = {
    pageType: '封面页',
    title: '',
    author: '',
    company: '',
    model: 'layout-image-detect',
    version: '1.1.0',
  }
  initList()
})

watch(
  () => props.slideData,
  async (newValue, oldValue) => {
    if (newValue.type === 'oneThemeChangeColor') {
      initList()
    }
  },
  {
    deep: true,
  }
)
</script>

<style lang="scss" scope>
.iframe-slide-one {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  .silide-box {
    position: absolute;
    bottom: 5%;
    padding: 10rem;
    left: 50%;
    transform: translateX(-50%);
    border-radius: 10rem;
    overflow: hidden;
    display: flex;

    .color_box {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
    }
  }

  .silide-item {
    position: relative;
    margin: 6rem;
    border-radius: 10rem;
    overflow: hidden;
  }
  .layout-item {
    display: inline-block;
    vertical-align: top;
    position: relative;
    margin: 6rem;
    border-radius: 10rem;
    overflow: hidden;
    border: 2rem solid #d3d3dd;
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
