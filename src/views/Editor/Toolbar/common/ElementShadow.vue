<template>
  <div class="element-shadow">
    <template v-if="hasShadow && shadow">
      <div class="row">
        <div style="width: 40%">{{ $t('toolbar.shadowStyle') }}</div>
        <Select
          style="width: 60%"
          :value="shadow.openShow"
          @update:value="value => updateShadow({ openShow: value as 'none'|'show' })"
          :options="[
            { label: t('toolbar.noShadow'), value: 'none' },
            { label: t('toolbar.showShadow'), value: 'show' },
          ]"
        />
      </div>

      <template v-if="shadow.openShow != 'none'">
        <div class="row">
          <div style="width: 40%">{{ $t('toolbar.hShadow') }}</div>
          <Slider
            style="width: 60%"
            :min="-100"
            :max="100"
            :step="1"
            :value="shadow.h"
            @update:value="value => updateShadow({ h: value as number })"
          />
        </div>
        <div class="row">
          <div style="width: 40%">{{ $t('toolbar.vShadow') }}</div>
          <Slider
            style="width: 60%"
            :min="-100"
            :max="100"
            :step="1"
            :value="shadow.v"
            @update:value="value => updateShadow({ v: value as number })"
          />
        </div>
        <div class="row">
          <div style="width: 40%">{{ $t('toolbar.blurNum') }}</div>
          <Slider
            style="width: 60%"
            :min="1"
            :max="100"
            :step="1"
            :value="shadow.blur"
            @update:value="value => updateShadow({ blur: value as number })"
          />
        </div>
        <div class="row">
          <div style="width: 40%">{{ $t('toolbar.shadowColor') }}</div>
          <Popover trigger="click" style="width: 60%">
            <template #content>
              <ColorPicker
                :modelValue="shadowColor"
                @update:modelValue="(value) => updateShadow({ color: value })"
              />
            </template>
            <ColorButton :color="shadowColor" />
          </Popover>
        </div>
      </template>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import type { PPTElementShadow } from '@/types/slides'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import Select from '@/components/Select.vue'
import ColorButton from '@/components/ColorButton.vue'
import ColorPicker from '@/components/ColorPicker/index.vue'
import Slider from '@/components/Slider.vue'
import Popover from '@/components/Popover.vue'
import useColor from '@/hooks/useColor'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const { initColor } = useColor()
const slidesStore = useSlidesStore()
const { theme } = storeToRefs(slidesStore)
const { handleElement } = storeToRefs(useMainStore())

const shadow = ref<PPTElementShadow>()
const hasShadow = ref(false)

const { addHistorySnapshot } = useHistorySnapshot()

const shadowColor = computed(() => {
  return initColor(shadow.value.color)
})
const updateShadow = (shadowProps: Partial<PPTElementShadow>) => {
  if (!handleElement.value || !shadow.value) return
  const _shadow = { ...shadow.value, ...shadowProps }
  slidesStore.updateElement({
    id: handleElement.value.id,
    props: { shadow: _shadow },
  })
  addHistorySnapshot()
}

const toggleShadow = (checked: boolean) => {
  if (!handleElement.value) return
  if (checked) {
    const _shadow: PPTElementShadow = theme.value.shadow

    slidesStore.updateElement({
      id: handleElement.value.id,
      props: { shadow: _shadow },
    })
  } else {
    slidesStore.removeElementProps({
      id: handleElement.value.id,
      propName: 'shadow',
    })
  }
}

watch(
  handleElement,
  () => {
    if (!handleElement.value) return
    if (handleElement.value.shadow) {
      shadow.value = handleElement.value.shadow
    } else {
      toggleShadow(true)
    }
    hasShadow.value = !!shadow.value
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
