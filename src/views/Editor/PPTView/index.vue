<template>
  <!-- <transition mode="out-in"> -->
  <!-- 浏览视图 -->
  <BrowseView v-if="pptViewData.type === 'browseView'" :key="'browse'" />

  <!-- 大纲视图 -->
  <OutlineView
    v-else-if="pptViewData.type === 'outlineView'"
    :key="'outline'"
  />
  <!-- 脑图视图 -->
  <MindView v-else-if="pptViewData.type === 'mindView'" :key="'mind'" />
  <!-- 默认视图 -->
  <DefaultEditor v-else :key="'default'" />
  <!-- </transition> -->
</template>
<script lang="ts" setup>
import {
  computed,
  defineComponent,
  onMounted,
  reactive,
  toRefs,
  ref,
  watch,
} from 'vue'
import { useSlidesStore } from '@/store'
import { storeToRefs } from 'pinia'
import DefaultEditor from './DefaultEditor.vue'
import BrowseView from './BrowseView.vue'
import OutlineView from './OutlineView.vue'
import MindView from './MindView.vue'

const slidesStore = useSlidesStore()
const { pptViewData } = storeToRefs(slidesStore)

// 记录上一个视图类型，用于确定动画方向
const prevViewType = ref('')

// 监听视图类型变化
watch(
  () => pptViewData.value.type,
  (newType, oldType) => {
    prevViewType.value = oldType
  }
)
</script>
<style scoped>
.v-enter-active,
.v-leave-active {
  transition: opacity 0.3s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
