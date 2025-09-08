<template>
  <div
    class="fullscreen-spin"
    :class="[_isPC ? 'isPcStyle' : 'isMobileStyle']"
    v-if="loading"
    :style="{ '--bg': isPPTLoading ? 'rgba(0,0,0,0.4)' : '' }"
  >
    <div class="spin">
      <div
        class="spinner"
        :style="{ '--borderColor': isPPTLoading ? '#fff' : '#4e3eff' }"
      ></div>
      <div class="text" v-if="isPPTLoading">
        {{ $t('loading') }}{{ time }}{{ $t('play.s') }}）
        <span class="loading_item">.</span>
        <span class="loading_item">.</span>
        <span class="loading_item">.</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { isPC } from '@/utils/common'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const _isPC = isPC()
withDefaults(
  defineProps<{
    loading?: boolean
    tip?: string
    time?: string
    isPPTLoading?: boolean
  }>(),
  {
    loading: false,
    tip: '',
    time: '10',
  }
)
</script>

<style lang="scss" scoped>
.fullscreen-spin {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10000;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--bg);
  transition: background 1s;
}
.spin {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  justify-content: center;
  align-items: center;
}
.spinner {
  width: 60px;
  height: 60px;
  border: 5px solid #fff;
  border-color: var(--borderColor);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spinner 0.8s linear infinite;
}
.text {
  width: 500rem;
  margin-left: 30rem;
  font-size: 18rem;
  color: #fff;
}
@keyframes spinner {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading_item {
  font-size: 20rem;
  color: #fff;
  animation: loadingFrame 0.8s infinite alternate;
  &:nth-child(2) {
    animation-delay: 0.3s;
  }
  &:nth-child(3) {
    animation-delay: 0.6s;
  }
}

@keyframes loadingFrame {
  to {
    opacity: 0.2;
    /* transform: translateY(-0px); */
  }
}

.isPcStyle {
  .text {
    width: 500rem;
  }
}

.isMobileStyle {
  .text {
    width: 200px;
    font-size: 12px;
  }
}
</style>
