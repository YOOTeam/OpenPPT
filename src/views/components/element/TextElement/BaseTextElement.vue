<template>
  <div
    class="base-element-text"
    :style="{
      top: elementInfo.top + 'px',
      left: elementInfo.left + 'px',
      width: elementInfo.width + 'px',
      height: elementInfo.height + 'px',
    }"
  >
    <div
      class="rotate-wrapper"
      :style="{ transform: `rotate(${elementInfo.rotate}deg)` }"
      :class="[elementInfo.verticalAlign]"
    >
      <div
        class="element-content"
        data-key="68df251594547faf"
        :style="{
          width: elementInfo.vertical ? 'auto' : elementInfo.width + 'px',
          height: elementInfo.vertical ? elementInfo.height + 'px' : 'auto',
          backgroundColor: initColor(elementInfo.fill),
          opacity: elementInfo.opacity,
          textShadow: shadowStyle,
          lineHeight: elementInfo.lineHeight,
          letterSpacing: (elementInfo.wordSpace || 0) + 'px',
          color: initColor(elementInfo.defaultColor),
          fontFamily: elementInfo.defaultFontName,
          writingMode: elementInfo.vertical ? 'vertical-rl' : 'horizontal-tb',
        }"
      >
        <ElementOutline
          :width="elementInfo.width"
          :height="elementInfo.height"
          :outline="elementInfo.outline"
          :id="elementInfo.id"
          :softEdge="elementInfo.softEdge"
        />
        <div
          class="text ProseMirror-static prosemirror-editor-text"
          :class="{ thumbnail: target === 'thumbnail' }"
          :style="{
            '--paragraphSpace': `${
              elementInfo.paragraphSpace === undefined
                ? 0
                : elementInfo.paragraphSpace
            }px`,
          }"
          v-html="elementInfo.content"
        ></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { PPTTextElement } from '@/types/slides'
import ElementOutline from '@/views/components/element/ElementOutline.vue'

import useElementShadow from '@/views/components/element/hooks/useElementShadow'
import useColor from '@/hooks/useColor'

const props = defineProps<{
  elementInfo: PPTTextElement
  target?: string
}>()
const { initColor } = useColor()
const shadow = computed(() => props.elementInfo.shadow)
const { shadowStyle } = useElementShadow(shadow)
</script>

<style lang="scss" scoped>
.base-element-text {
  position: absolute;
}
.rotate-wrapper {
  width: 100%;
  height: 100%;

  display: flex;
  flex-direction: column;

  &.top {
    justify-content: flex-start;
  }
  &.center {
    justify-content: center;
  }
  &.bottom {
    justify-content: flex-end;
  }
}
.element-content {
  position: relative;
  padding: 5px 10px;
  line-height: 1.5;
  word-break: break-word;

  .text {
    position: relative;

    &.thumbnail {
      pointer-events: none;
    }
  }
}
</style>
