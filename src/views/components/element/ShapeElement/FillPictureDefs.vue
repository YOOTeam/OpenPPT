<template>
  <pattern
    :id="id"
    patternUnits="userSpaceOnUse"
    :width="imgFillType !== 'stretch' ? fillPicture?.imgW || viewW : viewW"
    :height="imgFillType !== 'stretch' ? fillPicture?.imgH || viewY : viewY"
    x1="0%"
    y1="0%"
    x2="100%"
    y2="0%"
  >
    <image
      :xlink:href="src"
      :x="fillPicture?.cropLeft || 0"
      :y="fillPicture?.cropTop || 0"
      :width="fillPicture?.imgW || viewW"
      :height="fillPicture?.imgH || viewY"
      :preserveAspectRatio="imgFillType === 'stretch' ? 'none' : ''"
    />
  </pattern>
</template>

<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    id: string
    src?: string
    viewW?: number
    viewY?: number
    imagePosition?: any
    imgFillType?: any
    fillPicture?: any
  }>(),
  {
    viewW: 100,
    viewY: 100,
    imgFillType: 'stretch',
  }
)
</script>
