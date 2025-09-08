<template>
  <div class="layout-content defualtView">
    <Thumbnails class="layout-content-left" />
    <div class="layout-content-center">
      <!-- <CanvasTool class="center-top" /> -->
      <EditorReadOnly
        class="center-body"
        :style="{ height: `calc(100% - ${remarkHeight}px)` }"
        v-if="isAllDisableEdit"
      />
      <Canvas
        class="center-body"
        :style="{ height: `calc(100% - ${remarkHeight}px)` }"
        v-if="!isAllDisableEdit"
      />
      <Toobar
        v-if="!isAllDisableEdit"
        class="center-right"
        :style="{ height: `calc(100% - ${remarkHeight}px)` }"
      />
      <div
        class="center-bottom"
        :style="{ height: `${remarkHeight}px` }"
        :class="showActiveRemark ? 'isActiveReamrk' : ''"
      >
        <div
          class="ai-remark"
          :class="createLoading?.showNote ? 'show-note' : ''"
          @click="handleClickbten"
          v-if="!isAllDisableEdit"
        >
          <div class="ai-speech">
            <div class="ai-remark-btn" @click="handleCreateRemark">
              <img src="@/assets/image/remark-icon.png" alt="" />
              {{ $t('speack.speack') }}
            </div>
            <span class="select-box" @click="handleSelectNote">
              <span class="select-circle">
                <i class="iconfont icon-duihao" v-if="selectAll"></i>
              </span>
              {{ $t('speack.allSpeack') }}
            </span>
          </div>
        </div>
        <Remark :clickSource="clickSource" v-model:height="remarkHeight" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import useGlobalHotkey from '@/hooks/useGlobalHotkey'
import usePasteEvent from '@/hooks/usePasteEvent'
import useSpeechText from '@/hooks/useSpeechText'
import Canvas from '../Canvas/index.vue'
import EditorReadOnly from '../Canvas/EditorReadOnly.vue'
import Thumbnails from '../Thumbnails/index.vue'
import Toobar from '../RightToobar/index.vue'
import Remark from '../Remark/index.vue'

import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const { handleCreateSpeech } = useSpeechText()
const mainStore = useMainStore()
const { showToolbar, isAllDisableEdit, createLoading } = storeToRefs(mainStore)

const remarkHeight = ref(66)

useGlobalHotkey()
usePasteEvent()
const showActiveRemark = ref(false)
const selectAll = ref(false)
const clickSource = ref('null')
const handleSelectNote = () => {
  selectAll.value = !selectAll.value
}
const handleClickbten = () => {
  if (createLoading.value?.isBlur === true) {
  }
}
// 生成演讲稿
const handleCreateRemark = async () => {
  if (createLoading.value?.isclose === true) {
    //  取消生成
  }
  handleCreateSpeech(2, !selectAll.value)
}
watch(
  () => createLoading.value?.showRemark,
  () => {
    if (createLoading.value?.height) {
      remarkHeight.value = createLoading.value?.height
    }
    if (createLoading.value?.showRemark === true) {
      if (!createLoading.value?.height) {
        remarkHeight.value = 300
      }
      showActiveRemark.value = true
    } else if (createLoading.value?.showRemark === false) {
      remarkHeight.value = 66
    } else {
      showActiveRemark.value = false
    }
  },
  {
    deep: true,
  }
)
watch(showToolbar, (value) => {
  if (value === false) {
    mainStore.updateViewTemplate({ show: false, data: null })
  }
})
</script>

<style lang="scss" scoped>
$rightWidth: 92rem;
$leftWidth: 176rem;

.isActiveReamrk {
  .remark {
    background: #fff !important;
    border-radius: 10rem;
  }
}

.layout-content-left {
  width: 176rem;
  height: calc(100% - 10px);
  flex-shrink: 0;
}

.layout-content-center {
  display: flex;
  flex-wrap: wrap;
  width: calc(100% - $leftWidth);

  .center-top {
    height: 40px;
  }

  .center-body,
  .center-bottom,
  .center-right {
    transition: height 0.5s ease;
  }

  .center-body {
    width: calc(100% - $rightWidth);
    overflow-y: auto;
  }

  .center-bottom {
    width: 100%;
    padding: 18rem 18rem 8rem;
    position: relative;
    .ai-remark {
      position: absolute;
      top: -30rem;
      left: 18rem;
      font-size: 14rem;
      user-select: none;
      color: #fff;
      display: none;
      align-items: center;
      .ai-speech {
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        padding: 5rem;
        border-radius: 10rem;
        align-items: center;
      }
      .line-box {
        width: 2rem;
        height: 16rem;
        background: rgba(255, 255, 255, 0.66);
        margin-right: 5rem;
      }

      .ai-remark-btn,
      .select-box {
        height: 35rem;
        display: flex;
        align-items: center;
        cursor: pointer;
        color: #1a1a1a;
        font-size: 14rem;
        margin-right: 5rem;
        padding: 6rem 15rem 6rem 12rem;
        border-radius: 6rem;
        color: #fff;
        img {
          width: 20rem;
          margin-right: 5rem;
        }
        .iconfont {
          font-size: 20rem;
          color: #767676;
        }
        .color-style {
          font-family: Alibaba PuHuiTi 2;
          font-size: 16rem;
          font-weight: 900;
          text-align: justify; /* 浏览器可能不支持 */
          margin: 0 4rem;
          font-variation-settings: 'opsz' auto;
          font-feature-settings: 'kern' on;
          background: linear-gradient(270deg, #6040fc 0%, #e750e6 76%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        &:hover {
          background: #000000;
        }
        &:active {
          background: #000000b6;
        }
      }
      .select-box {
        i {
          margin-right: 4rem;
        }
        &:hover {
          background: #000000;
        }
        &:active {
          background: #000000b6;
        }
      }

      .select-circle {
        width: 18rem;
        height: 18rem;
        border-radius: 50%;
        border: 1rem solid #fff;
        margin-right: 5rem;
        position: relative;
        .iconfont {
          font-size: 10rem;
          font-weight: 800;
          position: absolute;
          left: 50%;
          top: 60%;
          transform: translate(-50%, -50%);
          color: #fff;
        }
      }
      .select-box {
        font-size: 14rem;
        display: flex;
        align-items: center;
        cursor: pointer;
        &:hover {
          .select-circle {
            background: rgba(255, 255, 255, 0.5);
          }
          color: #cbcaca;
        }
      }
    }
    &:hover {
      .ai-remark {
        display: flex;
      }
    }

    .show-note {
      display: flex;
    }
  }

  .center-right {
    width: $rightWidth;
  }
}
</style>
<style lang="scss">
$height: 70rem;
.layout-content {
  position: relative;
  z-index: 1;
  height: calc(100% - $height);
  display: flex;
  font-size: 14rem;
}
.center-body::-webkit-scrollbar {
  width: 0;
  height: 0;
}
</style>
