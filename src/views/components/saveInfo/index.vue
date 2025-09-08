<template>
  <div
    class="save-page"
    :style="{
      background: showSaveBox.view ? 'rgba(0,0,0,0.7)' : '',
      top: showSaveBox.view ? '0' : '-1000000000px',
    }"
  >
    <div class="thumbnails-view">
      <div class="thumbnails" ref="imageThumbnailsRef">
        <ThumbnailSlide
          class="save-thumbnail"
          v-for="item in slides"
          :key="item.id"
          :slide="item"
          :size="_isPC ? 1600 : 400"
          :id="`save-${item.id}`"
        />
      </div>
    </div>

    <div :class="[_isPC ? 'isPC' : 'isPhone']" v-if="showSaveBox.view">
      <div class="close-box-icon" @click="handleCloseSave">
        <IconClose />
      </div>
      <p class="firstP" :class="isSaveError ? 'isSaveError' : ''">
        <img src="" alt="" /><span>{{ titleTips }}</span>
      </p>
      <p class="nextP">{{ $t('save.tips1') }}...</p>
      <p class="lastP">
        {{ $t('save.tips2') }}
      </p>
      <div class="progress-box">
        <div class="progress-line">
          <div class="progress-width" :style="{ '--w': progress + '%' }"></div>
        </div>
        <div>{{ progress }}%</div>
      </div>
      <div class="save-btn-box" v-if="isSaveError">
        <div class="save-btn">{{ $t('save.saveBtn') }}</div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { onMounted, ref, nextTick, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import ThumbnailSlide from '@/views/components/ThumbnailSlide/index.vue'
import { isPC } from '@/utils/common'
import useSaveJSON from '@/hooks/useSaveJSON'
import { baseUrlConfig } from '@/utils/baseUrl'
import message from '@/utils/message'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const _isPC = isPC()
const slidesStore = useSlidesStore()
const mainStore = useMainStore()
const { saveJSONData } = useSaveJSON()
const { useFileId, showSaveBox } = storeToRefs(mainStore)
const { slides } = storeToRefs(slidesStore)

const titleTips = ref(t('save.out'))
const imgFile = ref([])
const progress = ref(0)
const baseUrl = baseUrlConfig.hostUrl
const imageThumbnailsRef = ref<HTMLElement>()
const isClickClose = ref(false)
const handleCloseSave = () => {
  isClickClose.value = true
  mainStore.setSaveBoxShow({ show: false, view: true })
}

const saveTime = ref(null)
const resultSave = ref(false)
const setSaveSetp = (randomNumber) => {
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
    const num = parseInt(count * 0.7) + oldprogress
    progress.value = num > 100 ? 100 : parseInt(num)
    if (num > 100 || resultSave.value) {
      if (resultSave.value && progress.value < 100) {
        progress.value = 100
      }
      clearInterval(saveTime.value)
    }
  }, 0)
}

const outUrl = () => {
  const refsUrl = localStorage.getItem('refs_url')
  const url = refsUrl ? refsUrl : `${baseUrl}`
  return url
}

const backUrl = () => {
  localStorage.removeItem('ShareDownload')
  if (showSaveBox.value?.backUrl === 'wx') {
    mainStore.setMobileChangeMode('preview')
  } else {
    setTimeout(() => {
      window.location.href = outUrl()
    }, 1000)
  }
}
const isSaveError = ref(false)
const handleSaveJson = async () => {
  const slidesData = JSON.parse(JSON.stringify(slides.value))
  if (!useFileId.value) {
    progress.value = 100
    localStorage.removeItem('downLoadFile')
    localStorage.removeItem('isAction')
    if (showSaveBox.value?.noBackUrl) {
      handleCloseSave()
    } else {
      backUrl()
    }

    return
  }
  setSaveSetp(100)
  const res = await saveJSONData(slidesData)
  resultSave.value = true
  if (res.code === 200) {
    isSaveError.value = false
    titleTips.value = t('save.out')
    localStorage.removeItem('downLoadFile')
    localStorage.removeItem('isAction')
    if (isClickClose.value) return
    message.success(t('save.success'))
    if (showSaveBox.value?.noBackUrl) {
      handleCloseSave()
    } else {
      backUrl()
    }
  } else {
    isSaveError.value = true
    titleTips.value = t('save.error')
    message.error(t('save.error1'))
  }
}

const handleBtnSave = async () => {
  if (!showSaveBox.value.noInfo) {
    message.info(t('save.saveing'), { duration: 600000 })
  }

  try {
    const isUpload = showSaveBox.value.isNewUplaod
    const saveData = await saveJSONData(null)
    message.closeAll()
    if (saveData.code === 200) {
      if (!showSaveBox.value.noInfo) {
        message.success(t('save.success'))
      }
    } else {
      message.error(t('save.error'))
    }
    handleCloseSave()
  } catch (error) {
    handleCloseSave()
  }
}
onMounted(() => {
  nextTick(() => {
    if (showSaveBox.value.view === false) {
      handleBtnSave()
    } else {
      handleSaveJson()
    }
  })
})

onUnmounted(() => {
  clearInterval(saveTime.value)
})
</script>
<style lang="scss" scope>
.save-page {
  position: fixed;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  z-index: 5001;
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
  .save-btn-box {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .save-btn {
    margin-top: 10rem;
    padding: 8rem 30rem;
    border-radius: $borderRadius;
    background: $themeColor;
    color: #fff;
    font-size: 14rem;
    cursor: pointer;
    &:hover {
      background: $lightColor;
      color: $themeColor;
    }
    &:active {
      background: $themeColor;
    }
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
    margin-top: 30rem;
    padding: 0 10rem 0 60rem;
    font-weight: 800;
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
    }
    .isSaveError {
      color: #ff2020;
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
    padding: 20rem 30rem;
    .progress-box {
      padding: 0;
      margin-top: 10rem;
      font-size: 16rem;
    }
    .progress-line {
      width: calc(100% - 67rem);
    }
    .firstP {
      font-size: 18rem;
      font-weight: bold;
      color: #1a1a1a;
      margin: 15rem 0;
    }
    .nextP {
      font-size: 14rem;
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
