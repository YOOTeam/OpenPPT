<template>
  <div class="poolModal-box" v-if="props.visible">
    <div>
      <div class="poolModal-img"></div>
      <div class="poolModal-title">{{ t('OpenModal.text1') }}</div>
      <div class="poolModal-content">
        {{ t('OpenModal.text2') }}
      </div>
      <div
        class="poolModal-btn"
        @click="
          () => {
            mainStore.setOpenNoTokenToobal(false)
            mainStore.setShowToolbar(false)
            mainStore.setMobileLayout(false)
          }
        "
      >
        <span class="btn-text">{{ t('OpenModal.text4') }}</span>
      </div>

      <div class="poolModal-link" @click="openLink">
        {{ t('OpenModal.text3') }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useMainStore } from '@/store'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const mainStore = useMainStore()

const props = defineProps<{
  visible: boolean
}>()

const openLink = () => {
  window.open('https://wiki.yoo-ai.com/api/Open-PPT/open1.1.html')
}
</script>

<style lang="scss" scoped>
.poolModal-box {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #fff;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  .poolModal-img {
    width: 84rem;
    height: 72rem;
    margin: 0 auto;
    background-size: cover;
    background-repeat: no-repeat;
    background-image: url(//image.yoojober.com/users/2025-08/68a6f2611cac9.png);
    margin-bottom: 12rem;
  }
  .poolModal-title {
    font-family: 思源黑体;
    font-size: 14rem;
    font-weight: bold;
    line-height: 23rem;
    letter-spacing: 0em;
    color: #1a1a1a;
    text-align: center;
    margin-bottom: 12rem;
  }
  .poolModal-content {
    font-family: 思源黑体;
    font-size: 12rem;
    font-weight: normal;
    line-height: 23rem;
    letter-spacing: 0em;
    color: #767676;
    margin: 0 14rem;
    margin-bottom: 56rem;
  }
  .poolModal-btn {
    width: 50%;
    margin: 0 auto;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 16rem 32rem;
    border-radius: 7rem;
    background: #453bff;
    cursor: pointer;
    &:hover {
      background: #3a32e6;
    }
    &:active {
      background: #2a24c4;
    }

    .btn-text {
      font-family: 思源黑体;
      font-size: 14rem;
      font-weight: normal;
      color: #ffffff;
    }
    margin-bottom: 7rem;
  }
  .poolModal-link {
    font-family: 思源黑体;
    font-size: 14rem;
    font-weight: normal;
    line-height: 23rem;
    letter-spacing: 0em;
    color: #0256ff;
    text-align: center;
    margin-bottom: 12rem;
    cursor: pointer;
  }
}
</style>
