<template>
  <span
    class="switch"
    :class="{
      active: value,
      disabled: disabled,
    }"
    @click="handleChange()"
  >
    <span class="switch-core"></span>
  </span>
</template>

<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    value: boolean
    disabled?: boolean
  }>(),
  {
    disabled: false,
  }
)

const emit = defineEmits<{
  (event: 'update:value', payload: boolean): void
}>()

const handleChange = () => {
  if (props.disabled) return
  emit('update:value', !props.value)
}
</script>

<style lang="scss" scoped>
.switch {
  height: 20rem;
  display: inline-block;
  cursor: pointer;

  &:not(.disabled).active {
    .switch-core {
      border-color: $themeColor;
      background-color: $themeColor;

      &::after {
        left: 100%;
        margin-left: -17rem;
      }
    }
  }

  &.disabled {
    cursor: default;

    .switch-core::after {
      background-color: #f5f5f5;
    }
  }
}
.switch-core {
  margin: 0;
  display: inline-block;
  position: relative;
  width: 40rem;
  height: 21rem;
  border: 1rem solid #aaaaaa;
  outline: none;
  border-radius: 10rem;
  box-sizing: border-box;
  background: #aaaaaa;
  transition: border-color 0.3s, background-color 0.3s;
  vertical-align: middle;

  &::after {
    content: '';
    position: absolute;
    top: 1rem;
    left: 1rem;
    border-radius: 100%;
    transition: all 0.3s;
    width: 16rem;
    height: 16rem;
    background-color: #fff;
  }
}
</style>
