<template>
  <div class="element-color-mask">
    <!-- <div class="row">
      <div style="width: 40%">着色（蒙版）</div>
      <div class="switch-wrapper" style="width: 60%">
        <Switch
          :value="hasColorMask"
          @update:value="(value) => toggleColorMask(value)"
        />
      </div>
    </div> -->
    <template v-if="hasColorMask">
      <div class="row" style="margin-top: 15rem">
        <div style="width: 40%">{{ $t('toolbar.imgColor') }}</div>
        <Popover trigger="click" style="width: 60%">
          <template #content>
            <ColorPicker
              :modelValue="colorMask"
              @update:modelValue="(value) => updateColorMask(value)"
            />
          </template>
          <ColorButton :color="colorMask" />
        </Popover>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import useColor from '@/hooks/useColor'

import ColorButton from '@/components/ColorButton.vue'
import ColorPicker from '@/components/ColorPicker/index.vue'
import Switch from '@/components/Switch.vue'
import Popover from '@/components/Popover.vue'
import tinycolor from 'tinycolor2'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const defaultColorMask = 'rgba(226, 83, 77, 0.5)'
const { initColor } = useColor()
const slidesStore = useSlidesStore()
const { handleElement, handleElementId } = storeToRefs(useMainStore())

const colorMask = ref(defaultColorMask)
const hasColorMask = ref(false)

const { addHistorySnapshot } = useHistorySnapshot()

watch(
  handleElement,
  () => {
    if (!handleElement.value || handleElement.value.type !== 'image') return
    hasColorMask.value = true
    if (handleElement.value.colorMask) {
      colorMask.value = initColor(handleElement.value.colorMask)
    } else {
      colorMask.value = ''
    }
  },
  { deep: true, immediate: true }
)

const toggleColorMask = (checked: boolean) => {
  if (!handleElement.value) return
  if (checked) {
    slidesStore.updateElement({
      id: handleElement.value.id,
      props: { colorMask: defaultColorMask },
    })
  } else {
    slidesStore.removeElementProps({
      id: handleElement.value.id,
      propName: 'colorMask',
    })
  }
  addHistorySnapshot()
}

const updateColorMask = (colorMask: any) => {
  if (typeof colorMask === 'object') {
    if (parseFloat(colorMask.transparent) === 1) {
      colorMask.transparent = 0.5
    }
  } else {
    const oldColor = tinycolor(colorMask).toRgb()
    if (oldColor.a === 1) {
      oldColor.a = 0.5
    }
    colorMask = tinycolor(oldColor).toRgbString()
  }
  slidesStore.updateElement({ id: handleElementId.value, props: { colorMask } })
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
.switch-wrapper {
  text-align: right;
}
</style>
