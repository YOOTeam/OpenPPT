<template>
  <div class="element-outline">
    <!-- <div class="row" v-if="!fixed"> -->
    <!-- <div style="width: 40%">启用边框</div>
      <div class="switch-wrapper" style="width: 60%">
        <Switch
          :value="hasOutline"
          @update:value="(value) => toggleOutline(value)"
        />
      </div>
    </div> -->
    <template v-if="hasOutline && outline">
      <div class="row">
        <div style="width: 40%">{{ $t('toolbar.borderStyle') }}</div>
        <Select
          style="width: 60%"
          :value="outline.style || ''"
          @update:value="value => updateOutline({ style: value as 'dashed' | 'solid' |'none'})"
          :options="[
            { label: t('toolbar.noneBoder'), value: 'none' },
            { label: t('toolbar.solidBorder'), value: 'solid' },
            { label: t('toolbar.dashedBorder'), value: 'dashed' },
          ]"
        />
      </div>

      <template v-if="outline.style != 'none'">
        <div class="row" v-if="!noGradient">
          <div style="width: 40%">{{ $t('toolbar.borderFill') }}</div>
          <div style="width: 60%">
            <Select
              :value="fillType"
              @update:value="(value) => updateFillType(value)"
              :options="[
                { label: t('toolbar.fillColor'), value: 'fill' },
                { label: t('toolbar.fillGradient'), value: 'gradient' },
              ]"
            />
          </div>
        </div>

        <div class="row" v-if="fillType === 'fill'">
          <div style="width: 40%">{{ $t('toolbar.borderColor') }}</div>
          <Popover trigger="click" style="width: 60%">
            <template #content>
              <ColorPicker
                :modelValue="outlineColor"
                @update:modelValue="(value) => updateOutline({ color: value })"
              />
            </template>
            <ColorButton :color="outlineColor || '#000'" />
          </Popover>
        </div>
        <template v-if="fillType === 'gradient'">
          <!-- <div class="row">
            <div style="width: 40%">边框渐变方式</div>
            <Select
              style="flex: 1"
              :value="gradient.type"
              @update:value="value => updateGradient({ type: value as GradientType })"
              :options="[
                { label: '线性渐变', value: 'linear' },
                { label: '径向渐变', value: 'radial' },
              ]"
            />
          </div> -->
          <div class="row">
            <div style="width: 40%">
              {{ $t('toolbar.borderGradientColor') }}
            </div>
            <GradientBar
              style="flex: 1"
              :value="gradient.colors"
              @update:value="(value) => updateGradient({ colors: value })"
              @update:index="(index) => (currentGradientIndex = index)"
            />
          </div>
          <div class="row">
            <div style="width: 40%">{{ $t('toolbar.colorCurrent') }}</div>
            <Popover trigger="click" style="width: 60%">
              <template #content>
                <ColorPicker
                  :modelValue="
                    initColor(gradient.colors[currentGradientIndex].color)
                  "
                  @update:modelValue="(value) => updateGradientColors(value)"
                />
              </template>
              <ColorButton
                :color="initColor(gradient.colors[currentGradientIndex].color)"
              />
            </Popover>
          </div>
          <div class="row" v-if="gradient.type === 'linear'">
            <div style="width: 40%">{{ $t('toolbar.borderRotate') }}</div>
            <Slider
              style="width: 60%; margin: 5rem 0"
              :min="0"
              :max="360"
              :step="15"
              :value="gradient.rotate"
              @update:value="value => updateGradient({ rotate: value as number })"
            />
          </div>
        </template>
        <div class="row">
          <div style="width: 40%">{{ $t('toolbar.borderWidth') }}</div>
          <NumberInput
            :value="outline.width || 0"
            @update:value="(value) => updateOutline({ width: value })"
            style="width: 60%"
          />
        </div>
      </template>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import type { PPTElementOutline } from '@/types/slides'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'

import ColorButton from '@/components/ColorButton.vue'
import ColorPicker from '@/components/ColorPicker/index.vue'
import Switch from '@/components/Switch.vue'
import NumberInput from '@/components/NumberInput.vue'
import Select from '@/components/Select.vue'
import Popover from '@/components/Popover.vue'
import useColor from '@/hooks/useColor'
import GradientBar from '@/components/GradientBar.vue'
import Slider from '@/components/Slider.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
withDefaults(
  defineProps<{
    fixed?: boolean
    noGradient?: boolean
  }>(),
  {
    fixed: false,
    noGradient: false,
  }
)
const { initColor } = useColor()
const slidesStore = useSlidesStore()
const { theme } = storeToRefs(slidesStore)
const { handleElement, handleElementId } = storeToRefs(useMainStore())

const outlineColor = computed(() => {
  return initColor(outline.value.color)
})

const gradient = ref<Gradient>({
  type: 'linear',
  rotate: 0,
  colors: [
    { pos: 0, color: '#fff' },
    { pos: 100, color: '#fff' },
  ],
})
const currentGradientIndex = ref(0)
const fillType = ref('fill')
const outline = ref<PPTElementOutline>()
const hasOutline = ref(false)

const { addHistorySnapshot } = useHistorySnapshot()

const updateOutline = (outlineProps: Partial<PPTElementOutline>) => {
  if (!handleElement.value) return
  const props: any = { outline: { ...outline.value, ...outlineProps } }
  updateElement(props)
}

const toggleOutline = (checked: boolean) => {
  if (!handleElement.value) return
  if (checked) {
    const _outline: PPTElementOutline = theme.value.outline
    slidesStore.updateElement({
      id: handleElement.value.id,
      props: { outline: _outline },
    })
  } else {
    slidesStore.removeElementProps({
      id: handleElement.value.id,
      propName: 'outline',
    })
  }
}

// 设置渐变填充
const updateGradient = (gradientProps: Partial<Gradient>) => {
  if (!gradient.value) return
  const _gradient = { ...gradient.value, ...gradientProps }
  updateOutline({ gradient: _gradient })
}
const updateGradientColors = (color: string) => {
  const colors = gradient.value.colors.map((item, index) => {
    if (index === currentGradientIndex.value) return { ...item, color }
    return item
  })
  updateGradient({ colors })
}

// 设置填充类型渐变、纯色
const updateFillType = (type: string) => {
  fillType.value = type
  if (type === 'fill') {
    delete outline.value.gradient
    const props = { outline: outline.value }
    updateElement(props)
  } else if (type === 'gradient') {
    currentGradientIndex.value = 0
    updateOutline({ gradient: gradient.value })
  }
}

const updateElement = (props: any) => {
  if (handleElement.value?.attrArry?.length) {
    const attrArry = JSON.parse(JSON.stringify(handleElement.value.attrArry))
    attrArry.forEach((element: any) => {
      delete element['stroke-dasharray']
      delete element['stroke-width']
      delete element.stroke
    })
    props.attrArry = attrArry
  }
  slidesStore.updateElement({ id: handleElement.value.id, props })
  addHistorySnapshot()
}
watch(
  handleElement,
  () => {
    if (!handleElement.value) return
    if (handleElement.value.outline) {
      outline.value = handleElement.value.outline
      if (outline.value.gradient) {
        fillType.value = 'gradient'
        const defaultGradientColor = [
          { pos: 0, color: outline.value.color },
          { pos: 100, color: '#fff' },
        ]
        gradient.value = outline.value.gradient || {
          type: 'linear',
          rotate: 0,
          colors: defaultGradientColor,
        }
      }
    } else {
      toggleOutline(true)
    }

    hasOutline.value = !!outline.value
  },
  { deep: true, immediate: true }
)
</script>

<style lang="scss" scoped>
.row {
  width: 100%;
  height: 30rem;
  display: flex;
  align-items: center;
  margin-bottom: 10rem;
}
.switch-wrapper {
  text-align: right;
}
</style>
