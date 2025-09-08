<template>
  <div class="downLoad-page">
    <div class="thumbnails-view">
      <div class="thumbnails" ref="imageThumbnailsRef">
        <ThumbnailSlide
          class="save-thumbnail"
          v-for="item in slides"
          :key="item.id"
          :slide="item"
          :size="slideSize"
          :id="`save-${item.id}`"
        />
      </div>
    </div>

    <div :class="[_isPC ? 'isPC' : 'isPhone']">
      <div class="close-box-icon" @click="handleCloseSave">
        <IconClose />
      </div>
      <p class="firstP">
        <img
          src="@/assets/image/pptX.png"
          alt=""
          v-if="downLoadType === 'ppt'"
        />
        <img
          src="@/assets/image/pdf.png"
          alt=""
          v-else-if="downLoadType === 'pdf'"
        />
        <img src="@/assets/image/imageFile.png" alt="" v-else />

        <template v-if="exportStatus === 'success'">
          <span>
            {{ $t('dowload.tips1') }}{{ titleFile }}{{ $t('dowload.tips2') }}
          </span>
        </template>
        <template v-else-if="exportStatus === 'error'">
          <span>{{ titleFile }}{{ $t('dowload.error') }}</span>
        </template>
        <template v-else>
          <span
            >{{ $t('dowload.tips3') }}{{ titleFile
            }}{{ $t('dowload.tips2') }}</span
          >
        </template>
      </p>
      <template v-if="exportStatus === 'success'">
        <p class="nextP">
          {{ titleFile }}{{ $t('dowload.tips4') }}
          <span style="color: #0edb0e">{{ $t('dowload.success') }}</span>
          <span v-if="exportPPTXFile"
            >，{{ $t('dowload.fileUrl') }}：{{ exportPPTXFile }}</span
          >
          <span v-else>，{{ $t('dowload.tips5') }}</span>
        </p>
        <p class="search" v-if="exportPPTXFile">
          <span @click="openAppFile"> {{ $t('dowload.tips6') }} </span>
        </p>
      </template>
      <template v-else-if="exportStatus === 'error'">
        <p class="nextP">
          {{ titleFile }}{{ $t('dowload.tips4')
          }}<span style="color: #f53f3f">{{ $t('dowload.error1') }}</span
          >{{ $t('dowload.tips7') }}
        </p>
      </template>
      <template v-else>
        <p class="nextP" v-if="downLoadType === 'ppt'">
          {{ $t('dowload.tips8') }}
        </p>
        <p class="nextP" v-if="downLoadType === 'pdf'">
          {{ $t('dowload.tips9') }}
        </p>
        <p
          class="nextP"
          v-if="downLoadType === 'image' || downLoadType === 'png'"
        >
          {{ $t('dowload.tips10') }}
        </p>
        <p class="lastP" v-if="downLoadType === 'ppt'">
          {{ $t('dowload.tips11') }}
        </p>
      </template>

      <div class="progress-box">
        <div class="progress-line">
          <div class="progress-width" :style="{ '--w': progress + '%' }"></div>
        </div>
        <div>{{ progress }}%</div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, nextTick, onUnmounted, watch, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import ThumbnailSlide from '@/views/components/ThumbnailSlide/index.vue'
import useExport from '@/hooks/useExport'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const {
  exportPPTXApi,
  exporting,
  exportImage,
  exportPDF,
  openAppFile,
  exportStatus,
  exportPPTXFile,
} = useExport()
import { isPC } from '@/utils/common'
const props = defineProps<{
  downLoadType?: string
}>()
const _isPC = isPC()
const slidesStore = useSlidesStore()
const mainStore = useMainStore()
const { slides } = storeToRefs(slidesStore)

const slideSize = computed(() => {
  return 1600
})
const titleFile = ref('PPT')
const progress = ref(0)
const imageThumbnailsRef = ref<HTMLElement>()
const handleCloseSave = () => {
  mainStore.setShowDownLoadFile(false)
}

// 延迟定时器
const delay = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const saveTime = ref(null)
const setSaveSetp = (randomNumber, timer) => {
  if (saveTime.value) {
    clearInterval(saveTime.value)
  }
  const setp = randomNumber / 100
  let count = 0
  const oldprogress = progress.value
  saveTime.value = setInterval(() => {
    count += setp
    if (count > 100) {
      count = 100
    }
    const num = parseInt(count) + oldprogress
    if (exporting.value === false) {
      progress.value = 100
      clearInterval(saveTime.value)
    } else {
      if (num < 95) {
        progress.value = parseInt(num)
      }
    }
  }, timer)
}

const handlePPTExport = () => {
  nextTick(async () => {
    setSaveSetp(100, 100)
    await exportPPTXApi()
  })
}

const handlePDfExport = () => {
  nextTick(async () => {
    if (!imageThumbnailsRef.value) return
    await delay(200)
    setSaveSetp(100, 100)
    exportPDF(imageThumbnailsRef.value)
  })
}

const handleImgExport = () => {
  nextTick(async () => {
    if (!imageThumbnailsRef.value) return
    setSaveSetp(100, 10)
    exportImage(imageThumbnailsRef.value, 'png', 1, true)
  })
}
watch(
  () => props.downLoadType,
  (newData, oldData) => {
    if (newData !== oldData) {
      switch (newData) {
        case 'ppt':
        case 'PPT':
          titleFile.value = 'PPT'
          handlePPTExport()
          break
        case 'pdf':
        case 'PDF':
          titleFile.value = 'PDF'
          handlePDfExport()
          break
        case 'image':
        case 'png':
          titleFile.value = t('broaDside.images')
          handleImgExport()
          break

        default:
          break
      }
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  clearInterval(saveTime.value)
})
</script>
<style lang="scss" scope>
.downLoad-page {
  position: fixed;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  z-index: 5001;
  background: rgba($color: #000000, $alpha: 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
  .search {
    display: flex;
    justify-content: center;
    align-items: center;
    span {
      margin-top: 10rem;
      padding: 6rem 15rem;
      border-radius: 10rem;
      background: transparent;
      transition: background 0.3s ease;
      &:hover {
        background: $lightColor;
      }
      &:active {
        color: darken($themeColor, 20%);
      }
    }
    color: $themeColor;
    font-size: 16rem;
    cursor: pointer;
  }

  .out-tips {
    font-size: 14rem;
    color: #f56a6a;
    line-height: 1;
  }

  .progress-box {
    font-size: 20rem;
    display: flex;
    align-items: center;
    margin-top: 10rem;
    padding: 0 10rem 0 60rem;
    font-weight: 800;
    color: #1a1a1a;
  }

  .progress-line {
    width: calc(100% - 100rem);
    height: 12rem;
    border-radius: 8rem;
    opacity: 1;
    background: #e5eeff;
    margin-right: 20rem;
    overflow: hidden;
  }

  .progress-width {
    width: var(--w);
    height: 100%;
    border-radius: 30rem;
    background: #4e3eff;
    transition: width 1s;
  }
  .thumbnails-view {
    @include absolute-0();
    opacity: 0;

    &::after {
      @include absolute-0();
    }
  }

  .close-box-icon {
    font-weight: 800;
    font-size: 22rem;
    color: #a8a4a4;
    position: absolute;
    right: 20rem;
    top: 20rem;
    cursor: pointer;
    &:hover {
      color: rgba($color: #8c8686, $alpha: 0.3);
    }
    &:active {
      color: rgba($color: #d8d8d8, $alpha: 1);
    }
  }

  .flexLayout {
    display: flex;
    color: #fff;
  }

  .isPC {
    position: absolute;
    line-height: 30rem;
    width: 716rem;
    border-radius: 12rem;
    opacity: 1;
    background: #ffffff;
    font-size: 18rem;
    font-weight: 500;
    text-align: center;
    padding: 33rem 0rem;
    z-index: 9999;
    transform: translate(-50%, -50%);
    top: 50%;
    left: 50%;

    .firstP {
      font-size: 20rem;
      font-weight: bold;
      color: #1a1a1a;
      margin: 15rem 0;
      img {
        width: 26rem;
        vertical-align: sub;
        margin-right: 4rem;
      }
    }
    .nextP {
      font-size: 16rem;
      color: #1a1a1a;
    }
    .lastP {
      font-size: 14rem;
      color: #ff2020;
    }
  }

  .isPhone {
    position: relative;
    line-height: 30rem;
    width: 100%;
    margin: 0 20rem;
    border-radius: 12rem;
    opacity: 1;
    background: #ffffff;
    font-size: 18rem;
    font-weight: 500;
    text-align: center;
    padding: 20rem 22rem;
    .progress-box {
      padding: 0;
      margin-top: 10rem;
      font-size: 14rem;
    }
    .progress-line {
      width: calc(100% - 67rem);
    }
    .firstP {
      font-size: 16rem;
      font-weight: bold;
      color: #1a1a1a;
      margin: 10rem 0;
      display: flex;
      justify-content: center;
      align-items: center;
      img {
        width: 30px;
        height: auto;
        vertical-align: middle;
      }
    }
    .nextP {
      font-size: 12rem;
      color: #1a1a1a;
    }
    .lastP {
      line-height: 20rem;
      font-size: 12rem;
      color: #ff2020;
    }
  }
}
</style>
