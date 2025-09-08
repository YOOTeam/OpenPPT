<template>
  <div class="element-flip">
    <div class="row" style="margin-bottom: 0">
      <Checkbox
        style="flex: 1"
        @update:value="(value) => updateFlip({ flipH: value })"
        :value="flipH"
        >{{ $t('toolbar.flipH') }}</Checkbox
      >
      <Checkbox
        style="flex: 1"
        @update:value="(value) => updateFlip({ flipV: value })"
        :value="flipV"
        >{{ $t('toolbar.flipV') }}</Checkbox
      >
      <!-- <CheckboxButton
        style="flex: 1"
        :checked="flipH"
        @click="updateFlip({ flipH: !flipH })"
        >{{$t('toolbar.flipH')}}</CheckboxButton
      >
      <CheckboxButton
        style="flex: 1"
        :checked="flipV"
        @click="updateFlip({ flipV: !flipV })"
        >{{$t('toolbar.flipV')}}</CheckboxButton
      > -->
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import type { ImageOrShapeFlip } from '@/types/slides'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import Checkbox from '@/components/Checkbox.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const slidesStore = useSlidesStore()
const { handleElement } = storeToRefs(useMainStore())

const flipH = ref(false)
const flipV = ref(false)

watch(
  handleElement,
  () => {
    if (
      handleElement.value &&
      (handleElement.value.type === 'image' ||
        handleElement.value.type === 'shape')
    ) {
      flipH.value = !!handleElement.value.flipH
      flipV.value = !!handleElement.value.flipV
    }
  },
  { deep: true, immediate: true }
)

const { addHistorySnapshot } = useHistorySnapshot()

const updateFlip = (flipProps: ImageOrShapeFlip) => {
  if (!handleElement.value) return
  slidesStore.updateElement({ id: handleElement.value.id, props: flipProps })
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
</style>
