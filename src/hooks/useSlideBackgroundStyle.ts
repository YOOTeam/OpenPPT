import { type Ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import type { SlideBackground } from '@/types/slides'
import { useSlidesStore } from '@/store'
import useColor from '@/hooks/useColor'
// 将页面背景数据转换为css样式
export default (background: Ref<SlideBackground | undefined>) => {
  const { initColor } = useColor()
  const slidesStore = useSlidesStore()
  const { themeColorList } = storeToRefs(slidesStore)
  const backgroundStyle = computed(() => {
    if (!background.value) return { backgroundColor: '#fff' }
    const {
      type,
      color,
      image,
      gradient,
    } = background.value

    // 纯色背景
    if (type === 'solid') {
      let bgcolor: any = ''
      const colorData: any = color
      bgcolor = initColor(colorData)

      return { backgroundColor: bgcolor }
    }


    // 背景图模式
    // 包括：背景图、背景大小，是否重复
    else if (type === 'image' && image) {
      const { src, size } = image
      if (!src) return { backgroundColor: '#fff' }
      if (size === 'repeat') {
        return {
          backgroundImage: `url(${src}`,
          backgroundRepeat: 'repeat',
          backgroundSize: 'contain',
        }
      }
      return {
        backgroundImage: `url(${src}`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: size || 'cover',
      }
    }

    // 渐变色背景
    else if (type === 'gradient' && gradient) {
      const { type, colors, rotate } = gradient
      const list = colors.map(item => `${initColor(item.color)} ${item.pos}%`)

      if (type === 'radial') return { backgroundImage: `radial-gradient(${list.join(',')}` }
      return { backgroundImage: `linear-gradient(${rotate}deg, ${list.join(',')}` }
    }

    return { backgroundColor: '#fff' }
  })

  return {
    backgroundStyle,
  }
}