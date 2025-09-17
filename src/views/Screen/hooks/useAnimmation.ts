import { nextTick, ref, watch } from 'vue'
import $ from 'jquery'
import { storeToRefs } from 'pinia'
import { throttle } from 'lodash'
import { useSlidesStore, useMainStore, useScreenStore } from '@/store'
import { KEYS } from '@/configs/hotkey'

/**
 * 屏幕动画相关的hook，处理演示过程中的元素动画效果
 * 主要用于根据交互类型为元素添加或移除动画样式类
 * @returns {Object} 包含动画处理函数的对象
 */
export default () => {
  // 获取各store实例
  const mainStore = useMainStore()
  const slidesStore = useSlidesStore()

  // 从store中解构出需要的响应式状态
  const { actionAnimation } = storeToRefs(mainStore) // 动画开关状态
  const { slides, slideIndex, currentSlide } = storeToRefs(slidesStore) // 幻灯片数据和当前索引

  const activeIndex = ref(-1)
  const filteredElements = ref<any[]>([])
  const excludeTypes = [
    'decoration',
    'pagedecorate',
    'bg',
    'decoration_text',
    'school_bg',
  ]

  watch(slideIndex, (newIndex, oldIndex) => {
    // 只有当索引实际变化且动画功能开启时才执行
    if (
      newIndex !== oldIndex &&
      currentSlide.value?.actionList?.interactionType !== 'none' &&
      currentSlide.value?.actionList?.interactionType !== 'clickEmphasize'
    ) {
      // 等待当前页面动画完成（与现有动画延迟时间保持一致）
      setTimeout(() => {
        // 计算当前页面的元素列表
        computeFilteredElements()
        // 如果有元素则高亮第一个
        if (filteredElements.value?.length > 0) {
          activeIndex.value = 0
          activeElement(filteredElements.value[0])
        }
      }, 800)
    }
  })

  watch(actionAnimation, (newVal, oldVal) => {})

  // 鼠标滚动翻页
  const mousewheelListeners = throttle(
    function (e: WheelEvent) {
      if (e.deltaY < 0) {
        // 向上滚动，切换到上一张幻灯片
        if (slideIndex.value > 0) {
          const newSlideIndex = slideIndex.value - 1
          slideIndex.value = newSlideIndex
          slidesStore.updateSlideIndex(newSlideIndex)
          activeIndex.value = -1
          if (
            currentSlide.value?.actionList?.interactionType !== 'none' &&
            currentSlide.value?.actionList?.interactionType !== 'clickEmphasize'
          ) {
            mainStore.setActionAnimation(false)
            setTimeout(() => {
              mainStore.setActionAnimation(true)
            }, 800)
          }
        }
      } else if (e.deltaY > 0) {
        // 向下滚动，切换到下一张幻灯片
        if (slideIndex.value < slides.value.length - 1) {
          const newSlideIndex = slideIndex.value + 1
          slideIndex.value = newSlideIndex
          slidesStore.updateSlideIndex(newSlideIndex)
          activeIndex.value = -1
          if (
            currentSlide.value?.actionList?.interactionType !== 'none' &&
            currentSlide.value?.actionList?.interactionType !== 'clickEmphasize'
          ) {
            mainStore.setActionAnimation(false)
            setTimeout(() => {
              mainStore.setActionAnimation(true)
            }, 800)
          }
        }
      }
      e.preventDefault()
      e.stopPropagation()
    },
    500,
    { leading: true, trailing: false }
  )
  // 绑定鼠标滚轮事件
  window.addEventListener('wheel', mousewheelListeners)
  // 解绑鼠标滚轮事件
  window.removeEventListener('wheel', mousewheelListeners)

  // 给过滤默认显示的元素，不删除actionAnimation的类名
  const removeDefaultElementAnimation = () => {
    // 获取当前幻灯片
    const slide = slides.value[slideIndex.value]
    // 如果幻灯片没有元素，则返回
    if (slide?.elements?.length === 0) return

    // 检查是否有defaultElementIds
    if (currentSlide.value?.actionList?.defaultElementIds?.length) {
      currentSlide.value.actionList.defaultElementIds.forEach(
        (elementId: string) => {
          const elRef: HTMLElement | null = document.querySelector(
            `#screen-element-${elementId}`
          )
          if (elRef) {
            elRef.classList.remove('actionAnimation')
            if (elRef.children[0]) {
              elRef.children[0].classList.remove('actionAnimation')
            }
          }
        }
      )
    }
  }

  /**
   * 为屏幕元素添加鼠标悬停效果处理
   * 绑定鼠标进入/离开事件，实现元素组的悬停状态同步
   * 支持基于groupId和group_index的元素组识别
   */
  const addHoverClass = () => {
    const $screen = $('.online-screen')
    // 先解绑已存在的事件，防止重复绑定
    $screen.off('mouseenter mouseleave', '.screen-element')

    // 使用事件委托统一处理所有元素的hover事件
    $screen.on('mouseenter', '.screen-element', handleMouseEnter)
    $screen.on('mouseleave', '.screen-element', handleMouseLeave)

    // 鼠标进入处理函数
    function handleMouseEnter() {
      const elementId = $(this).attr('id')?.replace('screen-element-', '')
      if (!elementId) return

      const element = slides.value[slideIndex.value]?.elements?.find(
        (el) => el.id === elementId
      )
      if (!element) return
      // 过滤掉excludeTypes类型的元素，并且过滤掉currentSlide.value.actionList.defaultElementIds类型的元素
      const hiddenAndDefaultIds = [
        ...(currentSlide.value?.actionList?.hiddenElementsIds || []),
        ...(currentSlide.value?.actionList?.defaultElementIds || []),
      ]
      const isHidden = hiddenAndDefaultIds.includes(elementId)
      if (isHidden) {
        return
      }

      const sameGroupIds = getSameGroupElementIds(element)
      sameGroupIds.forEach((id) => {
        const $targetElement = $(`#screen-element-${id}`)
        const targetElement = slides.value[slideIndex.value]?.elements?.find(
          (el) => el.id === id
        )
        const hiddenAndDefaultIds = [
          ...(currentSlide.value?.actionList?.hiddenElementsIds || []),
          ...(currentSlide.value?.actionList?.defaultElementIds || []),
        ]

        const isHidden = hiddenAndDefaultIds.includes(id)
        // 对于group元素（包括group_index），不检查excludeTypes
        const isGroupElement =
          element.groupId || element.tags?.custom?.group_index
        if (
          targetElement &&
          !isHidden &&
          !$targetElement.hasClass('actionAnimationShow')
        ) {
          $targetElement.addClass('hover')
        }
      })
    }

    // 鼠标离开处理函数
    function handleMouseLeave() {
      const elementId = $(this).attr('id')?.replace('screen-element-', '')
      if (!elementId) return

      const element = slides.value[slideIndex.value]?.elements?.find(
        (el) => el.id === elementId
      )
      if (!element) return

      // 对于group_index元素，不检查excludeTypes，确保能正确移除所有同组元素的悬停效果
      const sameGroupIds = getSameGroupElementIds(element)
      sameGroupIds.forEach((id) => {
        const targetElement = slides.value[slideIndex.value]?.elements?.find(
          (el) => el.id === id
        )
        // 对于group元素，不检查excludeTypes
        const isGroupElement =
          element.groupId || element.tags?.custom?.group_index
        if (
          targetElement &&
          (isGroupElement ||
            !excludeTypes.includes(targetElement?.tags?.custom?.shape_type))
        ) {
          $(`#screen-element-${id}`).removeClass('hover')
        }
      })
    }

    // 获取同组元素ID的辅助函数
    function getSameGroupElementIds(element: any) {
      // 先处理groupId
      if (element.groupId) {
        const sameGroupElements = slides.value[
          slideIndex.value
        ]?.elements.filter((el) => el.groupId === element.groupId)

        // 如果同组元素中存在group_index，则根据group_index进一步筛选
        if (element.tags?.custom?.group_index) {
          return sameGroupElements
            .filter(
              (el) =>
                el.tags?.custom?.group_index === element.tags.custom.group_index
            )
            .map((el) => el.id)
        }

        return sameGroupElements.map((el) => el.id)
      }
      // 没有groupId时，单独处理group_index情况
      else if (element.tags?.custom?.group_index) {
        return slides.value[slideIndex.value].elements
          .filter(
            (el) =>
              el.tags?.custom?.group_index === element.tags.custom.group_index
          )
          .map((el) => el.id)
      }
      // 普通元素
      return [element.id]
    }
  }
  /**
   * 计算当前幻灯片的有效元素列表
   * 过滤掉隐藏元素和不需要的元素类型
   * 过滤掉currentSlide.value.actionList.defaultElementIds类型的元素
   * 支持基于groupId和group_index的元素去重
   */
  const computeFilteredElements = () => {
    // 获取当前幻灯片
    const slide = slides.value[slideIndex.value]
    // 如果幻灯片没有元素，则返回
    if (slide?.elements?.length === 0) return
    const hiddenAndDefaultIds = [
      ...(currentSlide.value?.actionList?.hiddenElementsIds || []),
      ...(currentSlide.value?.actionList?.defaultElementIds || []),
    ]
    // 过滤不需要的元素
    if (hiddenAndDefaultIds.length !== 0) {
      const currentElementsIds = currentSlide.value?.elements.map(
        (item: any) => {
          return item.id
        }
      )
      const actionElemIds = currentElementsIds?.filter(
        (id: any) => !hiddenAndDefaultIds.includes(id)
      )
      filteredElements.value = slide?.elements
        ?.filter((el) => actionElemIds.includes(el.id))
        .filter(
          (() => {
            const seenGroupIds = new Set()
            const seenGroupIndexes = new Set()
            return (element: any) => {
              let keep = true
              // 按groupId去重
              if (element.groupId !== undefined) {
                const groupId = element.groupId
                if (seenGroupIds.has(groupId)) {
                  keep = false
                } else {
                  seenGroupIds.add(groupId)
                }
              }
              // 按group_index去重（仅当groupId检查通过时）
              if (keep && element.tags?.custom?.group_index !== undefined) {
                const groupIndex = element.tags.custom.group_index
                if (seenGroupIndexes.has(groupIndex)) {
                  keep = false
                } else {
                  seenGroupIndexes.add(groupIndex)
                }
              }
              return keep
            }
          })()
        )
    } else {
      filteredElements.value = slide?.elements
        ?.filter((element: any) => {
          return !excludeTypes.includes(element?.tags?.custom?.shape_type)
        })
        .sort((a: any, b: any) => {
          // 1. 优先处理shape_type=title的元素
          if (
            a.tags?.custom?.shape_type === 'title' &&
            b.tags?.custom?.shape_type !== 'title'
          ) {
            return -1
          }
          if (
            a.tags?.custom?.shape_type !== 'title' &&
            b.tags?.custom?.shape_type === 'title'
          ) {
            return 1
          }

          // 2.按group_index从小到大排序
          const groupIndexA = a.tags?.custom?.group_index
          const groupIndexB = b.tags?.custom?.group_index
          if (groupIndexA !== undefined && groupIndexB !== undefined) {
            return groupIndexA - groupIndexB
          }
          if (groupIndexA !== undefined) return -1
          if (groupIndexB !== undefined) return 1

          // 3. 其他元素按officeID从小到大排序
          return a.officeID - b.officeID
        })
        // 添加去重逻辑：保留首次出现的groupId和group_index
        .filter(
          (() => {
            const seenGroupIds = new Set()
            const seenGroupIndexes = new Set()
            return (element: any) => {
              let keep = true

              // 按groupId去重
              if (element.groupId !== undefined) {
                const groupId = element.groupId
                if (seenGroupIds.has(groupId)) {
                  keep = false
                } else {
                  seenGroupIds.add(groupId)
                }
              }
              // 按group_index去重（仅当groupId检查通过时）
              if (keep && element.tags?.custom?.group_index !== undefined) {
                const groupIndex = element.tags.custom.group_index
                if (seenGroupIndexes.has(groupIndex)) {
                  keep = false
                } else {
                  seenGroupIndexes.add(groupIndex)
                }
              }

              return keep
            }
          })()
        )
    }
    return filteredElements.value
  }

  /**
   * 激活元素的函数，添加动画效果
   * @param {any} targetElement - 目标元素，包含元素ID和其他属性
   */
  const activeElement = (targetElement: any) => {
    // 获取当前幻灯片
    const slide = slides.value[slideIndex.value]
    // 如果幻灯片没有元素，则返回
    if (slide?.elements?.length === 0) return
    // 过滤不需要的元素
    if (!targetElement) return

    // 使用nextTick确保DOM已更新

    // 先处理groupId
    if (targetElement.groupId) {
      // 查找同组所有元素
      let sameGroupElements = slide.elements.filter(
        (element: any) => element.groupId === targetElement.groupId
      )

      // 如果目标元素有group_index，则在同组元素中进一步筛选相同group_index的元素
      if (targetElement?.tags?.custom?.group_index) {
        sameGroupElements = sameGroupElements.filter(
          (element: any) =>
            element.tags?.custom?.group_index ===
            targetElement.tags.custom.group_index
        )
      }

      // 为筛选后的同组元素添加动画样式
      sameGroupElements.forEach((element: any) => {
        const elRef: HTMLElement | null = document.querySelector(
          `#screen-element-${element.id}`
        )
        if (elRef) {
          const elementId = elRef
            .getAttribute('id')
            ?.replace('screen-element-', '')
          const isHidden =
            currentSlide.value?.actionList?.hiddenElementsIds?.includes(
              elementId
            )
          // 对于groupId的元素，不检查excludeTypes
          if (!isHidden) {
            elRef.classList.add('actionAnimationShow')
            elRef.children[0].classList.add('actionAnimationStyle')
          }
        }
      })
    }
    // 没有groupId时，单独处理group_index标签的元素
    else if (targetElement?.tags?.custom?.group_index) {
      const sameGroupElements = slide.elements.filter(
        (element: any) =>
          element.tags?.custom?.group_index ===
          targetElement.tags.custom.group_index
      )
      sameGroupElements.forEach((element: any) => {
        const elRef: HTMLElement | null = document.querySelector(
          `#screen-element-${element.id}`
        )
        if (elRef) {
          const elementId = elRef
            .getAttribute('id')
            ?.replace('screen-element-', '')
          const isHidden =
            currentSlide.value?.actionList?.hiddenElementsIds?.includes(
              elementId
            )
          // 对于group_index的元素，不检查excludeTypes
          if (!isHidden) {
            elRef.classList.add('actionAnimationShow')
            elRef.children[0].classList.add('actionAnimationStyle')
          }
        }
      })
    }
    // 处理单个元素
    else {
      // 某些类型的元素不需要添加动画
      const addStyle = !excludeTypes.includes(
        targetElement?.tags?.custom?.shape_type
      )

      // 查找元素DOM并添加动画样式
      const elRef: HTMLElement | null = document.querySelector(
        `#screen-element-${targetElement.id}`
      )

      if (elRef && addStyle) {
        elRef.classList.add('actionAnimationShow')
        elRef.children[0].classList.add('actionAnimationStyle')
      }
    }
  }
  /**
   * 处理动画激活状态的函数
   * 根据不同的交互类型为元素添加动画样式
   * @param {string} [type] - 事件类型，如'click'
   * @param {any} [event] - 事件对象
   */
  const actionAnimationActive = (type?: string, event?: any) => {
    removeDefaultElementAnimation()
    if (
      currentSlide.value?.actionList?.interactionType !== 'none' &&
      currentSlide.value?.actionList?.interactionType !== 'clickEmphasize'
    ) {
      addHoverClass()
    }
    // 根据不同交互类型处理动画

    switch (currentSlide.value.actionList.interactionType) {
      case 'none': {
        actionAnimation.value = false
        mainStore.setActionAnimation(false)
        $('.screen-element')
          .find('.actionAnimation')
          .removeClass('actionAnimation')
        // 无交互类型，不执行任何动画
        break
      }
      case 'focusZoom': {
        // 焦点缩放交互：移除所有元素的动画样式
        $('.online-screen')
          .find('.actionAnimationStyle')
          .removeClass('actionAnimationStyle')
        $('.online-screen')
          .find('.actionAnimationHiddent')
          .removeClass('actionAnimationHiddent')
        $('.online-screen')
          .find('.actionAnimationShow')
          .removeClass('actionAnimationShow')

        computeFilteredElements()

        let activeElements: any = null
        // 如果是点击事件，尝试查找点击的元素

        if (type === 'click') {
          const target = event.target as HTMLElement
          const parent = target.closest('.screen-element')

          let elementId = parent?.getAttribute('id')
          const elementGroupId = parent?.getAttribute('groupid')
          if (elementId) {
            elementId = elementId.replace('screen-element-', '')
          }
          // 1.获取当前点击的元素的id匹配filteredElements.value中的id,如果找不到对应的id，则遍历filteredElements里面相同组的id
          const clickElementId = filteredElements.value.find((el: any) => {
            if (el.id === elementId) {
              return el.id
            }
            if (el.groupId === elementGroupId) {
              return el.id
            }
          })
          // 2.如果找到匹配的元素，设置其index为激活的index
          if (clickElementId) {
            activeIndex.value = filteredElements.value.indexOf(clickElementId)
          }
          console.log(activeIndex.value, 'activeIndex.value')
          // 3.激活当前元素
          activeElements = filteredElements.value[activeIndex.value]
          activeElement(activeElements)
        }
        // 存储当前要激活的元素

        const key = event?.key?.toUpperCase()
        switch (key) {
          case KEYS.UP: {
            // 添加边界检查，确保索引不会小于0
            activeIndex.value--
            if (activeIndex.value < 0) {
              if (
                currentSlide.value.actionList.interactionType !== 'none' &&
                currentSlide.value.actionList.interactionType !==
                  'clickEmphasize'
              ) {
                mainStore.setActionAnimation(false)
                setTimeout(() => {
                  mainStore.setActionAnimation(true)
                }, 800)
              }
              const newSlideIndex = slideIndex.value - 1
              if (slideIndex.value === 0) return
              slideIndex.value--
              slidesStore.updateSlideIndex(newSlideIndex)
              activeIndex.value = -1
            }
            // 向上切换元素，选择上一个元素
            activeElements = filteredElements.value[activeIndex.value]
            // 激活选中的元素
            activeElement(activeElements)
            break
          }
          case KEYS.DOWN: {
            // 添加边界检查，确保索引不会超过数组长度
            activeIndex.value++
            if (activeIndex.value + 1 > filteredElements.value.length) {
              if (
                currentSlide.value.actionList.interactionType !== 'none' &&
                currentSlide.value.actionList.interactionType !==
                  'clickEmphasize'
              ) {
                mainStore.setActionAnimation(false)
                setTimeout(() => {
                  mainStore.setActionAnimation(true)
                }, 800)
              }

              const newSlideIndex = slideIndex.value + 1
              if (slideIndex.value === slides.value.length - 1) return
              slideIndex.value++
              slidesStore.updateSlideIndex(newSlideIndex)
              activeIndex.value = -1
            }
            // 向下切换元素，选择下一个元素
            activeElements = filteredElements.value[activeIndex.value]
            // 激活选中的元素
            activeElement(activeElements)

            break
          }
          case KEYS.LEFT:
            {
              const newSlideIndex = slideIndex.value - 1
              if (slideIndex.value === 0) return
              slideIndex.value--
              activeIndex.value = -1
              slidesStore.updateSlideIndex(newSlideIndex)
              if (
                currentSlide.value.actionList.interactionType !== 'none' &&
                currentSlide.value.actionList.interactionType !==
                  'clickEmphasize'
              ) {
                mainStore.setActionAnimation(false)
                setTimeout(() => {
                  mainStore.setActionAnimation(true)
                }, 800)
              }
            }
            break
          case KEYS.RIGHT:
            {
              const newSlideIndex = slideIndex.value + 1
              if (slideIndex.value === slides.value.length - 1) return
              slideIndex.value++
              activeIndex.value = -1
              slidesStore.updateSlideIndex(newSlideIndex)
              if (
                currentSlide.value.actionList.interactionType !== 'none' &&
                currentSlide.value.actionList.interactionType !==
                  'clickEmphasize'
              ) {
                mainStore.setActionAnimation(false)
                setTimeout(() => {
                  mainStore.setActionAnimation(true)
                }, 800)
              }
            }
            break
          case KEYS.SPACE:
            {
              const newSlideIndex = slideIndex.value + 1
              if (slideIndex.value === slides.value.length - 1) return
              slideIndex.value++
              activeIndex.value = -1
              slidesStore.updateSlideIndex(newSlideIndex)
              if (
                currentSlide.value.actionList.interactionType !== 'none' &&
                currentSlide.value.actionList.interactionType !==
                  'clickEmphasize'
              ) {
                mainStore.setActionAnimation(false)
                setTimeout(() => {
                  mainStore.setActionAnimation(true)
                }, 800)
              }
              // 阻止事件传播和默认行为
              event?.stopPropagation()
              event?.preventDefault()
            }
            break
          default: {
            break
          }
        }
        break
      }
      case 'clickEmphasize':
      case 'clickZoom': {
        // 点击缩放交互：先移除所有元素的动画样式
        $('.online-screen')
          .find('.actionAnimationStyle')
          .removeClass('actionAnimationStyle')
        $('.online-screen')
          .find('.actionAnimationHiddent')
          .removeClass('actionAnimationHiddent')
        $('.online-screen')
          .find('.actionAnimationShow')
          .removeClass('actionAnimationShow')

        addHoverClass()
        // 获取当前幻灯片
        const slide = slides.value[slideIndex.value]
        // 如果幻灯片没有元素，则返回
        if (slide?.elements?.length === 0) return

        // 查找文本元素（优先查找标题类型）
        let textElements = null
        textElements = slide.elements.find(
          (element: any) => element?.tags?.custom?.shape_type === 'title'
        )

        // 如果是点击事件，尝试查找点击的元素
        if (type === 'click') {
          // 如果是默认元素，直接返回

          const target = event.target as HTMLElement
          const parent = target.closest('.screen-element')
          let elementId = parent?.getAttribute('id')

          if (elementId) {
            elementId = elementId.replace('screen-element-', '')
            if (
              currentSlide.value?.actionList?.defaultElementIds?.includes(
                elementId
              )
            ) {
              return
            }
            textElements = slide?.elements.find(
              (el: any) => el.id === elementId
            )
          }
        }

        // 如果没找到标题元素，则查找第一个文本元素
        if (!textElements) {
          textElements = slide.elements.find(
            (element: any) => element?.type === 'text'
          )
        }

        // 如果找到文本元素，则为其添加动画样式
        if (textElements) {
          // 使用nextTick确保DOM已更新
          nextTick(() => {
            // 处理组元素
            if (textElements?.groupId) {
              // 查找同组所有元素
              const sameGroupElements = slide.elements.filter(
                (element: any) => element.groupId === textElements.groupId
              )
              // 为同组元素添加动画样式
              sameGroupElements.forEach((element: any) => {
                const elRef: HTMLElement | null = document.querySelector(
                  `#screen-element-${element.id}`
                )
                const elementId = elRef
                  ?.getAttribute('id')
                  ?.replace('screen-element-', '')
                const isHidden =
                  currentSlide.value?.actionList?.hiddenElementsIds?.includes(
                    elementId
                  )
                if (elRef && !isHidden) {
                  elRef.classList.add('actionAnimationShow')
                  elRef.classList.remove('hover')
                  elRef.children[0].classList.add('actionAnimationStyle')
                }
              })
            }
            // 处理具有group_index标签的元素
            else if (textElements?.tags?.custom?.group_index) {
              const sameGroupElements = slide.elements.filter(
                (element: any) =>
                  element.tags?.custom?.group_index ===
                  textElements.tags.custom.group_index
              )
              sameGroupElements.forEach((element: any) => {
                const elRef: HTMLElement | null = document.querySelector(
                  `#screen-element-${element.id}`
                )
                const elementId = elRef
                  ?.getAttribute('id')
                  ?.replace('screen-element-', '')
                const isHidden =
                  currentSlide.value?.actionList?.hiddenElementsIds?.includes(
                    elementId
                  )
                if (elRef && !isHidden) {
                  elRef.classList.add('actionAnimationShow')
                  elRef.classList.remove('hover')
                  elRef.children[0].classList.add('actionAnimationStyle')
                }
              })
            }
            // 处理单个元素
            else {
              // 某些类型的元素不需要添加动画
              const key = [
                'decoration',
                'pagedecorate',
                'bg',
                'decoration_text',
                'school_bg',
              ]
              const addStyle = !key.includes(
                textElements?.tags?.custom?.shape_type
              )

              // 查找元素DOM并添加动画样式
              const elRef: HTMLElement | null = document.querySelector(
                `#screen-element-${textElements.id}`
              )
              const elementId = elRef
                ?.getAttribute('id')
                ?.replace('screen-element-', '')
              const isHidden =
                currentSlide.value?.actionList?.hiddenElementsIds?.includes(
                  elementId
                )
              if (elRef && addStyle && !isHidden) {
                elRef.classList.add('actionAnimationShow')
                elRef.classList.remove('hover')
                elRef.children[0].classList.add('actionAnimationStyle')
              }
            }
          })
        }
        break
      }
      default:
        break
    }
  }

  // 返回动画处理函数
  return {
    actionAnimationActive,
    addHoverClass,
  }
}
