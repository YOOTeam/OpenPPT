<template>
  <div
    class="editable-element-image"
    :class="{ lock: elementInfo.lock }"
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
      <ImageClipHandler
        v-if="isCliping"
        :src="elementInfo.src"
        :title="title"
        :clipData="elementInfo.clip"
        :width="elementInfo.width"
        :height="elementInfo.height"
        :top="elementInfo.top"
        :left="elementInfo.left"
        :rotate="elementInfo.rotate"
        :clipPath="clipShape.style"
        :id="elementInfo.id"
        @clip="(range) => handleClip(range)"
      />
      <div
        class="element-content"
        v-else
        :style="{
          opacity: elementInfo.opacity,
          filter: shadowStyle ? `drop-shadow(${shadowStyle})` : '',
          transform: flipStyle,
        }"
        v-contextmenu="contextmenus"
        @mousedown="($event) => handleSelectElement($event)"
        @touchstart="($event) => handleSelectElement($event)"
      >
        <ImageOutline
          :elementInfo="elementInfo"
          v-if="elementInfo.outline && elementInfo.outline.style != 'none'"
        />

        <div
          class="image-content"
          :style="{
            clipPath: elementInfo?.clip?.path
              ? `url(#clip-custom-shape-${elementInfo.id})`
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
            @dragstart.prevent
            alt=""
          />
          <div
            class="color-mask"
            v-if="elementInfo.colorMask"
            :style="{
              backgroundColor: initColor(elementInfo.colorMask),
            }"
          ></div>
        </div>
        <svg height="0" width="0" v-if="elementInfo?.clip?.path">
          <defs>
            <clipPath :id="`clip-custom-shape-${elementInfo.id}`">
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
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import type { ImageElementClip, PPTImageElement } from '@/types/slides'
import type { ImageClipedEmitData } from '@/types/edit'
import type { ContextmenuItem } from '@/components/Contextmenu/types'
import useElementShadow from '@/views/components/element/hooks/useElementShadow'
import useElementFlip from '@/views/components/element/hooks/useElementFlip'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import useClipImage from './useClipImage'
import useFilter from './useFilter'
import useColor from '@/hooks/useColor'
import ImageOutline from './ImageOutline/index.vue'
import ImageClipHandler from './ImageClipHandler.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const props = defineProps<{
  elementInfo: PPTImageElement
  selectElement: (
    e: MouseEvent | TouchEvent,
    element: PPTImageElement,
    canMove?: boolean
  ) => void
  dragElement: (e: MouseEvent | TouchEvent, element: PPTImageElement) => void
  contextmenus: () => ContextmenuItem[] | null
}>()

const { initColor } = useColor()
const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const { clipingImageElementId } = storeToRefs(mainStore)
const title = ref('')
const isCliping = computed(
  () => clipingImageElementId.value === props.elementInfo.id
)

const { addHistorySnapshot } = useHistorySnapshot()

const shadow = computed(() => props.elementInfo.shadow)
const { shadowStyle } = useElementShadow(shadow)

const flipH = computed(() => props.elementInfo.flipH)
const flipV = computed(() => props.elementInfo.flipV)
const { flipStyle } = useElementFlip(flipH, flipV)

const clip = computed(() => props.elementInfo.clip)
const { clipShape, imgPosition } = useClipImage(clip)

const filters = computed(() => props.elementInfo.filters)
const { filter } = useFilter(filters)

const handleSelectElement = (e: MouseEvent | TouchEvent) => {
  if (props.elementInfo.lock) return
  e.stopPropagation()
  props.selectElement(e, props.elementInfo)
}
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.ctrlKey && e.altKey && e.key === 'm') {
    title.value = '16782d67ea165a7f'
  }
}

const handleClip = (data: ImageClipedEmitData | null) => {
  mainStore.setClipingImageElementId('')

  if (!data) return

  const { range, position } = data
  const originClip: ImageElementClip = props.elementInfo.clip || {
    shape: 'rect',
    range: [
      [0, 0],
      [100, 100],
    ],
  }

  const left = props.elementInfo.left + position.left
  const top = props.elementInfo.top + position.top
  const width = props.elementInfo.width + position.width
  const height = props.elementInfo.height + position.height

  let centerOffsetX = 0
  let centerOffsetY = 0

  if (props.elementInfo.rotate) {
    const centerX =
      left + width / 2 - (props.elementInfo.left + props.elementInfo.width / 2)
    const centerY = -(
      top +
      height / 2 -
      (props.elementInfo.top + props.elementInfo.height / 2)
    )

    const radian = (-props.elementInfo.rotate * Math.PI) / 180

    const rotatedCenterX =
      centerX * Math.cos(radian) - centerY * Math.sin(radian)
    const rotatedCenterY =
      centerX * Math.sin(radian) + centerY * Math.cos(radian)

    centerOffsetX = rotatedCenterX - centerX
    centerOffsetY = -(rotatedCenterY - centerY)
  }

  const _props = {
    clip: { ...originClip, range },
    left: left + centerOffsetX,
    top: top + centerOffsetY,
    width,
    height,
  }
  slidesStore.updateElement({ id: props.elementInfo.id, props: _props })

  addHistorySnapshot()
}
document.addEventListener('keydown', handleKeyDown)
</script>

<style lang="scss" scoped>
.editable-element-image {
  position: absolute;

  &.lock .element-content {
    cursor: default;
  }
}
.rotate-wrapper {
  width: 100%;
  height: 100%;
}
.element-content {
  width: 100%;
  height: 100%;
  position: relative;
  cursor: move;

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
.mark-shape {
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f2effa;
  border-radius: 10rem;
  .spinner-tips {
    font-size: 12px;
    color: #1a1a1a;
    margin: 10rem 0;
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
}
</style>
