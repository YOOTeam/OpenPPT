<template>
  <div class="time-setting">
    <span class="tool-btn" @click="handleAction">
      {{ !isAction ? t('play.startTime') : t('play.endTime') }}
    </span>
    <span class="tool-btn" @click="handleReset">
      {{ $t('play.resetTime') }}
    </span>

    <span class="tool-btn timer">
      <span></span>
      <span class="timer-editor">
        <input
          class="editor-box"
          type="number"
          :max="99"
          :value="starTime"
          :disabled="isAction"
          @mousedown.stop
          @blur="($event) => changeTime($event, 'minute')"
          @keydown.stop
          @keydown.enter.stop="($event) => changeTime($event, 'minute')"
        />
        <span style="color: #9c9b9b69">{{ $t('play.m') }}</span>
        <input
          class="editor-box"
          type="number"
          :max="59"
          :value="endTime"
          :disabled="isAction"
          @mousedown.stop
          @blur="($event) => changeTime($event, 'second')"
          @keydown.stop
          @keydown.enter.stop="($event) => changeTime($event, 'second')"
        />
        <span style="color: #9c9b9b69">{{ $t('play.s') }}</span>
      </span>
    </span>
    <span class="line"></span>
    <span class="tool-btn model-box">
      <span>{{ modelName }}</span>
      <div class="model-more">
        <IconDown class="arrow" />
        <div class="modelList">
          <div
            v-for="item in modelList"
            :key="item.model"
            @click="handleChangeModel(item)"
          >
            {{ item.name }}
          </div>
        </div>
      </div>
    </span>
    <span class="flexCC"
      ><span style="margin-right: 6px">{{ $t('play.timeSet') }}</span>
      <Switch
        class="time-switch"
        v-model:value="timerData.isCountDown"
        @update:value="(value) => handleOpenCount(value)"
      />
    </span>
  </div>
</template>
<script setup lang="ts">
import { ref, watch, reactive, computed, onMounted } from 'vue'
import Switch from '@/components/Switch.vue'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import { fillDigit } from '@/utils/common'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const mainStore = useMainStore()
const { screenCountTime, saveTimerData } = storeToRefs(mainStore)

const isAction = ref(false)
const isReset = ref(false)
const timerData = ref({ isCountDown: false, timer: 600, model: 'default' })
const starTime = ref('10')
const endTime = ref('00')
const modelList = reactive([
  {
    model: 'default',
    name: t('play.default'),
  },
  {
    model: 'circlePress',
    name: t('play.circlePress'),
  },
  {
    model: 'number',
    name: t('play.number'),
  },
])
watch(
  () => saveTimerData.value,
  () => {
    if (saveTimerData.value?.timerData) {
      timerData.value = saveTimerData.value.timerData
      // 同步更新所有配置
      const start = Math.floor(timerData.value.timer / 60)
      const end = timerData.value.timer % 60
      starTime.value = fillDigit(start, 2)
      endTime.value = fillDigit(end, 2)
    }
  },
  { immediate: true }
)

watch(screenCountTime, () => {
  if (screenCountTime.value) {
    if (
      isAction.value &&
      !timerData.value.isCountDown &&
      timerData.value.timer > 0
    ) {
      const arr = screenCountTime.value.split(':')
      const start = arr[0]
      const end = +arr[1]
      const count = +start * 60 + end

      if (count >= timerData.value.timer) {
        isAction.value = false
        emits('action', {
          isAction: isAction.value,
          isReset: isReset.value,
          timerData: timerData.value,
          operation: 'action',
        })
      }
    }
  }
})
const changeTime = (
  e: FocusEvent | KeyboardEvent,
  type: 'minute' | 'second'
) => {
  const inputRef = e.target as HTMLInputElement
  const value = inputRef.value
  const isNumber = /^(\d)+$/.test(value)
  if (isNumber) {
    if (value > 99) {
      if (type === 'minute') {
        starTime.value = 99
      } else {
        endTime.value = 59
      }
    } else {
      if (type === 'minute') {
        starTime.value = value
      } else {
        endTime.value = value
      }
    }
  } else {
    inputRef.value = type === 'minute' ? starTime.value : endTime.value
  }

  const end = +endTime.value
  const count = +starTime.value * 60 + end
  timerData.value.timer = count
  isReset.value = true
  isAction.value = false
  emits('action', {
    isAction: isAction.value,
    isReset: isReset.value,
    timerData: timerData.value,
    operation: 'editor',
  })
}

const modelName = computed(() => {
  const model = modelList.find((item) => item.model === timerData.value.model)
  return model?.name
})
const emits = defineEmits(['action'])
const handleAction = () => {
  isAction.value = !isAction.value
  isReset.value = false
  emits('action', {
    isAction: isAction.value,
    isReset: isReset.value,
    timerData: timerData.value,
    operation: 'action',
  })
}

const handleReset = () => {
  isAction.value = false
  isReset.value = true
  emits('action', {
    isAction: isAction.value,
    isReset: isReset.value,
    timerData: timerData.value,
    operation: 'reset',
  })
}

const handleOpenCount = (value) => {
  isAction.value = false
  isReset.value = true
  timerData.value.timer = timerData.value.timer || 600
  const start = Math.floor(timerData.value.timer / 60)
  const end = timerData.value.timer % 60
  starTime.value = fillDigit(start, 2)
  endTime.value = fillDigit(end, 2)

  emits('action', {
    isAction: isAction.value,
    isReset: isReset.value,
    timerData: timerData.value,
    operation: 'openCount',
  })
}

const handleChangeModel = (item) => {
  isAction.value = false
  isReset.value = true
  timerData.value.model = item.model
  emits('action', {
    isAction: isAction.value,
    isReset: isReset.value,
    timerData: timerData.value,
    operation: 'changeModel',
  })
}
</script>
<style lang="scss">
.time-setting {
  white-space: nowrap;
  display: flex;
  .flexCC {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .timer {
    background: #000000;
    margin-right: 10px;
  }
  .timer-editor {
    display: flex;
    justify-content: center;
    align-items: center;
    .editor-box {
      width: 26px;
      margin: 0 2px;
      outline: none;
      text-align: center;
      background-color: transparent;
      border: none;
    }
    .defaultTime {
      width: 60px;
      text-align: center;
    }
  }

  .tool-btn {
    cursor: pointer;
    justify-content: center;
    align-items: center;
    display: flex;
    padding: 6rem;
    border-radius: 8rem;
    .iconfont {
      font-size: 20rem;
    }
    user-select: none;

    &:hover,
    &.active {
      background: #000000;
    }

    & + .tool-btn {
      margin-left: 15rem;
    }
  }

  .arrow {
    transition: all 0.5s;
  }
  .model-more {
    position: relative;
    margin: 0 5px;
  }

  .model-box {
    margin-right: 5px;
    &:hover .arrow {
      transform: rotate(180deg);
    }
    &:hover .modelList {
      display: block;
    }
  }
  .modelList {
    position: absolute;
    right: -10px;
    top: 20px;
    border-radius: 10px;
    background: #232323;
    box-shadow: 0 0 4px 0 #fff;
    z-index: 4;
    padding: 2px;
    display: none;
    div {
      width: 80px;
      height: 24px;
      line-height: 24px;
      padding: 0 10px;
      font-size: 10px;
      border-radius: 6px;
      &:hover {
        background: #000;
      }
    }
  }
}
.time-switch {
  .switch-core {
    border-color: rgba($color: #fff, $alpha: 0.2);
    background-color: rgba($color: #fff, $alpha: 0.4);
  }
}
.active.time-switch {
  .switch-core {
    border-color: #000 !important;
    background-color: #000 !important;
  }
}

.timer-editor {
  input[type='number']::-webkit-outer-spin-button,
  input[type='number']::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type='number'] {
    -moz-appearance: textfield; /* Firefox */
  }
}
</style>
