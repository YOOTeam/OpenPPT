<template>
  <svg
    class="element-outline"
    v-if="outline && outline.style != 'none'"
    overflow="visible"
    :width="width"
    :height="height"
  >
    <defs v-if="softEdge || outline?.gradient">
      <filter :id="`element-blurFilter-${id}`" v-if="softEdge">
        <feGaussianBlur in="SourceGraphic" :stdDeviation="softEdge" />
      </filter>

      <GradientDefs
        v-if="outline?.gradient"
        :id="`element-outline-${id}`"
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
      :filter="softEdge ? `url(#element-blurFilter-${id})` : ''"
      :d="`M0,0 L${width},0 L${width},${height} L0,${height} Z`"
      :stroke="outline?.gradient ? `url(#element-outline-${id})` : outlineColor"
      :stroke-width="outlineWidth"
      :stroke-dasharray="strokeDashArray"
    ></path>
  </svg>
</template>

<script lang="ts" setup>
import { toRef } from 'vue'
import type { PPTElementOutline } from '@/types/slides'

import useElementOutline from '@/views/components/element/hooks/useElementOutline'

import GradientDefs from './OutlineGradientDefs.vue'
const props = defineProps<{
  width: number
  height: number
  outline?: PPTElementOutline
  id?: any
  softEdge?: any
}>()

const { outlineWidth, outlineColor, strokeDashArray } = useElementOutline(
  toRef(props, 'outline')
)
</script>

<style lang="scss" scoped>
svg {
  overflow: visible;
  position: absolute;
  top: 0;
  left: 0;
}
</style>
