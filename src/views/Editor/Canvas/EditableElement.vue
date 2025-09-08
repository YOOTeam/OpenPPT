<template>
  <div
    class="editable-element"
    ref="elementRef"
    :class="handleElementId === elementInfo.id ? 'active-element' : ''"
    :id="`editable-element-${elementInfo.id}`"
    :style="{
      zIndex: elementIndex,
    }"
  >
    <component
      :is="currentElementComponent"
      :elementInfo="elementInfo"
      :selectElement="selectElement"
      :dragElement="dragElement"
      :contextmenus="contextmenus"
    ></component>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import { ElementTypes, type PPTElement } from '@/types/slides'
import type { ContextmenuItem } from '@/components/Contextmenu/types'
import emitter, { EmitterEvents } from '@/utils/emitter'
import useLockElement from '@/hooks/useLockElement'
import useDeleteElement from '@/hooks/useDeleteElement'
import useCombineElement from '@/hooks/useCombineElement'
import useOrderElement from '@/hooks/useOrderElement'
import useAlignElementToCanvas from '@/hooks/useAlignElementToCanvas'
import useCopyAndPasteElement from '@/hooks/useCopyAndPasteElement'
import useSelectElement from '@/hooks/useSelectElement'

import { ElementOrderCommands, ElementAlignCommands } from '@/types/edit'
import IframeElement from '@/views/components/element/IframeElement/index.vue'
import ImageElement from '@/views/components/element/ImageElement/index.vue'
import TextElement from '@/views/components/element/TextElement/index.vue'
import ShapeElement from '@/views/components/element/ShapeElement/index.vue'
import LineElement from '@/views/components/element/LineElement/index.vue'
import ChartElement from '@/views/components/element/ChartElement/index.vue'
import TableElement from '@/views/components/element/TableElement/index.vue'
import LatexElement from '@/views/components/element/LatexElement/index.vue'
import VideoElement from '@/views/components/element/VideoElement/index.vue'
import AudioElement from '@/views/components/element/AudioElement/index.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const mainStore = useMainStore()
const { handleElement, handleElementId } = storeToRefs(mainStore)

const props = defineProps<{
  elementInfo: PPTElement
  elementIndex: number
  isMultiSelect: boolean
  selectElement: (
    e: MouseEvent | TouchEvent,
    element: PPTElement,
    canMove?: boolean
  ) => void
  dragElement
  openLinkDialog: () => void
}>()

const currentElementComponent = computed<unknown>(() => {
  const elementTypeMap = {
    [ElementTypes.IMAGE]: ImageElement,
    [ElementTypes.TEXT]: TextElement,
    [ElementTypes.SHAPE]: ShapeElement,
    [ElementTypes.LINE]: LineElement,
    [ElementTypes.CHART]: ChartElement,
    [ElementTypes.TABLE]: TableElement,
    [ElementTypes.LATEX]: LatexElement,
    [ElementTypes.VIDEO]: VideoElement,
    [ElementTypes.AUDIO]: AudioElement,
    [ElementTypes.IFRAME]: IframeElement,
  }
  return elementTypeMap[props.elementInfo.type] || null
})

const { orderElement } = useOrderElement()
const { alignElementToCanvas } = useAlignElementToCanvas()
const { combineElements, uncombineElements } = useCombineElement()
const { deleteElement } = useDeleteElement()
const { lockElement, unlockElement } = useLockElement()
const { copyElement, pasteElement, cutElement } = useCopyAndPasteElement()
const { selectAllElements } = useSelectElement()

const contextmenus = (): ContextmenuItem[] => {
  if (props.elementInfo.lock) {
    return [
      {
        text: t('canvas.lock'),
        handler: () => unlockElement(props.elementInfo),
      },
    ]
  }

  return [
    {
      text: t('canvas.cut'),
      subText: 'Ctrl + X',
      handler: cutElement,
    },
    {
      text: t('canvas.copy'),
      subText: 'Ctrl + C',
      handler: copyElement,
    },
    {
      text: t('canvas.paste'),
      subText: 'Ctrl + V',
      handler: pasteElement,
    },
    { divider: true },
    {
      text: t('canvas.setVcenter'),
      handler: () => alignElementToCanvas(ElementAlignCommands.HORIZONTAL),
      children: [
        {
          text: t('canvas.setVHcenter'),
          handler: () => alignElementToCanvas(ElementAlignCommands.CENTER),
        },
        {
          text: t('canvas.setVcenter'),
          handler: () => alignElementToCanvas(ElementAlignCommands.HORIZONTAL),
        },
        {
          text: t('canvas.setLeftAlign'),
          handler: () => alignElementToCanvas(ElementAlignCommands.LEFT),
        },
        {
          text: t('canvas.setRightAlign'),
          handler: () => alignElementToCanvas(ElementAlignCommands.RIGHT),
        },
      ],
    },
    {
      text: t('canvas.setHcenter'),
      handler: () => alignElementToCanvas(ElementAlignCommands.VERTICAL),
      children: [
        {
          text: t('canvas.setVHcenter'),
          handler: () => alignElementToCanvas(ElementAlignCommands.CENTER),
        },
        {
          text: t('canvas.setHcenter'),
          handler: () => alignElementToCanvas(ElementAlignCommands.VERTICAL),
        },
        {
          text: t('canvas.setTopAlign'),
          handler: () => alignElementToCanvas(ElementAlignCommands.TOP),
        },
        {
          text: t('canvas.setBottomAlign'),
          handler: () => alignElementToCanvas(ElementAlignCommands.BOTTOM),
        },
      ],
    },
    { divider: true },
    {
      text: t('canvas.setTopLeve'),
      disable: props.isMultiSelect && !props.elementInfo.groupId,
      handler: () => orderElement(props.elementInfo, ElementOrderCommands.TOP),
      children: [
        {
          text: t('canvas.setTopLeve'),
          handler: () =>
            orderElement(props.elementInfo, ElementOrderCommands.TOP),
        },
        {
          text: t('canvas.setTopLeve2'),
          handler: () =>
            orderElement(props.elementInfo, ElementOrderCommands.UP),
        },
      ],
    },
    {
      text: t('canvas.setBottomLeve'),
      disable: props.isMultiSelect && !props.elementInfo.groupId,
      handler: () =>
        orderElement(props.elementInfo, ElementOrderCommands.BOTTOM),
      children: [
        {
          text: t('canvas.setBottomLeve'),
          handler: () =>
            orderElement(props.elementInfo, ElementOrderCommands.BOTTOM),
        },
        {
          text: t('canvas.setBottomLeve2'),
          handler: () =>
            orderElement(props.elementInfo, ElementOrderCommands.DOWN),
        },
      ],
    },
    { divider: true },
    {
      text: t('canvas.setLink'),
      handler: props.openLinkDialog,
    },
    {
      text: props.elementInfo.groupId
        ? t('canvas.unGroup')
        : t('canvas.setGroup'),
      subText: 'Ctrl + G',
      handler: props.elementInfo.groupId ? uncombineElements : combineElements,
      hide: !props.isMultiSelect,
    },
    {
      text: t('canvas.editorChart'),
      hide: handleElement.value?.type !== 'chart',
      handler: () => {
        emitter.emit(EmitterEvents.OPEN_CHART_DATA_EDITOR)
      },
    },
    {
      text: t('canvas.selectAll'),
      subText: 'Ctrl + A',
      handler: selectAllElements,
    },
    {
      text: t('canvas.unlock'),
      subText: 'Ctrl + L',
      handler: lockElement,
    },
    {
      text: t('canvas.delete'),
      subText: 'Delete',
      handler: deleteElement,
    },
  ]
}
</script>
<style lang="scss"></style>
