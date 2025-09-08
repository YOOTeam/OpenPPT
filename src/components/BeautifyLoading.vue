<template>
  <div
    class="fullscreen-spin"
    :class="_isPC ? 'pc_loading_beautify' : 'mobile_loading_beautify'"
  >
    <template v-if="beautifyLoadingData.loadingType === 'beautify'">
      <img class="loading-img-gif" src="@/assets/image/f-1.gif" alt="" />
      <div class="message-container">
        <div
          class="loading-beautify"
          v-for="(item, index) in messageList"
          :key="index"
          :style="{ '--timers': '6s', animationDelay: `${2 * index}s` }"
          :class="index === 2 ? 'showWard' : ''"
        >
          <IconCheckOne theme="filled" fill="#19D6DD" />{{ item }}
        </div>
      </div>
    </template>
    <template v-else-if="beautifyLoadingData.loadingType === 'beautifyAction'">
      <img class="loading-img-gif" src="@/assets/image/f-1.gif" alt="" />
      <div class="loading-tips">
        <div class="page-num" v-html="beautifyLoadingData.messageTips"></div>
      </div>
    </template>
    <template v-else>
      <img class="loading-img-gif" src="@/assets/image/f-6.gif" alt="" />
      <div class="loading-tips">
        <!-- v--->
        <p class="page-num">
          {{ isUplaod ? t('lastReamrk.tips1') : t('lastReamrk.tips2') }}

          <template v-if="initDataTotal">
            <span>
              {{
                slideIndex > -1 && slideIndex < 9
                  ? `0${slideIndex + 1}`
                  : slideIndex + 1
              }}
              / {{ initDataTotal < 10 ? `0${initDataTotal}` : initDataTotal }}
            </span>
          </template>
        </p>
        <p v-if="isUplaod">{{ $t('lastReamrk.tips3') }}</p>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import { isPC } from '@/utils/common'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const { initDataTotal, beautifyLoadingData } = storeToRefs(mainStore)
const { slideIndex } = storeToRefs(slidesStore)
const _isPC = isPC()
const props = defineProps({
  isUplaod: {
    type: Boolean,
    default: false,
  },
})

const messageList = reactive([
  t('beautify.tips32'),
  t('beautify.tips33'),
  t('beautify.tips34'),
])
</script>

<style lang="scss" scoped>
.fullscreen-spin {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba($color: #000, $alpha: 0.7);
  font-size: 14rem;
}

.loading-img-gif {
  width: 250rem;
  height: 170rem;
  margin-bottom: 40rem;
}

.message-container {
  position: relative;
  height: 30px; /* 根据你的文本高度调整 */
  overflow: hidden;
  width: 600rem;
  display: flex;
  justify-content: center;
}

.loading-beautify {
  font-size: 14rem;
  text-align: center;
  display: flex;
  align-items: center;
  .i-icon {
    margin-right: 10rem;
    font-size: 24rem;
  }
  position: absolute;
  opacity: 0;
  animation: rotateMessages var(--timers) forwards;
}

.showWard {
  animation: rotateMessages-show var(--timers) forwards;
}
@keyframes rotateMessages {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  10%,
  30% {
    opacity: 1;
    transform: translateY(0);
  }
  40%,
  100% {
    opacity: 0;
    transform: translateY(-20px);
  }
}

@keyframes rotateMessages-show {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  10%,
  30% {
    opacity: 1;
    transform: translateY(0);
  }
  40%,
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.loading-tips {
  font-size: 14rem;
  text-align: center;
  color: #fff;

  .page-num {
    font-size: 14rem;
    margin-bottom: 20rem;
  }
}

.mobile_loading_beautify {
  .loading-tips {
    font-size: 14rem;
  }
  .page-num {
    font-size: 18rem;
  }
  img {
    width: 160rem;
    height: auto;
  }
}
</style>
