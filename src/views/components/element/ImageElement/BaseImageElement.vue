<template>
  <div
    class="base-element-image"
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
      <div
        class="element-content"
        :style="{
          opacity: elementInfo.opacity,
          filter: shadowStyle ? `drop-shadow(${shadowStyle})` : '',
          transform: flipStyle,
        }"
      >
        <ImageOutline
          :elementInfo="elementInfo"
          v-if="elementInfo.outline && elementInfo.outline.style != 'none'"
        />

        <div
          class="image-content"
          :style="{
            clipPath: elementInfo?.clip?.path
              ? `url(#clip-custom-viewshape-${elementInfo.id})`
              : clipShape.style,
          }"
        >
          <img
            :src="elementInfo.src"
            :draggable="false"
            :style="{
              top: imgPosition.top,
              left: imgPosition.left,
              width: imgPosition.width,
              height: imgPosition.height,
              filter: filter,
            }"
            alt=""
          />
          <div
            class="color-mask"
            v-if="elementInfo.colorMask"
            :style="{
              backgroundColor: initColor(elementInfo.colorMask),
            }"
          ></div>
          <svg height="0" width="0" v-if="elementInfo?.clip?.path">
            <defs>
              <clipPath :id="`clip-custom-viewshape-${elementInfo.id}`">
                <path
                  :d="elementInfo.clip.path"
                  :transform="`scale(${
                    elementInfo.clip.viewBox[0] / elementInfo.width
                  }, ${elementInfo.clip.viewBox[1] / elementInfo.height})`"
                ></path>
              </clipPath>
            </defs>
          </svg>
        </div>
      </div>
    </div>
    <div
      v-if="
        elementInfo.isApi || elementInfo.iconResect || elementInfo.imgResect
      "
      class="mark-shape"
    >
      <div class="spinner-box">
        <div class="spinner-border"></div>
        <div class="spinner"></div>
      </div>
      <p class="spinner-tips" v-if="elementInfo.width > 80">
        {{ $t('canvas.imgLoading') }}
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { PPTImageElement } from '@/types/slides'
import useElementShadow from '@/views/components/element/hooks/useElementShadow'
import useElementFlip from '@/views/components/element/hooks/useElementFlip'
import useClipImage from './useClipImage'
import useFilter from './useFilter'
import useColor from '@/hooks/useColor'

import ImageOutline from './ImageOutline/index.vue'

const props = defineProps<{
  elementInfo: PPTImageElement
}>()
const { initColor } = useColor()

const shadow = computed(() => props.elementInfo.shadow)
const { shadowStyle } = useElementShadow(shadow)

const flipH = computed(() => props.elementInfo.flipH)
const flipV = computed(() => props.elementInfo.flipV)
const { flipStyle } = useElementFlip(flipH, flipV)

const clip = computed(() => props.elementInfo.clip)
const { clipShape, imgPosition } = useClipImage(clip)

const filters = computed(() => props.elementInfo.filters)
const { filter } = useFilter(filters)
</script>

<style lang="scss" scoped>
.base-element-image {
  position: absolute;
}
.rotate-wrapper {
  width: 100%;
  height: 100%;
}
.element-content {
  width: 100%;
  height: 100%;
  position: relative;

  .image-content {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
  }

  img {
    position: absolute;
  }
}
.color-mask {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}
.spinner-box {
  position: relative;
  width: 40rem;
  height: 40rem;
  margin-bottom: 10rem;

  .spinner-border {
    position: absolute;
    margin: auto;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    width: 40rem;
    height: 40rem;
    border: 10rem solid #eadffa;
    border-radius: 50%;
  }

  .spinner {
    position: absolute;
    margin: auto;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    width: 40rem;
    height: 40rem;
    background: linear-gradient(#f2effa, #f2effa),
      linear-gradient(270deg, #6040fc 15%, #e750e6 100%);
    background-clip: padding-box, border-box;
    border: 6rem solid transparent;
    border-top-color: #eadffa;
    border-left-color: #eadffa;
    border-right-color: #eadffa;
    border-radius: 50%;
    animation: spinner 0.8s linear infinite;
  }
  @keyframes spinner {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
}
</style>
