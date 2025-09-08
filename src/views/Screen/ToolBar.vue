<template>
  <div class="content-toolbar">
    <!-- 自由点击演示 -->
    <span
      :class="{ active: animation }"
      @click="handleSetBar('animation')"
      class="tool-btn"
      v-tooltip="t('play.animation')"
    >
      <i class="iconfont icon-dianji"></i>
    </span>
    <!-- 依次聚焦演示 -->
    <span
      :class="{ active: interaction }"
      @click="handleSetBar('interaction')"
      class="tool-btn"
      v-tooltip="t('play.interaction')"
    >
      <i class="iconfont icon-zhugejujiaofangda"></i>
    </span>
    <!-- 激光红点演示 -->
    <span
      :class="{ active: laserPen }"
      @click="handleSetBar('laserPen')"
      class="tool-btn"
      v-tooltip="t('play.laserPen')"
    >
      <i class="iconfont icon-jiguangbi"></i>
    </span>
    <span class="line"></span>
    <!-- 笔画墨迹 -->
    <span
      class="tool-btn"
      v-tooltip="t('play.writing')"
      @click="handleSetBar('pen')"
    >
      <i class="iconfont icon-huabigongju"></i>
    </span>
    <!-- 倒计/计时器 -->
    <span
      class="tool-btn"
      v-tooltip="t('play.timer')"
      :class="{ active: timerlVisible }"
      @click="handleSetBar('timer')"
    >
      <i class="iconfont icon-jishiqi"></i>
    </span>
    <span class="line"></span>
    <span
      v-if="showType === 'normal'"
      class="tool-btn"
      v-tooltip="t('play.presenterView')"
      @click="handleSetBar('presenter')"
    >
      <i class="iconfont icon-yanjiangzhemoshi"></i>
    </span>
    <span
      v-else
      class="tool-btn"
      v-tooltip="t('play.baseView')"
      @click="handleSetBar('base')"
    >
      <i class="iconfont icon-putongshitumoshi"></i>
    </span>
    <!-- 窗口播放（缩小） -->
    <span
      class="tool-btn"
      v-tooltip="t('play.back')"
      v-if="fullscreen"
      @click.stop="handleExitFullscreen()"
    >
      <i class="iconfont icon-quanping"></i>
    </span>
    <!-- 窗口播放（放大） -->
    <span
      class="tool-btn"
      v-tooltip="t('play.fullScreen')"
      v-else
      @click.stop="enterFullscreen()"
    >
      <i class="iconfont icon-quanping1"></i>
    </span>
    <!-- 退出播放 -->
    <span class="tool-btn" @click="exitScreening()">
      <i class="iconfont icon-tuichubofang1"></i>{{ $t('play.outPlay') }}
    </span>
  </div>
</template>
<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import { enterFullscreen } from '@/utils/fullscreen'
import useScreening from '@/hooks/useScreening'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const mainStore = useMainStore()
const { exitScreening } = useScreening()
const { getPPTStyle } = storeToRefs(mainStore)

withDefaults(
  defineProps<{
    showType?: string
    timerlVisible: boolean
    laserPen: boolean
    animation: boolean
    fullscreen: boolean
    interaction: boolean
  }>(),
  {
    showType: 'normal',
  }
)
const emit = defineEmits<{
  (event: 'setBar', payload: string): void
  (event: 'exitFullscreen'): void
}>()

const handleExitFullscreen = () => {
  emit('exitFullscreen')
}
const handleSetBar = (type: string) => {
  emit('setBar', type)
}
</script>
<style lang="scss" scoped>
.content-toolbar {
  display: flex;
  align-items: center;
  border-radius: 8rem;
  font-size: 12px;
  border-radius: 10px;
  background: rgba(62, 62, 62, 0.8);
  color: #ffffff;
  padding: 2px 12px;
  margin-top: 10px;
  box-shadow: 0 2px 12px 0 rgba(56, 56, 56, 0.2);
  .line {
    background: #ffffff;
    width: 1px;
    height: 15px;
    margin: 0 8px;
  }

  .thesie-box {
    display: none;
    width: 35px;
    height: 35px;
    margin: 4px 4px 4px 0;
    cursor: pointer;
    overflow: hidden;
    border-radius: 6px;
    img {
      width: 100%;
    }
  }

  .tool-btn {
    cursor: pointer;
    justify-content: center;
    align-items: center;
    display: flex;
    padding: 3px 6px;
    border-radius: 8px;
    .iconfont {
      font-size: 20px;
    }
    user-select: none;
    &:hover,
    &.active {
      background: #000000;
    }

    & + .tool-btn {
      margin-left: 10px;
    }
  }
}
</style>
