<template>
  <div class="remark">
    <div class="resize-handler" @mousedown="($event) => resize($event)"></div>
    <div
      class="editor-read"
      ref="editorRef"
      v-html="remark"
      contenteditable="true"
      @focus="handleFocus"
      @blur="handleBlur"
      :placeholder="t('remarkPlacehoder')"
    ></div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore, useMainStore } from '@/store'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const props = defineProps<{
  height: number
  clickSource?: string
}>()

const emit = defineEmits<{
  (event: 'update:height', payload: number): void
}>()

const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const { currentSlide } = storeToRefs(slidesStore)

const editorRef = ref(null)

const remark = computed(() => {
  const str = currentSlide.value?.remark || ''
  return str.replace(/\n/g, '<br />')
})
const handleFocus = () => {
  let height = 120
  if (editorRef.value) {
    const h = parseInt(editorRef.value.offsetHeight)
    if (h <= 100) {
      height = 120
    } else {
      height = h
    }
  }
  editorRef.value.classList.add('remark-style')
  mainStore.setCreateLoading({
    showNote: true,
    height: 0,
  })
  emit('update:height', height)
}

const handleBlur = () => {
  editorRef.value.classList.remove('remark-style')
  if (props.clickSource && props.clickSource !== 'null') {
    mainStore.setCreateLoading({
      showRemark: true,
      height: 120,
    })
    return
  }
  emit('update:height', 66)

  slidesStore.updateSlide({ remark: editorRef.value.innerHTML })
  mainStore.setCreateLoading({
    showRemark: null,
  })
}

const resize = (e: MouseEvent) => {
  let isMouseDown = true
  const startPageY = e.pageY
  const originHeight = props.height

  document.onmousemove = (e) => {
    if (!isMouseDown) return

    const currentPageY = e.pageY

    const moveY = currentPageY - startPageY
    let newHeight = -moveY + originHeight

    if (newHeight < 40) newHeight = 40
    if (newHeight > 460) newHeight = 460

    emit('update:height', newHeight)
  }

  document.onmouseup = () => {
    isMouseDown = false
    document.onmousemove = null
    document.onmouseup = null
  }
}
</script>

<style lang="scss" scoped>
.editor-read-only {
  height: 100%;
  overflow: auto;
  border-radius: 10rem;
  font-size: 12px;
  padding: 8rem;
  line-height: 1.5;
}
.editor-read {
  width: 100%;
  height: 100%;
  outline: none;
  padding: 10rem;
  font-size: 14rem;
  line-height: 1.3;
}
div[contenteditable='true']:empty::before {
  content: attr(placeholder);
  width: max-content;
  color: #777777;
  font-size: 14rem;
  position: absolute;
  display: contents;
  z-index: -1;
}
.remark-style {
  border-radius: 10rem;
  background: #ffffffde !important;
  border: 1rem solid $themeColor !important;
  color: #1a1a1a;
  &:hover {
    background: #ffffffde !important;
  }
  .ProseMirror {
    :first-child::before {
      color: #fff;
      content: attr(data-placeholder);
      pointer-events: none;
      position: absolute;
      font-size: 12rem;
      color: rgba(#474444, 0.5) !important;
    }
  }
}
.remark {
  height: 100%;
  position: relative;
  color: rgba($color: #0e0e0e, $alpha: 0.6);
}
.resize-handler {
  height: 7rem;
  position: absolute;
  top: -3rem;
  left: 0;
  right: 0;
  cursor: n-resize;
  z-index: 2;
  border-radius: 10rem;
  &:hover {
    background: $themeColor;
  }
}
</style>
