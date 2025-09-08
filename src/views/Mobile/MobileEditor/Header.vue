<template>
  <div
    class="mobile-editor-header"
    :style="{
      justifyContent: 'space-between',
    }"
  >
    <div class="history" v-if="!isAllDisableEdit && !showBack">
      <div
        class="history-item"
        :class="{ disable: !canUndo }"
        @click.stop="undo()"
      >
        <IconReturn />
      </div>
      <div
        class="history-item"
        :class="{ disable: !canRedo }"
        @click.stop="redo()"
      >
        <IconGoOn />
      </div>
    </div>
    <div v-if="showBack" class="title-prew">{{ title }}</div>
    <div class="back" @click="changeMode('preview', 'editor')">
      <IconLogout /> {{ isAllDisableEdit || showBack ? '返回' : '完成编辑' }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { useSnapshotStore, useMainStore, useSlidesStore } from '@/store'
import type { Mode } from '@/types/mobile'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
const mainStore = useMainStore()
const { isAllDisableEdit } = storeToRefs(mainStore)
defineProps<{
  changeMode: (mode: Mode) => void
  showBack?: boolean
}>()
const { title } = storeToRefs(useSlidesStore())
const { canUndo, canRedo } = storeToRefs(useSnapshotStore())
const { redo, undo } = useHistorySnapshot()
</script>

<style lang="scss" scoped>
.mobile-editor-header {
  width: calc(100% - 8rem);
  margin: 0 auto;
  border-radius: 10rem;
  height: 54rem;
  background-color: #fff;
  display: flex;

  align-items: center;
  padding: 0 10rem;
  font-size: 18rem;
  box-shadow: 0 0 15rem 0 rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 2;
}
.title-prew {
  padding-left: 10rem;
  color: #1a1a1a;
  max-width: 80%;
  @include ellipsis-oneline();
}
.history {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.history-item {
  height: 100%;
  width: 40rem;
  display: flex;
  justify-content: center;
  align-items: center;

  &.disable {
    opacity: 0.5;
  }
}
</style>
