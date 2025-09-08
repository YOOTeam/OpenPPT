<template>
  <div class="slide-toolbar" @click="mainStore.setMobileLayout(false)">
    <div class="remark" v-if="!mobileLayout">
      <template v-if="isAllDisableEdit">
        <div class="textarea" v-html="remark"></div>
      </template>
      <div
        v-else
        class="textarea"
        contenteditable="true"
        v-html="remark"
        placeholder="点击输入演讲者备注"
        @input="($event) => handleInputMark($event)"
      ></div>
    </div>
    <div class="flexlayout">
      <div :class="mobileLayout || isAllDisableEdit ? 'w100' : 'page-list'">
        <MobileThumbnails />
      </div>
      <div class="add-page" v-show="!mobileLayout && !isAllDisableEdit">
        <span @click="createSlide()"><IconPlus class="icon" /></span>
      </div>
    </div>

    <div class="toolbar" v-if="!mobileLayout" @click.stop>
      <div class="mobile-menu">
        <template v-if="!isAllDisableEdit">
          <div class="mobile-menu-item" @click="openLayoutAI($event)">
            <i class="iconfont icon-AIpaiban"></i>
            <span> AI排版 </span>
          </div>
          <div class="mobile-menu-item" @click="addElement()">
            <i class="iconfont icon-charuyuansu"></i> <span> 插入元素 </span>
          </div>
          <ChatBtn v-if="!isAllDisableEdit" />

          <div class="mobile-menu-item" @click="elementStyle()">
            <i class="iconfont icon-yangshishezhi"></i> <span> 样式设置 </span>
          </div>
        </template>

        <div class="mobile-menu-item" @click="handlePlay()">
          <i class="iconfont icon-bofang"></i> <span> 演示播放 </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore, useMainStore } from '@/store'

import useSlideHandler from '@/hooks/useSlideHandler'
import { nanoid } from 'nanoid'
import MobileThumbnails from '../MobileThumbnails.vue'
import ChatBtn from '@/views/Mobile/MobileChat/ChatBtn.vue'

const props = defineProps<{
  openLayoutAI: (e: MouseEvent) => void
  addElement: () => void
  elementStyle: () => void
  changeMode: (mode: Mode, back?: string) => void
}>()
const mainStore = useMainStore()
const { mobileLayout, useFileId, isAllDisableEdit } = storeToRefs(mainStore)
const slidesStore = useSlidesStore()
const { currentSlide } = storeToRefs(slidesStore)

const { createSlide, copyAndPasteSlide, deleteSlide } = useSlideHandler()

const remark = computed(() => currentSlide.value?.remark || '')

const handleInputMark = (e: Event) => {
  const value = e.target.innerHTML
  slidesStore.updateSlide({ remark: value })
}

const handlePlay = () => {
  props.changeMode('player', 'editor')
}
</script>

<style lang="scss" scoped>
.slide-toolbar {
  height: 252rem;
  box-shadow: 0 0 15rem 0 rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 2;
  .remark,
  .flexlayout {
    padding: 0 4rem;
  }
}
.flexlayout {
  display: flex;
  .w100 {
    width: 100%;
  }
  .page-list {
    width: calc(100% - 40rem);
  }
  ::v-deep(.catalog-list) {
    padding-left: 2rem;
  }

  .add-page {
    width: 40rem;

    padding: 9rem 0 9rem 4rem;
    font-size: 12rem;
    display: flex;
    justify-content: center;
    align-items: center;
    span {
      width: 100%;
      height: 100%;
      background: #fff;
      color: $themeColor;
      border-radius: 6rem;
      font-size: 20rem;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
}

.toolbar-list {
  margin-top: 4rem;
  height: 108rem;
  width: 100%;
  position: relative;
  box-shadow: 0 -2rem 4rem 0 rgba($color: #333, $alpha: 0.05);
  background: #fff;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  border-top-left-radius: 10rem;
  border-top-right-radius: 10rem;
  padding-top: 12rem;

  .menu-item {
    flex: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    font-size: 12rem;
    color: #1a1a1abc;

    .icon {
      margin-bottom: 8rem;
      font-size: 24rem;
    }
  }
}
.remark {
  position: relative;
  flex: 1;
  line-height: 1.2;
  border-radius: 2rem;
  width: calc(100% - 8rem);
  margin: auto;

  .textarea {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    resize: none;
    border: 0;
    outline: 0;
    padding: 8rem 10rem;
    font-size: 12rem;
    box-sizing: border-box;

    border-radius: 6rem;
    @include absolute-0();
    background: rgba(255, 255, 255, 0.4);
    color: #fff;
  }

  .textarea::before {
    content: attr(placeholder); /* 使用data-*属性作为占位符文本 */
    color: #fff; /* 默认颜色 */
    display: block; /* 或者 inline，根据需求 */
    pointer-events: none; /* 防止点击事件传播到父元素 */
  }

  .textarea:not(:empty)::before {
    content: none; /* 如果内容不为空，则不显示占位符 */
  }
}
.toolbar {
  height: 108rem;
}
.row {
  width: 100%;
  display: flex;
  align-items: center;
  margin-bottom: 5rem;

  .icon {
    margin-right: 3rem;
  }
}
</style>
