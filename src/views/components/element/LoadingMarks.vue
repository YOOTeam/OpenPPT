<template>
  <div class="loading-marks">
    <div class="isLoading-tips" :style="{ top: _isPC ? '5%' : '8%' }">
      <div class="loading-message">
        <span class="tips-Style">
          {{
            createLoading?.tips ? createLoading?.tips : t('lastReamrk.tips7')
          }}
        </span>
        <span v-if="!createLoading?.noshow && initDataTotal > 0">
          {{ slideIndex + 1 < 10 ? `0${slideIndex + 1}` : slideIndex + 1 }}/{{
            initDataTotal < 10 ? `0${initDataTotal}` : initDataTotal
          }}{{ $t('catalog.page') }}
        </span>
        <span
          class="cancel-loading"
          @click="handleClose"
          v-if="createLoading?.showClose"
        >
          {{ $t('lastReamrk.cancel') }}
        </span>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import message from '@/utils/message'
import { useI18n } from 'vue-i18n'
import { isPC } from '@/utils/common'
const _isPC = isPC()
const { t } = useI18n()
const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const { initDataTotal, createLoading } = storeToRefs(mainStore)
const { slideIndex } = storeToRefs(slidesStore)
const handleClose = () => {
  const mesg = createLoading.value.closeMarks || t('speack.close')
  message.info(mesg)
  mainStore.setShowLoadingMarks(false)
  mainStore.setCreateLoading({
    isclose: true,
    closeMarks: '',
  })
}
</script>
<style lang="scss" scoped>
.loading-marks {
  position: fixed;
  z-index: 100000;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background: linear-gradient(
    176deg,
    rgb(243 239 239 / 25%) 0%,
    rgba(255, 255, 255, 0) 100%
  );

  .isLoading-tips {
    white-space: nowrap;
    font-size: 14rem;
    color: #656464;
    position: absolute;
    left: 50%;
    top: 5%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
  }

  .loading-message {
    background: #fff;
    padding: 15rem 25rem;
    border-radius: 10rem;
    box-shadow: 1rem 1rem 3rem 0rem #e5e5e5c0;
    display: flex;
    justify-content: center;
  }
  .tips-Style {
    min-width: 317rem;
    text-align: center;
  }

  .cancel-loading {
    margin-left: 20rem;
    cursor: pointer;
    color: #aaaaaa;
    &:hover {
      color: #000;
    }
    &:active {
      color: #656464;
    }
  }
}
</style>
