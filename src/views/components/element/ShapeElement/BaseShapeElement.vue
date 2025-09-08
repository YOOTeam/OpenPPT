<template>
  <div
    class="base-element-shape"
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
          color: initColor(text.defaultColor),
          fontFamily: text.defaultFontName,
        }"
      >
        <svg
          overflow="visible"
          :width="elementInfo.width"
          :height="elementInfo.height"
        >
          <defs
            v-if="
              elementInfo.gradient ||
              elementInfo.fillPicture ||
              elementInfo.softEdge ||
              elementInfo?.outline?.gradient
            "
          >
            <GradientDefs
              v-if="elementInfo.gradient"
              :id="`base-gradient-${elementInfo.id}`"
              :type="elementInfo.gradient.type"
              :colors="elementInfo.gradient.colors"
              :rotate="elementInfo.gradient.rotate"
              :radialGradient="elementInfo.gradient.fillToRect"
            />
            <FillPictureDefs
              v-if="elementInfo.fillPicture"
              :id="`view-shpae-fillPicture-${elementInfo.id}`"
              :src="elementInfo.fillPicture.src"
              :viewW="elementInfo.viewBox[0]"
              :viewY="elementInfo.viewBox[1]"
              :imgFillType="elementInfo.imgFillType"
              :fillPicture="elementInfo.fillPicture"
            />

            <filter
              :id="`view-blurFilter-${elementInfo.id}`"
              v-if="elementInfo.softEdge"
            >
              <feGaussianBlur
                in="SourceGraphic"
                :stdDeviation="elementInfo.softEdge"
              />
            </filter>

            <GradientDefs
              v-if="elementInfo?.outline?.gradient"
              :id="`view-shape-outline-${elementInfo.id}`"
              :type="elementInfo?.outline?.gradient?.type"
              :colors="elementInfo?.outline?.gradient?.colors"
              :rotate="elementInfo?.outline?.gradient?.rotate"
              :radialGradient="elementInfo?.outline?.gradient?.fillToRect"
            />
          </defs>

          <g
            :transform="`scale(${(
              elementInfo.width / elementInfo.viewBox[0]
            ).toFixed(3)}, ${scaleY}) translate(0,0) matrix(1,0,0,1,0,0)`"
          >
            <template v-if="typeof elementInfo.path === 'object'">
              <path
                vector-effect="non-scaling-stroke"
                stroke-linecap="butt"
                stroke-miterlimit="8"
                v-for="(path, index) in elementInfo.path"
                :key="path"
                :d="path"
                :filter="
                  elementInfo.softEdge
                    ? `url(#view-blurFilter-${elementInfo.id})`
                    : ''
                "
                :fill="fillStyle"
                :stroke="
                  elementInfo?.outline?.gradient
                    ? `url(#view-shape-outline-${elementInfo.id})`
                    : outlineColor
                "
                :stroke-width="
                  elementInfo.outline && elementInfo.outline.style != 'none'
                    ? outlineWidth
                    : 0
                "
                :stroke-dasharray="strokeDashArray"
                v-bind="computedAttrs(index)"
              ></path>
            </template>
            <template v-else>
              <path
                vector-effect="non-scaling-stroke"
                stroke-linecap="butt"
                stroke-miterlimit="8"
                :d="elementInfo.path"
                :fill="fillStyle"
                :filter="
                  elementInfo.softEdge
                    ? `url(#view-blurFilter-${elementInfo.id})`
                    : ''
                "
                :stroke="
                  elementInfo?.outline?.gradient
                    ? `url(#view-shape-outline-${elementInfo.id})`
                    : outlineColor
                "
                :stroke-width="
                  elementInfo.outline && elementInfo.outline.style != 'none'
                    ? outlineWidth
                    : 0
                "
                :stroke-dasharray="strokeDashArray"
                v-bind="computedAttrs(0)"
              ></path>
            </template>
          </g>
        </svg>

        <div
          class="shape-text"
          :class="text.align"
          :style="{
            lineHeight: text?.lineHeight,
            letterSpacing: (text?.wordSpace || 0) + 'px',
          }"
        >
          <div class="ProseMirror-static" v-html="text.content"></div>
        </div>
      </div>
    </div>
    <div v-if="showMark" class="mark-shape">
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
import { computed, watch } from 'vue'
import type { PPTShapeElement, ShapeText } from '@/types/slides'
import useElementOutline from '@/views/components/element/hooks/useElementOutline'
import useElementShadow from '@/views/components/element/hooks/useElementShadow'
import useElementFlip from '@/views/components/element/hooks/useElementFlip'
import FillPictureDefs from './FillPictureDefs.vue'
import GradientDefs from './GradientDefs.vue'
import useColor from '@/hooks/useColor'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const props = defineProps<{
  elementInfo: any
}>()

const showMark = computed(() => {
  return (
    props.elementInfo.isApi ||
    props.elementInfo.iconResect ||
    props.elementInfo.imgResect
  )
})

const computedAttrs = computed((value) => (value) => {
  let obj = {}
  if (props.elementInfo.attrArry?.length > 0) {
    obj = props.elementInfo.attrArry[value]
  }
  return obj
})
const { initColor } = useColor()
const outline = computed(() => props.elementInfo.outline)
const { outlineWidth, outlineColor, strokeDashArray } =
  useElementOutline(outline)

const fillStyle = computed(() => {
  let resule = ''
  if (props.elementInfo.gradient) {
    resule = `url(#base-gradient-${props.elementInfo.id})`
  } else if (props.elementInfo.fillPicture) {
    resule = `url(#view-shpae-fillPicture-${props.elementInfo.id})`
  } else if (props.elementInfo.fill === 'noFill') {
    resule = 'none'
  } else {
    resule = initColor(props.elementInfo.fill)
  }
  return resule
})

const shadow = computed(() => props.elementInfo.shadow)
const { shadowStyle } = useElementShadow(shadow)

const flipH = computed(() => props.elementInfo.flipH)
const flipV = computed(() => props.elementInfo.flipV)
const { flipStyle } = useElementFlip(flipH, flipV)
const scaleY = computed(() => {
  return isNaN(props.elementInfo.height / props.elementInfo.viewBox[1]) ||
    props.elementInfo.height / props.elementInfo.viewBox[1] === Infinity
    ? 0
    : (props.elementInfo.height / props.elementInfo.viewBox[1]).toFixed(3)
})

const text = computed<ShapeText>(() => {
  const defaultText: any = {
    content: '',
    defaultFontName: '微软雅黑',
    defaultColor: '#000',
    align: 'center',
  }
  if (!props.elementInfo.text) return defaultText

  return props.elementInfo.text
})
</script>

<style lang="scss" scoped>
.base-element-shape {
  position: absolute;
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
}
.rotate-wrapper {
  width: 100%;
  height: 100%;
}
.element-content {
  width: 100%;
  height: 100%;
  position: relative;

  svg {
    transform-origin: 0 0;
    overflow: visible;
  }
}
.shape-text {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  padding: 5px 10px;
  line-height: 1.2;
  word-break: break-word;

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
</style>
