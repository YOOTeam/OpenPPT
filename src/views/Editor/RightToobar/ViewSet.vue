<template>
  <div class="viewPort-set">
    <i
      class="iconfont handler-item i-icon icon-putongshitu"
      v-tooltip="t('footer.putongshitu')"
      :class="{ active: pptViewData.type === 'default' }"
      @click="handleChangeViewWithTransition('default')"
    ></i>
    <i
      class="iconfont handler-item i-icon icon-liulanshitu"
      v-tooltip="t('footer.liulanshitu')"
      @click="handleChangeViewWithTransition('browseView')"
      :class="{ active: pptViewData.type === 'browseView' }"
    ></i>
    <IconSearch
      class="handler-item"
      :class="{ active: showSearchPanel }"
      v-tooltip="`${t('footer.search')}（Ctrl + F）`"
      @click="toggleSraechPanel()"
    />
    <template
      v-if="pptViewData.type === 'default' || pptViewData.type === 'browseView'"
    >
      <IconMinus
        class="handler-item viewport-size"
        v-tooltip="`${t('footer.radusSize')}（Ctrl + -）`"
        @click="scaleCanvas('-')"
      />
      <Popover trigger="click" v-model:value="canvasScaleVisible">
        <template #content>
          <PopoverMenuItem
            center
            v-for="item in canvasScalePresetList"
            :key="item"
            @click="applyCanvasPresetScale(item)"
            >{{ item }}%</PopoverMenuItem
          >
          <PopoverMenuItem center @click="resetCanvas()">{{
            $t('footer.autoSize')
          }}</PopoverMenuItem>
        </template>
        <span class="text">{{
          pptViewData?.type === 'browseView'
            ? pptViewData.browsePoint
            : canvasScalePercentage
        }}</span>
      </Popover>
      <IconPlus
        class="handler-item viewport-size"
        v-tooltip="`${t('footer.addSize')}（Ctrl + =）`"
        @click="scaleCanvas('+')"
      />
      <IconFullScreen
        class="handler-item viewport-size-adaptation"
        v-tooltip="`${t('footer.autoSize')}（Ctrl +  0）`"
        @click="resetCanvas()"
      />
    </template>
  </div>
</template>
<script lang="ts" setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import useScaleCanvas from '@/hooks/useScaleCanvas'
import Popover from '@/components/Popover.vue'
import PopoverMenuItem from '@/components/PopoverMenuItem.vue'
import { useI18n } from 'vue-i18n'
import { useViewTransition } from '@/hooks/useViewTransitionAPI'
const { t } = useI18n()

const slidesStore = useSlidesStore()
const { pptViewData } = storeToRefs(slidesStore)
const mainStore = useMainStore()
const { showSearchPanel, presentation } = storeToRefs(mainStore)
const canvasScalePresetList = [200, 150, 125, 100, 75, 50]
const canvasScaleVisible = ref(false)

const handleChangeView = (type: string) => {
  slidesStore.updataPPTViewData({ type: type, sourceID: '' })
}
const handleChangeViewWithTransition = useViewTransition((type: string) =>
  handleChangeView(type)
)
const showSourceView = computed(() => {
  return presentation.value?.tags?.normal.find(
    (item: any) => item.key === 'TAG_STREAM_ID'
  )?.value
})

const {
  scaleCanvas,
  setCanvasScalePercentage,
  resetCanvas,
  canvasScalePercentage,
} = useScaleCanvas()

const applyCanvasPresetScale = (value: number) => {
  setCanvasScalePercentage(value)
  canvasScaleVisible.value = false
}

// 打开搜索替换面板
const toggleSraechPanel = () => {
  mainStore.setSearchPanelState(!showSearchPanel.value)
}
</script>
<style lang="scss">
.viewPort-set {
  z-index: 2;
  height: 35rem;
  position: fixed;
  right: 20rem;
  bottom: 8rem;
  background: #fff;
  display: flex;
  justify-content: center;
  padding: 5rem;
  border-radius: 6rem;
  font-size: 20rem;
  box-shadow: 0px 4px 10px 0px rgba(0, 0, 0, 0.12);
  user-select: none;
  .i-icon {
    width: 28rem;
    font-size: 14rem;
    margin: 0 2rem;
    &:hover {
      background: #e5e3ff;
      color: $themeColor;
    }

    &:active {
      background: #dddaff;
      color: $themeColor;
    }
  }
  .active {
    background: #dddaff;
    color: $themeColor;
  }
  .i-icon,
  .popover {
    color: #3d3d3d;
    font-size: 14rem;
    border-radius: 5rem;
    line-height: 40rem;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .text {
    margin: 0 4rem;
    min-width: 50rem;
  }

  .popover {
    font-size: 14rem;
  }
}
</style>
