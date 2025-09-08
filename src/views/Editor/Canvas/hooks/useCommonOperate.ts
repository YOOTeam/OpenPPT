import { computed, type Ref } from 'vue'
import { OperateResizeHandlers, OperateBorderLines } from '@/types/edit'

export default (width: Ref<number>, height: Ref<number>) => {
  // 元素缩放点
  const resizeHandlers = computed(() => {
    return [
      { direction: OperateResizeHandlers.LEFT_TOP, style: {} },
      {
        direction: OperateResizeHandlers.TOP,
        style: { left: width.value / 2 - 8 + 'px' },
      },
      {
        direction: OperateResizeHandlers.RIGHT_TOP,
        style: { left: width.value + 'px' },
      },
      {
        direction: OperateResizeHandlers.LEFT,
        style: { top: height.value / 2 - 8 + 'px' },
      },
      {
        direction: OperateResizeHandlers.RIGHT,
        style: {
          left: width.value + 3 + 'px',
          top: height.value / 2 - 8 + 'px',
        },
      },
      {
        direction: OperateResizeHandlers.LEFT_BOTTOM,
        style: { top: height.value + 'px' },
      },
      {
        direction: OperateResizeHandlers.BOTTOM,
        style: {
          left: width.value / 2 - 8 + 'px',
          top: height.value + 3 + 'px',
        },
      },
      {
        direction: OperateResizeHandlers.RIGHT_BOTTOM,
        style: { left: width.value + 'px', top: height.value + 'px' },
      },
    ]
  })

  // 文本元素缩放点
  const textElementResizeHandlers = computed(() => {
    return [
      {
        direction: OperateResizeHandlers.LEFT,
        style: { top: height.value / 2 - 7 + 'px' },
      },
      {
        direction: OperateResizeHandlers.RIGHT,
        style: { left: width.value + 'px', top: height.value / 2 - 7 + 'px' },
      },
    ]
  })
  const verticalTextElementResizeHandlers = computed(() => {
    return [
      {
        direction: OperateResizeHandlers.TOP,
        style: { left: width.value / 2 - 7 + 'px' },
      },
      {
        direction: OperateResizeHandlers.BOTTOM,
        style: { left: width.value / 2 + 'px', top: height.value - 7 + 'px' },
      },
    ]
  })

  // 元素选中边框线
  const borderLines = computed(() => {
    return [
      { type: OperateBorderLines.T, style: { width: width.value + 'px' } },
      {
        type: OperateBorderLines.B,
        style: { top: height.value + 'px', width: width.value + 'px' },
      },
      { type: OperateBorderLines.L, style: { height: height.value + 'px' } },
      {
        type: OperateBorderLines.R,
        style: { left: width.value + 'px', height: height.value + 2 + 'px' },
      },
    ]
  })

  return {
    resizeHandlers,
    textElementResizeHandlers,
    verticalTextElementResizeHandlers,
    borderLines,
  }
}
