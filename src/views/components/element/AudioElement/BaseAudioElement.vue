<template>
  <div
    class="base-element-audio"
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
    >
      <div class="element-content">
        <template
          v-if="elementInfo.path && elementInfo.path !== 'icon-yinpinbofang'"
        >
          <i
            v-if="typeof elementInfo.path === 'string'"
            class="iconfont"
            :class="elementInfo.path"
            :style="{
              fontSize: audioIconSize,
              color: initColor(elementInfo.color),
            }"
          ></i>
        </template>
        <IconVolumeNotice
          v-else
          class="audio-icon"
          :style="{
            fontSize: audioIconSize,
            color: initColor(elementInfo.color),
          }"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { PPTAudioElement } from '@/types/slides'
import useColor from '@/hooks/useColor'

const { initColor } = useColor()

const props = defineProps<{
  elementInfo: PPTAudioElement
}>()

const audioIconSize = computed(() => {
  return Math.min(props.elementInfo.width, props.elementInfo.height) + 'px'
})
</script>

<style lang="scss" scoped>
.base-element-audio {
  position: absolute;
}
.rotate-wrapper {
  width: 100%;
  height: 100%;
}
.element-content {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.audio-icon {
  cursor: move;
}
</style>
