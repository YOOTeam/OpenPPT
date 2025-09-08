import { computed, type Ref } from 'vue'
import type { PPTElementShadow } from '@/types/slides'
import useColor from '@/hooks/useColor'

// 计算元素的阴影样式
export default (shadow: Ref<PPTElementShadow | undefined>) => {
  const shadowStyle = computed(() => {
    const { initColor } = useColor()
    if (shadow.value && shadow.value.openShow === 'show') {
      const { h, v, blur, color } = shadow.value

      const colorObj: any = color
      const colors: any = initColor(colorObj)

      return `${h}px ${v}px ${blur}px ${colors}`
    }
    return ''
  })

  return {
    shadowStyle,
  }
}