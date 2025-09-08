<template>
  <div class="mobile-preview" ref="mobileRef">
    <Header :changeMode="changeMode" :showBack="true" />
    <div class="catalog-list" @touchstart="handleClickBlankArea()">
      <div
        class="catalog-item"
        v-for="(slide, index) in slides"
        :key="slide.id"
        :id="`mobile-preview-${slide.id}`"
      >
        <ThumbnailSlide
          :slide="slide"
          :size="screenWidth - 20"
          :visible="index < slidesLoadLimit"
        />
        <div
          class="mobile-order"
          :style="{
            background: themeColorList?.accent5,
            color: themeColorList?.text1,
          }"
        >
          {{ index + 1 }}
        </div>
      </div>
    </div>
    <div class="mobile-menu">
      <div
        class="mobile-menu-item"
        @click="changeMode('editor')"
        v-if="!isAllDisableEdit"
      >
        <i class="iconfont icon-bianji"></i>
        <span> 编辑 </span>
      </div>

      <ChatBtn v-if="!isAllDisableEdit" />

      <div class="mobile-menu-item" @click="handlePlay()">
        <i class="iconfont icon-bofang"></i> <span> 播放 </span>
      </div>

      <!-- <div
        class="mobile-menu-item"
        style="color: #ccc"
        @click.stop="importantFile"
      >
        <i class="iconfont icon-daoru"></i>
        <span> 导入 </span>
      </div>

      <div
        class="mobile-menu-item"
        style="color: #ccc"
        @click.stop="downloadFileClick"
      >
        <i class="iconfont icon-xiazai1"></i>
        <span> 下载 </span>
      </div> -->
    </div>
    <!-- <FileTloobar
      v-if="openFileBox"
      :fileStyle="fileStyle"
      :download="handleDownload"
    /> -->
    <div class="mobile-file-box" v-if="openFileBox">
      <div class="title-s">提示</div>
      <div>
        <p>作者已授权下载权限</p>
        <p>请前往电脑端下载复制</p>
      </div>
      <Button
        :type="'primary'"
        class="mobile-file-box-btn"
        @click="openFileBox = false"
      >
        我知道了
      </Button>
    </div>
    <DownLoadFile v-if="showDownLoadFile" :downLoadType="downLoadType" />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore, useMainStore } from '@/store'
import useLoadSlides from '@/hooks/useLoadSlides'
import type { Mode } from '@/types/mobile'
import Header from './MobileEditor/Header.vue'
import ChatBtn from '@/views/Mobile/MobileChat/ChatBtn.vue'
import ThumbnailSlide from '@/views/components/ThumbnailSlide/index.vue'
import DownLoadFile from '@/views/components/DownLoadFile.vue'
import Button from '@/components/Button.vue'
const props = defineProps<{
  changeMode: (mode: Mode) => void
}>()

const openFileBox = ref(false)
const fileStyle = ref('')
const { slides, themeColorList } = storeToRefs(useSlidesStore())
const { slidesLoadLimit } = useLoadSlides()

const mainStore = useMainStore()
const { isAllDisableEdit } = storeToRefs(mainStore)

const mobileRef = ref<HTMLElement>()
const screenWidth = ref(0)

onMounted(() => {
  if (!mobileRef.value) return
  screenWidth.value = mobileRef.value.clientWidth
})

const handlePlay = () => {
  props.changeMode('player')
}

const handleClickBlankArea = () => {
  openFileBox.value = false
}

const downloadFileClick = () => {
  openFileBox.value = true
  fileStyle.value = 'download'
}

const downLoadType = ref('')
</script>

<style lang="scss" scoped>
.mobile-preview {
  height: 100%;
  padding-top: 4rem;
}
.mobile-file-box {
  position: fixed;
  top: 50%;
  left: 50%;
  width: 300rem;
  padding: 25rem 0;
  transform: translate(-50%, -50%);
  background: #fff;
  border-radius: 10rem;
  font-size: 16rem;
  color: #989797;
  z-index: 111;
  text-align: center;
  box-shadow: 0 0 10px 5px rgba(0, 0, 0, 0.1);
  .title-s {
    color: #1a1a1a;
    margin-bottom: 20rem;
  }
  p {
    line-height: 20rem;
  }
  .mobile-file-box-btn {
    margin-top: 20rem;
  }
}
.catalog-list {
  height: calc(100vh - 160rem);
  padding: 10rem;
  overflow: auto;
}
.catalog-item {
  display: flex;
  justify-content: center;
  align-items: center;
  .thumbnail-slide {
    background: transparent !important;
  }
  box-shadow: 0 0 15rem 0 rgba(0, 0, 0, 0.1);
  border-radius: 15rem;
  overflow: hidden;
  position: relative;
  & + .catalog-item {
    margin-top: 10rem;
  }

  .mobile-order {
    position: absolute;
    left: 10rem;
    bottom: 10rem;
    font-size: 12rem;
    padding: 4rem 0;
    border-radius: 4rem;
    width: 30rem;
    text-align: center;
  }
}
</style>
<style lang="scss">
.mobile-menu {
  height: 108rem;
  position: relative;
  box-shadow: 0 -2rem 4rem 0 rgba($color: #333, $alpha: 0.05);
  background: #fff;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  border-top-left-radius: 10rem;
  border-top-right-radius: 10rem;
  padding-top: 10rem;

  .mobile-menu-item {
    flex: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    font-size: 12rem;
    color: #8d8c8c;

    .iconfont {
      font-size: 48rem;
    }
  }
}
</style>
