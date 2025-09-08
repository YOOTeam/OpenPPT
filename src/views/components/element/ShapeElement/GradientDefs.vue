<template>
  <linearGradient
    barg="c55b9733ac75f874"
    v-if="type === 'linear'"
    :id="id"
    x1="0%"
    y1="0%"
    x2="100%"
    y2="0%"
    :gradientTransform="`rotate(${rotate},0.5,0.5)`"
  >
    <stop
      v-for="(item, index) in colors"
      :key="index"
      :offset="`${item.pos}%`"
      :stop-color="initColor(item.color)"
    />
  </linearGradient>
  <radialGradient
    :id="id"
    v-else
    :cx="radialPosition.cx"
    :cy="radialPosition.cy"
    :r="radialPosition.r"
    :fx="radialPosition.fx"
    :fy="radialPosition.fy"
  >
    <stop
      v-for="(item, index) in colors"
      :key="index"
      :offset="`${item.pos}%`"
      :stop-color="initColor(item.color)"
    />
  </radialGradient>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { GradientColor, GradientType } from '@/types/slides'
import useColor from '@/hooks/useColor'

const { initColor } = useColor()
const props = withDefaults(
  defineProps<{
    id: string
    type: GradientType
    colors: GradientColor[]
    rotate?: number
    radialGradient?: any
  }>(),
  {
    rotate: 0,
  }
)

const radialPosition = computed(() => {
  let position = {
    cx: '50%',
    cy: '50%',
    r: '50%',
    fx: '50%',
    fy: '50%',
  }
  if (!props.radialGradient) {
    return position
  }

  if (
    props.radialGradient.bottom === 1 &&
    props.radialGradient.left === 0 &&
    props.radialGradient.right === 1 &&
    props.radialGradient.top === 0
  ) {
    position = {
      cx: '20%',
      cy: '20%',
      r: '110%',
      fx: '10%',
      fy: '20%',
    }
  } else if (
    props.radialGradient.bottom === 0 &&
    props.radialGradient.left === 1 &&
    props.radialGradient.right === 0 &&
    props.radialGradient.top === 1
  ) {
    position = {
      cx: '80%',
      cy: '90%',
      r: '100%',
      fx: '80%',
      fy: '80%',
    }
  }

  return position
})
</script>
