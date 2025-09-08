<template>
  <div
    :class="['divider', type]"
    :style="{
      margin:
        type === 'horizontal' ? `${margin || 20}rem 0` : `0 ${margin || 8}rem`,
    }"
  ></div>
</template>

<script lang="ts" setup>
withDefaults(
  defineProps<{
    type?: 'horizontal' | 'vertical'
    margin?: number
  }>(),
  {
    type: 'horizontal',
    margin: 0,
  }
)
</script>

<style lang="scss" scoped>
.divider {
  &.horizontal {
    width: 100%;
    margin: 24rem 0;
    border-block-start: 1rem solid rgba(5, 5, 5, 0.06);
  }
  &.vertical {
    position: relative;
    height: 1em;
    display: inline-block;
    margin: 0 8rem;
    border-inline-start: 1rem solid rgba(5, 5, 5, 0.06);
  }
}
</style>
