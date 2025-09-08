<template>
  <svg
    class="image-polygon-outline"
    v-if="outline"
    overflow="visible"
    :width="width"
    :height="height"
  >
    <defs v-if="outline?.gradient">
      <GradientDefs
        v-if="outline?.gradient"
        :id="`element-image-outline-${id}`"
        :type="outline?.gradient?.type"
        :colors="outline?.gradient?.colors"
        :rotate="outline?.gradient?.rotate"
        :radialGradient="outline?.gradient?.fillToRect"
      />
    </defs>
    <path
      vector-effect="non-scaling-stroke"
      stroke-linecap="butt"
      stroke-miterlimit="8"
      fill="transparent"
      :d="createPath(width, height)"
      :stroke="
        outline?.gradient ? `url(#element-image-outline-${id})` : outlineColor
      "
      :stroke-width="outlineWidth"
      :stroke-dasharray="strokeDashArray"
    ></path>
  </svg>
</template>

<script lang="ts" setup>
import { toRef } from 'vue'
import type { PPTElementOutline } from '@/types/slides'
import useElementOutline from '@/views/components/element/hooks/useElementOutline'
import GradientDefs from '@/views/components/element/OutlineGradientDefs.vue'

const props = defineProps<{
  width: number
  height: number
  createPath: (width: number, height: number) => string
  outline?: PPTElementOutline
  id?: any
}>()

const { outlineWidth, outlineColor, strokeDashArray } = useElementOutline(
  toRef(props, 'outline')
)
</script>

<style lang="scss" scoped>
svg {
  overflow: visible;
  position: absolute;
  z-index: 2;
  top: 0;
  left: 0;
}
</style>
