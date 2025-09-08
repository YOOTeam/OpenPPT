<template>
  <div class="select-wrap" v-if="disabled">
    <div class="select disabled" ref="selectRef">
      <div class="selector">{{ value }}</div>
      <div class="icon">
        <slot name="icon">
          <IconDown :size="14" />
        </slot>
      </div>
    </div>
  </div>
  <Popover
    class="select-wrap"
    trigger="click"
    v-model:value="popoverVisible"
    placement="bottom"
    :contentStyle="{
      padding: 0,
      boxShadow: '0 6rem 16rem 0 rgba(0, 0, 0, 0.08)',
    }"
    v-else
  >
    <template #content>
      <div class="options" :style="{ width: width + 2 + 'px' }">
        <div
          class="option"
          :class="{
            disabled: option.disabled,
            selected: option.value === value,
          }"
          v-for="option in options"
          :key="option.value"
          @click="handleSelect(option)"
        >
          {{ option.label }}
        </div>
      </div>
    </template>
    <div class="select" ref="selectRef">
      <div class="selector">
        <template v-if="showIntput">
          <input
            type="number"
            class="selectorInput"
            :value="inputValue"
            @blur="($event) => handleBlur($event)"
          />
        </template>

        <span v-else>{{ showLabel }}</span>
      </div>
      <div class="icon">
        <template v-if="showIntput"> px </template>
        <slot name="icon" v-else>
          <IconDown :size="14" />
        </slot>
      </div>
    </div>
  </Popover>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import Popover from './Popover.vue'

interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
  showIntput?: boolean
}

const props = withDefaults(
  defineProps<{
    value: string | number
    options: SelectOption[]
    disabled?: boolean
    showIntput?: boolean
  }>(),
  {
    disabled: false,
    showIntput: false,
  }
)

const inputValue = computed(() => {
  const label =
    props.options.find((item) => item.value === props.value)?.label ||
    props.value
  return label.replace('px', '')
})

const showLabel = computed(() => {
  return (
    props.options.find((item) => item.value === props.value)?.label ||
    props.value
  )
})

const emit = defineEmits<{
  (event: 'update:value', payload: string | number): void
}>()

const popoverVisible = ref(false)
const selectRef = ref<HTMLElement>()
const width = ref(0)

const updateWidth = () => {
  if (!selectRef.value) return
  width.value = selectRef.value.clientWidth
}
const resizeObserver = new ResizeObserver(updateWidth)
onMounted(() => {
  if (!selectRef.value) return
  resizeObserver.observe(selectRef.value)
})
onUnmounted(() => {
  if (!selectRef.value) return
  resizeObserver.unobserve(selectRef.value)
})

const handleBlur = (event: FocusEvent) => {
  const target = event.target as HTMLElement
  if (
    event &&
    target.value + 'px' !== props.value &&
    target.value > 5 &&
    target.value < 150
  ) {
    emit('update:value', target.value + 'px')
  }
}
const handleSelect = (option: SelectOption) => {
  if (option.disabled) return

  emit('update:value', option.value)
  popoverVisible.value = false
}
</script>

<style lang="scss" scoped>
.select {
  width: 100%;
  height: 32rem;
  padding-right: 32rem;
  border-radius: $borderRadius;
  transition: border-color 0.25s;
  font-size: 14rem;
  user-select: none;
  background-color: #fff;
  border: 1rem solid #d9d9d9;
  position: relative;
  cursor: pointer;

  &:not(.disabled):hover {
    border-color: $themeColor;
  }

  &.disabled {
    background-color: #f5f5f5;
    border-color: #dcdcdc;
    color: #b7b7b7;
    cursor: default;
  }

  .selector {
    min-width: 50rem;
    height: 30rem;
    line-height: 30rem;
    padding-left: 30rem;
    @include ellipsis-oneline();
  }
}
.selectorInput {
  outline: none;
  border: none;
  width: 34rem;
}
.options {
  max-height: 260rem;
  padding: 5rem;
  overflow: auto;
  text-align: left;
  font-size: 14rem;
  user-select: none;
}
.option {
  height: 32rem;
  line-height: 32rem;
  padding: 0 5rem;
  border-radius: $borderRadius;
  cursor: pointer;
  @include ellipsis-oneline();

  &.disabled {
    color: #b7b7b7;
    cursor: default;
  }
  &:not(.disabled, .selected):hover {
    background-color: rgba($color: #666, $alpha: 0.05);
  }

  &.selected {
    background-color: rgba($color: $themeColor, $alpha: 0.05);
  }
}
.icon {
  width: 32rem;
  height: 30rem;
  color: #bfbfbf;
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
<style lang="scss">
.selectorInput[type='number']::-webkit-outer-spin-button,
.selectorInput[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
.selectorInput[type='number'] {
  -moz-appearance: textfield;
}
</style>
