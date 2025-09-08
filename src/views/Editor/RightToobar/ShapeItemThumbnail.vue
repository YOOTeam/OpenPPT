<template>
  <div class="shape-item-thumbnail">
    <div class="shape-content">
      <svg overflow="visible" width="14" height="14">
        <g
          :transform="`scale(${14 / shape.viewBox[0]}, ${
            14 / shape.viewBox[1]
          }) translate(0,0) matrix(1,0,0,1,0,0)`"
        >
          <path
            barg="3f39f1b4288f8938"
            class="shape-path"
            :class="{ outlined: shape.outlined }"
            vector-effect="non-scaling-stroke"
            stroke-linecap="butt"
            stroke-miterlimit="8"
            :fill="shape.outlined ? '#999' : 'transparent'"
            :stroke="shape.outlined ? 'transparent' : '#999'"
            stroke-width="1"
            :d="shape.path"
          ></path>
        </g>
      </svg>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ShapePoolItem } from '@/configs/shapes'

defineProps<{
  shape: ShapePoolItem
}>()
</script>

<style lang="scss" scoped>
.shape-item-thumbnail {
  position: relative;
  cursor: pointer;
}

.shape-content {
  @include absolute-0();

  display: flex;
  justify-content: center;
  align-items: center;

  &:hover .shape-path {
    &:not(.outlined) {
      stroke: $themeColor;
    }

    &.outlined {
      fill: $themeColor;
    }
  }

  svg:not(:root) {
    overflow: visible;
  }
}
</style>
