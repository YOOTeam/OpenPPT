import { ref, watch, type Ref } from 'vue'
import type { TableTheme } from '@/types/slides'
import useColor from '@/hooks/useColor'
import { getTableSubThemeColor } from '@/utils/element'

// 通过表格的主题色计算辅助颜色

export default (theme: Ref<TableTheme | undefined>) => {
  const { initColor } = useColor()
  const subThemeColor = ref(['', ''])
  watch(
    () => theme.value,
    () => {
      if (theme.value) {
        const color: any = initColor(theme.value.color)
        subThemeColor.value = getTableSubThemeColor(color)
      }
    },
    { immediate: true, deep: true }
  )

  return {
    subThemeColor,
  }
}
