<template>
  <div class="element-positopn-panel">
    <div class="row">
      <div style="width: 40%">{{ $t('positionPool.hPosition') }}</div>
      <div style="width: 60%">
        <NumberInput
          :step="5"
          :value="left"
          @update:value="(value) => updateLeft(value)"
          style="width: 100%"
        >
        </NumberInput>
      </div>
    </div>
    <div class="row">
      <div style="width: 40%">{{ $t('positionPool.vPosition') }}</div>
      <div style="width: 60%">
        <NumberInput
          :step="5"
          :value="top"
          @update:value="(value) => updateTop(value)"
          style="width: 100%"
        >
        </NumberInput>
      </div>
    </div>
    <template v-if="!['line', 'video', 'audio'].includes(handleElement!.type)">
      <Divider />

      <div class="row">
        <div style="width: 40%">{{ $t('positionPool.rotate') }}</div>
        <Slider
          :min="-180"
          :max="180"
          :step="5"
          :value="rotate"
          style="width: 60%"
          @update:value="value => updateRotate(value as number)"
        />

        <!-- <NumberInput
          :min="-180"
          :max="180"
          :step="5"
          :value="rotate"
          @update:value="(value) => updateRotate(value)"
          style="width: 45%"
        >
          <template #prefix> 旋转： </template>
        </NumberInput>
        <div style="width: 7%"></div>
        <div class="text-btn" @click="updateRotate45('-')" style="width: 24%">
          <IconRotate /> -45°
        </div>
        <div class="text-btn" @click="updateRotate45('+')" style="width: 24%">
          <IconRotate :style="{ transform: 'rotateY(180deg)' }" /> +45°
        </div> -->
      </div>
    </template>

    <template v-if="handleElement!.type !== 'line'">
      <div class="row">
        <div style="width: 40%">{{ $t('positionPool.width') }}</div>
        <div style="width: 60%" class="row">
          <NumberInput
            :min="minSize"
            :max="1500"
            :step="5"
            :disabled="isVerticalText"
            :value="width"
            @update:value="(value) => updateWidth(value)"
            style="flex: 1"
          >
            <template #prefix> {{ $t('positionPool.width') }}： </template>
          </NumberInput>
        </div>
      </div>
      <div class="row" style="align-items: flex-start">
        <div style="width: 40%; padding-top: 10rem">
          {{ $t('positionPool.height') }}
        </div>
        <div style="width: 60%">
          <NumberInput
            :min="minSize"
            :max="800"
            :step="5"
            :disabled="isHorizontalText || handleElement!.type === 'table'"
            :value="height"
            @update:value="(value) => updateHeight(value)"
            style="width: 100%"
          >
            <template #prefix> {{ $t('positionPool.height') }}： </template>
          </NumberInput>
          <div
            style="
              margin-top: 10rem;
              color: #aaaaaa;
              cursor: pointer;
              user-select: none;
            "
            @click="updateFixedRatio(!fixedRatio)"
            v-if="['image', 'shape', 'audio'].includes(handleElement!.type)"
          >
            <Checkbox
              @update:value="(value) => updateFixedRatio(value)"
              :value="fixedRatio"
              >{{ $t('positionPool.lockWH') }}</Checkbox
            >

            <!-- <IconLock
              style="width: 10%"
              class="icon-btn active"
              v-tooltip="'解除宽高比锁定'"
              v-if="fixedRatio"
            />
            <IconUnlock
              style="width: 10%"
              class="icon-btn"
              v-tooltip="'宽高比锁定'"
              v-else
            /> -->
          </div>
        </div>
      </div>
    </template>
    <Divider />
    <div class="title">{{ $t('positionPool.elementSort') }}</div>
    <ButtonGroup class="row">
      <Button
        style="flex: 1; padding: 0"
        @click="orderElement(handleElement!, ElementOrderCommands.DOWN)"
      >
        <i class="iconfont icon-xiayi toobar-icon-sizes"></i
        >{{ $t('positionPool.nextLevel') }}
      </Button>
      <Button
        style="flex: 1; padding: 0"
        @click="orderElement(handleElement!, ElementOrderCommands.UP)"
      >
        <i class="iconfont icon-shangyi toobar-icon-sizes"></i
        >{{ $t('positionPool.upLevel') }}
      </Button>
    </ButtonGroup>
    <ButtonGroup class="row">
      <Button
        style="flex: 1; padding: 0"
        @click="orderElement(handleElement!, ElementOrderCommands.BOTTOM)"
      >
        <i class="iconfont icon-zhidi toobar-icon-sizes"></i>
        {{ $t('positionPool.setBottom') }}
      </Button>
      <Button
        style="flex: 1; padding: 0"
        @click="orderElement(handleElement!, ElementOrderCommands.TOP)"
      >
        <!-- <IconSendToBack class="btn-icon" /> -->
        <i class="iconfont icon-zhiding1 toobar-icon-sizes"></i>
        {{ $t('positionPool.setTop') }}
      </Button>
    </ButtonGroup>

    <Divider />

    <div class="title">{{ $t('positionPool.elementAlign') }}</div>
    <ButtonGroup class="row align-btn">
      <Button
        style="flex: 1; padding: 0"
        @click="alignElementToCanvas(ElementAlignCommands.LEFT)"
      >
        <i class="iconfont icon-zuoduiqi1 toobar-icon-sizes14"></i
        >{{ $t('positionPool.right') }}
      </Button>

      <Button
        style="flex: 1; padding: 0"
        @click="alignElementToCanvas(ElementAlignCommands.RIGHT)"
      >
        <i class="iconfont icon-youduiqi1 toobar-icon-sizes14"></i
        >{{ $t('positionPool.left') }}
      </Button>
    </ButtonGroup>
    <ButtonGroup class="row align-btn">
      <Button
        style="flex: 1; padding: 0"
        @click="alignElementToCanvas(ElementAlignCommands.TOP)"
      >
        <i class="iconfont icon-shangduiqi toobar-icon-sizes14"></i
        >{{ $t('positionPool.top') }}
      </Button>

      <Button
        style="flex: 1; padding: 0"
        @click="alignElementToCanvas(ElementAlignCommands.BOTTOM)"
      >
        <i class="iconfont icon-xiaduiqi toobar-icon-sizes14"></i
        >{{ $t('positionPool.bottom') }}
      </Button>
    </ButtonGroup>
    <ButtonGroup class="row align-btn">
      <Button
        style="flex: 1; padding: 0"
        @click="alignElementToCanvas(ElementAlignCommands.HORIZONTAL)"
      >
        <i class="iconfont icon-shuipingjuzhong toobar-icon-sizes14"></i
        >{{ $t('positionPool.center') }}
      </Button>
      <Button
        style="flex: 1; padding: 0"
        @click="alignElementToCanvas(ElementAlignCommands.VERTICAL)"
      >
        <i class="iconfont icon-chuizhijuzhong toobar-icon-sizes14"></i
        >{{ $t('positionPool.vertical') }}
      </Button>
    </ButtonGroup>
    <!-- <Divider /> -->

    <!-- <template v-if="!['line', 'video', 'audio'].includes(handleElement!.type)">
      <Divider />

      <div class="row">
        <NumberInput
          :min="-180"
          :max="180"
          :step="5"
          :value="rotate"
          @update:value="(value) => updateRotate(value)"
          style="width: 45%"
        >
          <template #prefix> 旋转： </template>
        </NumberInput>
        <div style="width: 7%"></div>
        <div class="text-btn" @click="updateRotate45('-')" style="width: 24%">
          <IconRotate /> -45°
        </div>
        <div class="text-btn" @click="updateRotate45('+')" style="width: 24%">
          <IconRotate :style="{ transform: 'rotateY(180deg)' }" /> +45°
        </div>
      </div>
    </template> -->
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { round } from 'lodash'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import type { PPTElement } from '@/types/slides'
import { ElementAlignCommands, ElementOrderCommands } from '@/types/edit'
import { MIN_SIZE } from '@/configs/element'
import { SHAPE_PATH_FORMULAS } from '@/configs/shapes'
import useOrderElement from '@/hooks/useOrderElement'
import useAlignElementToCanvas from '@/hooks/useAlignElementToCanvas'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import Divider from '@/components/Divider.vue'
import Button from '@/components/Button.vue'
import ButtonGroup from '@/components/ButtonGroup.vue'
import NumberInput from '@/components/NumberInput.vue'
import Slider from '@/components/Slider.vue'
import Checkbox from '@/components/Checkbox.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const slidesStore = useSlidesStore()
const { handleElement, handleElementId } = storeToRefs(useMainStore())

const left = ref(0)
const top = ref(0)
const width = ref(0)
const height = ref(0)
const rotate = ref(0)
const fixedRatio = ref(false)

const minSize = computed(() => {
  if (!handleElement.value) return 5
  return MIN_SIZE[handleElement.value.type] || 5
})

const isHorizontalText = computed(() => {
  return handleElement.value?.type === 'text' && !handleElement.value.vertical
})
const isVerticalText = computed(() => {
  return handleElement.value?.type === 'text' && handleElement.value.vertical
})

watch(
  handleElement,
  () => {
    if (!handleElement.value) return

    left.value = round(handleElement.value.left, 1)
    top.value = round(handleElement.value.top, 1)

    fixedRatio.value =
      'fixedRatio' in handleElement.value && !!handleElement.value.fixedRatio

    if (handleElement.value.type !== 'line') {
      width.value = round(handleElement.value.width, 1)
      height.value = round(handleElement.value.height, 1)
      rotate.value =
        'rotate' in handleElement.value &&
        handleElement.value.rotate !== undefined
          ? round(handleElement.value.rotate, 1)
          : 0
    }
  },
  { deep: true, immediate: true }
)

const { orderElement } = useOrderElement()
const { alignElementToCanvas } = useAlignElementToCanvas()

const { addHistorySnapshot } = useHistorySnapshot()

// 设置元素位置
const updateLeft = (value: number) => {
  const props = { left: value }
  slidesStore.updateElement({ id: handleElementId.value, props })
  addHistorySnapshot()
}
const updateTop = (value: number) => {
  const props = { top: value }
  slidesStore.updateElement({ id: handleElementId.value, props })
  addHistorySnapshot()
}

// 设置元素{{$t('positionPool.width')}}、{{$t('positionPool.height')}}、{{$t('positionPool.rotate')}}
// 对形状设置宽高时，需要检查是否需要更新形状路径
const updateShapePathData = (width: number, height: number) => {
  if (
    handleElement.value &&
    handleElement.value.type === 'shape' &&
    'pathFormula' in handleElement.value &&
    handleElement.value.pathFormula
  ) {
    const pathFormula = SHAPE_PATH_FORMULAS[handleElement.value.pathFormula]

    let path = ''
    if ('editable' in pathFormula && pathFormula.editable) {
      path = pathFormula.formula(width, height, handleElement.value.keypoints!)
    } else path = pathFormula.formula(width, height)

    return {
      viewBox: [width, height],
      path,
    }
  }
  return null
}

const updateWidth = (value: number) => {
  if (!handleElement.value) return
  if (handleElement.value.type === 'line' || isVerticalText.value) return

  let h = height.value

  if (fixedRatio.value) {
    const ratio = width.value / height.value
    h = value / ratio < minSize.value ? minSize.value : value / ratio
  }
  let props: Partial<PPTElement> = { width: value, height: h }

  const shapePathData = updateShapePathData(value, h)
  if (shapePathData) {
    props = {
      width: value,
      height: h,
      ...shapePathData,
    }
  }

  slidesStore.updateElement({ id: handleElementId.value, props })
  addHistorySnapshot()
}

const updateHeight = (value: number) => {
  if (!handleElement.value) return
  if (
    handleElement.value.type === 'line' ||
    handleElement.value.type === 'table' ||
    isHorizontalText.value
  ) {
    return
  }

  let w = width.value

  if (fixedRatio.value) {
    const ratio = width.value / height.value
    w = value * ratio < minSize.value ? minSize.value : value * ratio
  }
  let props: Partial<PPTElement> = { width: w, height: value }

  const shapePathData = updateShapePathData(w, value)
  if (shapePathData) {
    props = {
      width: w,
      height: value,
      ...shapePathData,
    }
  }

  slidesStore.updateElement({ id: handleElementId.value, props })
  addHistorySnapshot()
}

const updateRotate = (value: number) => {
  const props = { rotate: value }
  slidesStore.updateElement({ id: handleElementId.value, props })
  addHistorySnapshot()
}

// 固定元素的宽高比
const updateFixedRatio = (value: boolean) => {
  const props = { fixedRatio: value }
  slidesStore.updateElement({ id: handleElementId.value, props })
  addHistorySnapshot()
}

// 将元素旋转45度（顺时针或逆时针）
const updateRotate45 = (command: '+' | '-') => {
  let _rotate = Math.floor(rotate.value / 45) * 45
  if (command === '+') _rotate = _rotate + 45
  else if (command === '-') _rotate = _rotate - 45

  if (_rotate < -180) _rotate = -180
  if (_rotate > 180) _rotate = 180

  const props = { rotate: _rotate }
  slidesStore.updateElement({ id: handleElementId.value, props })
  addHistorySnapshot()
}
</script>

<style lang="scss" scoped>
.row {
  width: 100%;
  display: flex;
  align-items: center;
  margin-bottom: 10rem;
}
.title {
  margin-bottom: 10rem;
}
.label {
  text-align: center;
}
.btn-icon {
  margin-right: 3rem;
}
.icon-btn {
  cursor: pointer;

  &.active {
    color: $themeColor;
  }
}
.text-btn {
  height: 30rem;
  line-height: 30rem;
  text-align: center;
  cursor: pointer;

  &:hover {
    background-color: #efefef;
    border-radius: $borderRadius;
  }
}

.align-btn {
  .button {
    padding: 0 4rem;
  }
}
</style>
