<template>
  <div class="writing-board-tool">
    <div
      class="writing-board-wrap"
      :style="{
        width: slideWidth + 'px',
        height: slideHeight + 'px',
      }"
    >
      <WritingBoard
        ref="writingBoardRef"
        :color="writingBoardColor"
        :blackboard="blackboard"
        :model="writingBoardModel"
        :penSize="penSize"
        :markSize="markSize"
        :rubberSize="rubberSize"
        @end="hanldeWritingEnd()"
      />
    </div>

    <MoveablePanel
      class="tools-panel"
      :width="498"
      :height="37"
      :left="left"
      :top="top"
      :moveable="sizePopoverType === ''"
    >
      <div class="tools" @mousedown.stop>
        <div class="tool-content">
          <Popover trigger="manual" :value="sizePopoverType === 'pen'">
            <template #content>
              <div class="size">
                <div class="label">{{ $t('play.penSize') }}</div>
                <Slider
                  class="size-slider"
                  :min="4"
                  :max="10"
                  :step="2"
                  v-model:value="penSize"
                />
              </div>
            </template>
            <div
              class="btn"
              :class="{ active: writingBoardModel === 'pen' }"
              v-tooltip="t('play.pen')"
              @click="changeModel('pen')"
            >
              <i class="iconfont icon-huabigongju"></i>
            </div>
          </Popover>
          <Popover trigger="manual" :value="sizePopoverType === 'mark'">
            <template #content>
              <div class="size">
                <div class="label">{{ $t('play.penSize') }}</div>
                <Slider
                  class="size-slider"
                  :min="16"
                  :max="40"
                  :step="4"
                  v-model:value="markSize"
                />
              </div>
            </template>
            <div
              class="btn"
              :class="{ active: writingBoardModel === 'mark' }"
              v-tooltip="t('play.markPen')"
              @click="changeModel('mark')"
            >
              <i class="iconfont icon-yingguangbi"></i>
            </div>
          </Popover>
          <div class="line"></div>
          <Popover trigger="manual" :value="sizePopoverType === 'eraser'">
            <template #content>
              <div class="size">
                <div class="label">{{ $t('play.rubberSize') }}</div>
                <Slider
                  class="size-slider"
                  :min="20"
                  :max="200"
                  :step="20"
                  v-model:value="rubberSize"
                />
              </div>
            </template>
            <div
              class="btn"
              :class="{ active: writingBoardModel === 'eraser' }"
              v-tooltip="t('play.eraser')"
              @click="changeModel('eraser')"
            >
              <i class="iconfont icon-xiangpica"></i>
            </div>
          </Popover>
          <div class="btn" v-tooltip="t('play.clear')" @click="clearCanvas()">
            <i class="iconfont icon-qingchumoji"></i>
          </div>
          <div class="line"></div>

          <div class="colors">
            <div
              class="color"
              :class="{ active: color === writingBoardColor }"
              v-for="color in writingBoardColors"
              :key="color"
              :style="{ backgroundColor: color }"
              @click="changeColor(color)"
            ></div>
          </div>
          <div class="line"></div>
          <div
            class="btn"
            :class="{ active: blackboard }"
            v-tooltip="t('play.black')"
            @click="blackboard = !blackboard"
          >
            <i class="iconfont icon-heiban"></i>
          </div>
        </div>
        <div
          class="btn"
          v-tooltip="t('play.closeWriting')"
          @click="closeWritingBoard()"
        >
          <IconClose class="icon" style="font-size: 16px" />
        </div>
      </div>
    </MoveablePanel>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore } from '@/store'
import { db } from '@/utils/database'

import WritingBoard from '@/components/WritingBoard.vue'
import MoveablePanel from '@/components/MoveablePanel.vue'
import Slider from '@/components/Slider.vue'
import Popover from '@/components/Popover.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const writingBoardColors = [
  '#FFFFFF',
  '#000000',
  '#4E3EFF',
  '#77CFFF',
  '#EEAB64',
  '#FBE74D',
  '#FF294E',
  '#FF77E4',
  '#C2FC46',
  '#49FC46',
]

type WritingBoardModel = 'pen' | 'mark' | 'eraser'

withDefaults(
  defineProps<{
    slideWidth: number
    slideHeight: number
    left?: number
    top?: number
  }>(),
  {
    left: -5,
    top: -5,
  }
)

const emit = defineEmits<{
  (event: 'close'): void
}>()

const { currentSlide } = storeToRefs(useSlidesStore())

const writingBoardRef = ref<InstanceType<typeof WritingBoard>>()
const writingBoardColor = ref('#e2534d')
const writingBoardModel = ref<WritingBoardModel>('pen')
const blackboard = ref(false)
const sizePopoverType = ref<'' | WritingBoardModel>('')

const penSize = ref(6)
const markSize = ref(24)
const rubberSize = ref(80)

const changeModel = (model: WritingBoardModel) => {
  if (writingBoardModel.value === model) {
    sizePopoverType.value = sizePopoverType.value === model ? '' : model
  } else {
    if (sizePopoverType.value) sizePopoverType.value = ''
    writingBoardModel.value = model
  }
}

// 清除画布上的墨迹
const clearCanvas = () => {
  writingBoardRef.value!.clearCanvas()
}

// 修改画笔颜色，如果当前处于橡皮状态则先切换到画笔状态
const changeColor = (color: string) => {
  if (writingBoardModel.value === 'eraser') writingBoardModel.value = 'pen'
  writingBoardColor.value = color
}

// 关闭写字板
const closeWritingBoard = () => {
  emit('close')
}

// 打开画笔工具或切换页面时，将数据库中存储的墨迹绘制到画布上
watch(
  currentSlide,
  () => {
    db.writingBoardImgs
      .where('id')
      .equals(currentSlide.value.id)
      .toArray()
      .then((ret) => {
        const currentImg = ret[0]
        writingBoardRef.value!.setImageDataURL(currentImg?.dataURL || '')
      })
  },
  { immediate: true }
)

// 每次绘制完成后将绘制完的图片更新到数据库
const hanldeWritingEnd = () => {
  const dataURL = writingBoardRef.value!.getImageDataURL()
  if (!dataURL) return

  db.writingBoardImgs
    .where('id')
    .equals(currentSlide.value.id)
    .toArray()
    .then((ret) => {
      const currentImg = ret[0]
      if (currentImg) db.writingBoardImgs.update(currentImg, { dataURL })
      else db.writingBoardImgs.add({ id: currentSlide.value.id, dataURL })
    })
}
</script>

<style lang="scss" scoped>
.writing-board-tool {
  font-size: 12px;
  z-index: 10;
  @include absolute-0();

  .writing-board-wrap {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .tools {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .tool-content {
    display: flex;
    align-items: center;
  }
  .btn {
    padding: 5px;
    margin: 0 4px;
    cursor: pointer;
    border-radius: 8px;
    &:first-child {
      margin-left: 0;
    }

    &:hover {
      background: rgba(62, 62, 62, 0.8);
    }
    &.active {
      background: #000;
      color: #fff;
    }
  }
  .icon {
    font-size: 20px;
  }
  .colors {
    display: flex;
    padding: 0 10px;
  }
  .color {
    width: 16px;
    height: 16px;
    border-radius: $borderRadius;
    cursor: pointer;

    &:hover {
      transform: scale(1.15);
    }
    &.active {
      transform: scale(1.3);
    }

    & + .color {
      margin-left: 8px;
    }
  }

  .tools-panel {
    border-radius: 10px;
    background: rgba(62, 62, 62, 0.8);
    border: 0;
    color: #fff;
  }
  .line {
    width: 0px;
    height: 13px;
    opacity: 1;
    border: 1px solid rgba(255, 255, 255, 0.66);
    margin: 0 5px;
  }
}
.size {
  width: 200px;
  display: flex;
  align-items: center;
  user-select: none;
  font-size: 14rem;

  .label {
    width: 70px;
  }
  .size-slider {
    flex: 1;
  }
}
</style>
