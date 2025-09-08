import { ref } from 'vue'

import { useMainStore, useSlidesStore } from '@/store'
import { storeToRefs } from 'pinia'

/**
 * 鼠标溯源钩子
 * 功能：提供检查元素是否有溯源数据和获取幻灯片溯源ID的功能
 */
export default () => {
  const mainStore = useMainStore()
  const slidesStore = useSlidesStore()
  const { currentSlide } = storeToRefs(slidesStore)

  const hasSource = (element: any): string | false => {
    const normalTags = element?.tags?.normal
    if (!normalTags?.length) return false
    const hasSrouce = normalTags.find((item: any) => {
      return item.key === 'TAG_CITE_ID'
    })
    if (hasSrouce) {
      const values = hasSrouce.value
        .split(',')
        .map(Number)
        .filter((num: any) => !isNaN(num))
      const sortedValues = values.sort((a: any, b: any) => a - b)
      return sortedValues.join(',')
    }
    return false
  }

  const finSlideSource = (
    slide: any,
    isOpenLink: boolean,
    sourceList: any[],
    slideIndex: number,
    allSlides: any[]
  ): string[] => {
    let lightList: string[] = []

    // 检查当前幻灯片是否是章节幻灯片
    const isChapterSlide = slide?.tags?.custom?.page_type === 'chapter'

    if (isChapterSlide) {
      // 找到下一个章节幻灯片的索引
      let nextChapterIndex = allSlides.length
      for (let i = slideIndex + 1; i < allSlides.length; i++) {
        if (allSlides[i]?.tags?.custom?.page_type === 'chapter') {
          nextChapterIndex = i
          break
        }
      }

      // 收集从当前章节幻灯片到下一个章节幻灯片之间的所有幻灯片的溯源ID
      for (let i = slideIndex; i < nextChapterIndex; i++) {
        const currentSlide = allSlides[i]
        currentSlide.elements.forEach((element: any) => {
          const sourceValue = hasSource(element)
          if (sourceValue) {
            const ids = sourceValue.split(',')
            if (isOpenLink) {
              ids.forEach((id: any) => {
                const hasId = sourceList.find((item: any) =>
                  item?.citeList.includes(id)
                )
                if (hasId) {
                  lightList.push(hasId.search_id)
                }
              })
            } else {
              lightList = [...lightList, ...ids]
            }
          }
        })
      }
    } else {
      // 原有逻辑
      slide.elements.forEach((element: any) => {
        const sourceValue = hasSource(element)
        if (sourceValue) {
          const ids = sourceValue.split(',')
          if (isOpenLink) {
            ids.forEach((id: any) => {
              const hasId = sourceList.find((item: any) =>
                item?.citeList.includes(id)
              )
              if (hasId) {
                lightList.push(hasId.search_id)
              }
            })
          } else {
            lightList = [...lightList, ...ids]
          }
        }
      })
    }

    lightList = [...new Set(lightList)].sort((a, b) => a - b)
    return lightList
  }
  const hoveredElementId = (e: any) => {
    const targetElement = e.target
    const baseElement = targetElement.closest('.base-element')
    const className = baseElement?.className
    const match = className?.match(/base-element-([\w-]+)/)
    if (match) {
      const dynamicPart = match[1]
      mainStore.setHoverElementId(dynamicPart)
    }
  }
  // 通过id匹配element
  const findElementById = (id: string) => {
    const slide = currentSlide.value
    const element = slide?.elements.find((item: any) => {
      return item.id === id
    })
    return element
  }

  return {
    hasSource,
    finSlideSource,
    hoveredElementId,
    findElementById,
  }
}
