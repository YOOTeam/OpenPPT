<template>
  <div class="image-outline">
    <ImagePathOutline
      v-if="elementInfo?.clip?.path"
      :width="elementInfo.width"
      :height="elementInfo.height"
      :outline="elementInfo.outline"
      :path="elementInfo?.clip?.path"
      :viewBoxWidth="elementInfo.clip.viewBox[0]"
      :viewBoxHeight="elementInfo.clip.viewBox[1]"
      :id="elementInfo.id"
    />
    <ImageRectOutline
      v-else-if="clipShape.type === 'rect'"
      :width="elementInfo.width"
      :height="elementInfo.height"
      :radius="clipShape.radius"
      :outline="elementInfo.outline"
      :id="elementInfo.id"
    />
    <ImageEllipseOutline
      v-else-if="clipShape.type === 'ellipse'"
      :width="elementInfo.width"
      :height="elementInfo.height"
      :outline="elementInfo.outline"
      :id="elementInfo.id"
    />
    <ImagePolygonOutline
      v-else-if="clipShape.type === 'polygon'"
      :width="elementInfo.width"
      :height="elementInfo.height"
      :outline="elementInfo.outline"
      :createPath="clipShape.createPath!"
      :id="elementInfo.id"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { PPTImageElement } from '@/types/slides'
import useClipImage from '../useClipImage'

import ImageRectOutline from './ImageRectOutline.vue'
import ImageEllipseOutline from './ImageEllipseOutline.vue'
import ImagePolygonOutline from './ImagePolygonOutline.vue'
import ImagePathOutline from './ImagePathOutline.vue'
const props = defineProps<{
  elementInfo: PPTImageElement
}>()

const clip = computed(() => props.elementInfo.clip)
const { clipShape } = useClipImage(clip)
</script>
