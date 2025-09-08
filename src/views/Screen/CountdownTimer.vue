<template>
  <MoveablePanel
    class="countdown-timer"
    :class="[
      `${setData.timerData?.model}`,
      setData.timerData?.isCountDown ? 'isCountDown' : '',
    ]"
    :left="left"
    :top="top"
  >
    <a-progress
      v-if="setData.timerData?.model === 'circlePress'"
      class="progress-time"
      type="circle"
      :stroke-width="10"
      :percent="percent"
      :width="200 * rem"
      :color="'#4E3EFF'"
      :track-color="'#ffffff'"
      :show-text="false"
    />
    <div :class="[`${setData.timerData?.model}-box`]" class="flexCC">
      <div
        class="flexCC"
        :class="setData.timerData?.model === 'number' ? 'isNumber-content' : ''"
      >
        <span
          class="time-num time-right"
          :class="[`${setData.timerData?.model}-num`]"
          >{{ fillDigit(minute, 2) }}</span
        >
        <span class="time-tips" :class="[`${setData.timerData?.model}-num`]"
          >:</span
        >
        <span class="time-num" :class="[`${setData.timerData?.model}-num`]">{{
          fillDigit(second, 2)
        }}</span>
      </div>
      <template
        v-if="
          !setData.timerData?.isCountDown &&
          setData.timerData?.model !== 'number'
        "
      >
        <div
          class="flexCC"
          :class="
            setData.timerData?.model === 'circlePress' ? 'circlePress-tips' : ''
          "
        >
          <div class="line-time"></div>
          <span class="time-num time-right">{{
            fillDigit(Math.floor(countTime / 60), 2)
          }}</span>
          <span class="time-tips">:</span>
          <span class="time-num">{{ fillDigit(countTime % 60, 2) }}</span>
        </div>
      </template>
    </div>
    <div class="close-btn" @click="emit('close')">
      <IconClose class="icon" />
    </div>
  </MoveablePanel>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { useMainStore, useScreenStore } from '@/store'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { fillDigit } from '@/utils/common'
import MoveablePanel from '@/components/MoveablePanel.vue'
const mainStore = useMainStore()
const { rem } = storeToRefs(useScreenStore())
const props = withDefaults(
  defineProps<{
    left?: number
    top?: number
    timeData?: any
  }>(),
  {
    left: 5,
    top: 5,
    timeData: {
      isAction: false,
      isReset: false,
      timerData: { isCountDown: false, timer: 0, model: 'default' },
    },
  }
)

const emit = defineEmits<{
  (event: 'close'): void
}>()

const width = computed(() => {
  let w = 216
  if (setData.value.timerData.model === 'number') {
    w = 140
  } else if (setData.value.timerData.model === 'circlePress') {
    w = ''
  }
  return w ? w / rem.value : ''
})
const height = ref()
const percent = ref(0)
const timer = ref<number | null>(null)
const countTime = ref(600)
const inTiming = ref(false)
const isCountdown = ref(false)
const time = ref(0)
const minute = computed(() => Math.floor(time.value / 60))
const second = computed(() => time.value % 60)
const setData = ref({
  isAction: false,
  isReset: false,
  timerData: { isCountDown: false, timer: 0, model: 'default' },
})

const inputEditable = computed(() => {
  return !isCountdown.value || inTiming.value
})

const clearTimer = () => {
  if (timer.value) clearInterval(timer.value)
}

onUnmounted(clearTimer)
watch(
  () => props.timeData,
  (newVal) => {
    mainStore.setSaveTimerData(newVal)
  }
)

const pause = () => {
  clearTimer()
  inTiming.value = false
}

const reset = () => {
  clearTimer()
  inTiming.value = false
  if (isCountdown.value) {
    time.value =
      setData.value.timerData.timer > 0 ? setData.value.timerData.timer : 600
  } else time.value = 0
}

const start = () => {
  percent.value = 0
  clearTimer()
  if (isCountdown.value) {
    timer.value = setInterval(() => {
      time.value = time.value - 1
      const count =
        (setData.value.timerData.timer - time.value) /
        setData.value.timerData.timer

      percent.value = count
      if (time.value <= 0) reset()
    }, 1000)
  } else {
    timer.value = setInterval(() => {
      time.value = time.value + 1
      const count = time.value / setData.value.timerData.timer
      percent.value = count
      if (time.value > 36000) pause()
    }, 1000)
  }

  inTiming.value = true
}

const toggle = () => {
  if (inTiming.value) pause()
  else start()
}

const toggleCountdown = () => {
  isCountdown.value = !isCountdown.value
  reset()
}

const changeTime = (
  e: FocusEvent | KeyboardEvent,
  type: 'minute' | 'second'
) => {
  const inputRef = e.target as HTMLInputElement
  let value = inputRef.value
  const isNumber = /^(\d)+$/.test(value)
  if (isNumber) {
    if (type === 'second' && +value >= 60) value = '59'
    time.value =
      type === 'minute'
        ? +value * 60 + second.value
        : +value + minute.value * 60
  } else {
    inputRef.value =
      type === 'minute'
        ? fillDigit(minute.value, 2)
        : fillDigit(second.value, 2)
  }
}

const handleSetTime = (data) => {
  setData.value = data
  if (!data) return
  if (data.operation === 'action') {
    if (data.isAction) start()
    else pause()
  } else if (data.operation === 'reset') {
    if (data.isReset) reset()
    percent.value = 0
  } else if (
    data.operation === 'openCount' ||
    data.operation === 'editor' ||
    data.operation === 'changeModel'
  ) {
    percent.value = 0
    countTime.value = data.timerData.timer
    isCountdown.value = data.timerData.isCountDown

    reset()
  }
}
watch(time, () => {
  const time = fillDigit(minute.value, 2) + ':' + fillDigit(second.value, 2)
  mainStore.setScreenCountTime(time)
})
onMounted(() => {
  const data = mainStore.saveTimerData
  if (data) {
    handleSetTime(data)
  }
})
watch(
  () => props.timeData,
  (newValue) => {
    if (newValue) {
      handleSetTime(newValue)
    }
  },
  {
    deep: true,
    immediate: true,
  }
)
</script>

<style lang="scss" scoped>
.countdown-timer {
  user-select: none;
  border: none;

  .flexCC {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  ::v-deep(.content) {
    overflow: hidden;
    padding: 0;
  }
  &.default {
    border-radius: 12rem;
    background: rgba(62, 62, 62, 0.8);
    overflow-y: hidden;
    box-shadow: inset 1rem 1rem 3rem 0 rgb(121 120 120);
  }

  &.number {
    width: 196rem;
    height: 110rem;
    border-radius: 8rem;
    padding: 10rem;
  }

  &.circlePress {
    width: 200rem;
    height: 200rem;
    border-radius: 50%;
  }

  .time-num {
    width: 66rem;
    font-size: 40rem;
    font-weight: 500;
  }

  .time-right {
    text-align: right;
  }
  .number-num {
    color: $themeColor;
    font-size: 50rem;
    font-family: 'UnidreamLED';
  }
  .time-tips {
    font-size: 28rem;
    margin: 0 8rem;
  }
  .line-time {
    width: 2rem;
    height: 26rem;
    background: rgba(255, 255, 255, 0.66);
    margin: 0 5rem;
  }
  .number-box {
    width: 100%;
    height: 100%;
    background: #e8e8e8;
    border-radius: 6rem;
    box-shadow: inset 0rem 0rem 6rem 0 #0000003b;

    .isNumber-content {
      padding: 5rem 18rem;
      background: #fff;
      border-radius: 6rem;
      box-shadow: 0rem 0rem 6rem 0 #0000003b;
      .time-num {
        width: 50rem;
      }
    }
  }

  .circlePress-box {
    position: absolute;
    top: 0;
    left: 0;
    width: 200rem;
    height: 200rem;
    border-radius: 50%;
    flex-direction: column;
    .line-time {
      background: $themeColor;
    }
    .time-tips,
    .time-num {
      color: $themeColor;
    }

    .circlePress-tips {
      position: absolute;
      bottom: 48rem;
      .line-time {
        display: none;
      }
      .time-tips,
      .time-num {
        font-size: 20rem;
        color: #adacac;
      }
    }
  }
  .default-box {
    font-size: 28rem;
    font-weight: 500;
    line-height: normal;
    letter-spacing: 0em;
    color: #ffffff;
    padding: 10rem 20rem;
    width: 400rem;
    height: 80rem;
  }
}
.header {
  height: 16rem;
  font-size: 14rem;
  margin-bottom: 16rem;
  display: flex;
  align-items: center;

  .text-btn {
    margin-right: 8rem;
    cursor: pointer;

    &:hover,
    &.active {
      color: $themeColor;
    }
  }
}
.content {
  display: flex;
  justify-content: space-between;
  padding: 0 5rem;
}
.timer {
  width: 54rem;
  height: 54rem;
  border-radius: 50%;
  background-color: rgba($color: $themeColor, $alpha: 0.05);
  font-size: 22rem;
  overflow: hidden;

  input {
    width: 100%;
    height: 100%;
    border: 0;
    outline: 0;
    background-color: transparent;
    text-align: center;
  }
}
.colon {
  height: 54rem;
  line-height: 54rem;
  font-size: 22rem;
}
.icon-btn {
  width: 20rem;
  height: 20rem;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}
.pause,
.play {
  font-size: 17rem;
}
.reset {
  font-size: 12rem;
}
.close-btn {
  position: absolute;
  top: 0;
  right: 0;
  padding: 10rem;
  cursor: pointer;
}
</style>
