<template>
  <div
    class="tabs"
    :class="{
      card: card,
      'space-around': spaceAround,
      'space-between': spaceBetween,
    }"
    :style="tabsStyle || {}"
  >
    <div
      class="tab"
      :class="{ active: tab.key === value }"
      v-for="tab in tabs"
      :key="tab.key"
      :style="{
        ...(tabStyle || {}),
        '--color': tab.color,
      }"
      @click="emit('update:value', tab.key)"
    >
      {{ tab.label }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { type CSSProperties } from 'vue'

interface TabItem {
  key: string
  label: string
  color?: string
}

withDefaults(
  defineProps<{
    value: string
    tabs: TabItem[]
    card?: boolean
    tabsStyle?: CSSProperties
    tabStyle?: CSSProperties
    spaceAround?: boolean
    spaceBetween?: boolean
  }>(),
  {
    card: false,
    spaceAround: false,
    spaceBetween: false,
  }
)

const emit = defineEmits<{
  (event: 'update:value', payload: string): void
}>()
</script>

<style lang="scss" scoped>
.tabs {
  display: flex;
  user-select: none;
  line-height: 1;
  color: #1a1a1a;

  &:not(.card) {
    font-size: 14rem;
    align-items: center;
    justify-content: center;

    &.space-around {
      justify-content: space-around;
    }

    &.space-between {
      justify-content: space-between;
    }

    .tab {
      text-align: center;
      border-bottom: 3rem solid transparent;
      margin: 0 10rem;
      padding: 8rem 0;
      cursor: pointer;
      font-weight: 400;
      &:hover {
        color: $themeColor;
      }

      &:active {
        color: #babaea;
      }

      &.active {
        color: $themeColor;
        border-bottom: 3rem solid var(--color, $themeColor);
        font-weight: 500;
      }
    }
  }

  &.card {
    height: 40rem;
    font-size: 12rem;
    flex-shrink: 0;

    .tab {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: $hoverbg;
      border-bottom: 1rem solid $borderColor;
      cursor: pointer;
      font-weight: 400;

      &.active {
        background-color: transparent;
        border-bottom-color: transparent;
        font-weight: 500;
      }

      & + .tab {
        border-left: 1rem solid $borderColor;
      }
    }
  }
}
</style>
