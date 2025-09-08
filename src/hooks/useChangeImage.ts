/**
 * 图片替换处理Hook
 *
 * 功能描述：
 * 1. 处理聊天结果中的图片替换指令
 * 2. 支持三种图片处理模式：文本生成图片、图片搜索、定向生成
 * 3. 支持三种作用范围：全部幻灯片、指定幻灯片、指定元素
 * 4. 提供单个元素的图片处理功能
 *
 * 主要API：
 * - handleRunChatResult: 批量处理聊天结果中的图片替换
 * - handleGenerateImage: 为当前选中元素生成新图片
 * - handleSearchImage: 基于当前图片搜索相似图片
 */

import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import useThemeFileTemplate from '@/hooks/useThemeFileTemplate'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'

export default () => {
  const {
    replaceImg,
    getImageApi,
    replaceOnlyImg,
    filleImageUrlToElementToContent,
  } = useThemeFileTemplate()

  const slideStore = useSlidesStore()
  const mainStore = useMainStore()

  const { slides, slideIndex } = storeToRefs(slideStore)
  const { handleElement, handleElementId } = storeToRefs(mainStore)
  const { addHistorySnapshot } = useHistorySnapshot()

  /**
   * 为当前选中的图片元素生成新图片
   *
   * 处理流程：
   * 1. 验证选中元素是否为图片类型
   * 2. 设置加载状态（显示加载动画）
   * 3. 从当前元素和关联元素中提取文本描述
   * 4. 调用AI接口生成新图片
   * 5. 更新图片链接并清除加载状态
   * 6. 添加历史快照支持撤销
   *
   * 错误处理：
   * - 网络错误时清除加载状态
   * - 无文本描述时抛出错误
   * - 图片生成失败时保持原图片
   */
  const handleGenerateImage = async () => {
    slideStore.updateElement({
      id: handleElementId.value,
      props: { imgResect: true },
    })

    try {
      const currentSlide = slides.value.find((slide) =>
        slide.elements.some((el) => el.id === handleElementId.value)
      )
      if (!currentSlide) {
        throw new Error('未找到包含该元素的幻灯片')
      }
      const { text, content } = filleImageUrlToElementToContent(
        handleElement.value,
        currentSlide.elements
      )
      if (!text) throw new Error('无法获取生成文本')
      const imgRes = await getImageApi(text, content, content, 'textToImage')
      const img = imgRes[0]
      if (!img) throw new Error('获取图片链接失败')

      if (handleElement.value?.type === 'shape') {
        slideStore.updateElement({
          id: handleElementId.value,
          props: {
            fillPicture: { ...handleElement.value.fillPicture, src: img },
            imgResect: false,
          },
        })
      }
      // 仅更新图片链接，保持其他属性不变
      slideStore.updateElement({
        id: handleElementId.value,
        props: { src: img, imgResect: false },
      })
      addHistorySnapshot()
    } catch (error) {
      if (handleElementId.value) {
        slideStore.updateElement({
          id: handleElementId.value,
          props: { imgResect: false },
        })
      }
    }
  }

  /**
   * 基于当前图片搜索相似图片
   *
   * 处理流程：
   * 1. 使用当前图片URL作为搜索关键词
   * 2. 调用图片搜索API
   * 3. 替换为搜索结果中的第一张图片
   *
   * 适用场景：用户想要替换为风格相似的图片
   */
  const handleSearchImage = async () => {
    slideStore.updateElement({
      id: handleElementId.value,
      props: { imgResect: true },
    })

    try {
      if (handleElement.value?.src) {
        const text = handleElement.value?.src
        if (!text) throw new Error('图片地址为空')

        const imgRes = await getImageApi(text, '', '', 'imageToImage')
        const img = imgRes[0]
        if (!img) throw new Error('获取图片链接失败')

        slideStore.updateElement({
          id: handleElementId.value,
          props: { src: img, imgResect: false },
        })
        addHistorySnapshot()
      } else {
        const text = handleElement.value?.fillPicture.src
        if (!text) throw new Error('图片地址为空')

        const imgRes = await getImageApi(text, '', '', 'imageToImage')
        console.log(imgRes)
        const img = imgRes[0]
        if (!img) throw new Error('获取图片链接失败')
        console.log(handleElement.value?.fillPicture)
        slideStore.updateElement({
          id: handleElementId.value,
          props: {
            fillPicture: { ...handleElement.value?.fillPicture, src: img },
            imgResect: false,
          },
        })
        addHistorySnapshot()
      }
    } catch (error) {
      if (handleElementId.value) {
        slideStore.updateElement({
          id: handleElementId.value,
          props: { imgResect: false },
        })
      }
    }
  }

  /**
   * 处理聊天结果并执行图片替换的主函数
   *
   * 功能概述：
   * - 接收聊天机器人的图片替换指令
   * - 支持批量处理多个幻灯片的图片替换
   * - 提供三种处理范围和三种生成模式
   * - 实时显示处理进度和结果
   *
   * 数据结构：
   * - data.acion_type: 作用范围 ('all_slide' | 'specify_slide' | 'specify_shape')
   * - data.create_image_type: 生成模式 ('generate' | 'search' | 'directional')
   * - data.action_objs: 目标对象数组，包含slideId和elements
   * - data.image_style: 图片风格配置
   * - data.theme: 主题文本（定向模式使用）
   *
   * 处理流程：
   * 1. 解析聊天结果配置
   * 2. 确定目标幻灯片和元素
   * 3. 设置加载状态
   * 4. 逐个处理幻灯片
   * 5. 更新结果并通知前端
   * 6. 添加历史快照
   *
   * @param {any} data - 聊天请求参数，包含图片替换配置
   */
  const handleRunChatResult = async (data: any) => {
    const imageStrategies: any = {
      generate: {
        /**
         * 文本生成图片策略
         * 根据元素中的文本描述生成新图片
         * @param {string} text - 图片描述文本
         * @param {any} content - 上下文内容
         * @param {any} pptstyle - PPT样式配置
         * @returns {Promise<any>} - 图片URL和相关信息
         */
        getImage: (text: string, content: any, pptstyle: any) =>
          getImageApi(text, content, content, 'textToImage', pptstyle),
      },
      search: {
        /**
         * 图片搜索策略
         * 基于现有图片搜索相似图片
         * @param {string} text - 搜索关键词（图片URL）
         * @param {any} content - 上下文内容
         * @param {any} pptstyle - PPT样式配置
         * @returns {Promise<any>} - 图片URL和相关信息
         */
        getImage: (text: string, content: any, pptstyle: any) =>
          getImageApi(text, content, content, 'imageToImage', pptstyle),
      },
      directional: {
        /**
         * 定向生成图片策略
         * 基于主题生成风格一致的图片
         * @param {string} text - 主题文本
         * @param {any} content - 上下文内容
         * @param {any} pptstyle - PPT样式配置
         * @returns {Promise<any>} - 图片URL和相关信息
         */
        getImage: (text: string, content: any, pptstyle: any) =>
          getImageApi(text, content, content, 'documentToImage', pptstyle),
      },
    }

    /**
     * 处理单张幻灯片的公共函数
     *
     * 功能：
     * - 遍历幻灯片中的所有元素
     * - 根据配置判断是否需要替换
     * - 执行图片替换操作
     * - 处理错误情况
     *
     * @param {any} slide - 幻灯片对象
     * @param {any} strategy - 图片处理策略对象
     * @returns {Promise<any>} - 处理后的幻灯片对象
     */
    const processSlide = async (slide: any, strategy: any) => {
      const updatedElements = await Promise.all(
        slide.elements.map(async (item: any) => {
          if (item.type !== 'image' && item.type !== 'shape') return item

          const allElementIds =
            data?.action_objs.flatMap((obj: any) => obj.elements || []) || []

          const shouldReplace = allElementIds.includes(item.id)

          if (!shouldReplace) return item

          let text: string
          let content: string
          let pptstyle: any

          if (data.create_image_type === 'generate') {
            text =
              filleImageUrlToElementToContent(item, slide.elements).text ||
              '随机'
            content = filleImageUrlToElementToContent(
              item,
              slide.elements
            ).content
            pptstyle = data.image_style
          } else if (data.create_image_type === 'search') {
            if (item.type === 'image') {
              text = item?.src
            }
            if (item.type === 'shape') {
              text = item?.fillPicture?.src
            }
            content = ''
            pptstyle = data.image_style
          } else {
            text = data?.theme
            content = ''
            pptstyle = data.image_style
          }

          if (!text) return item

          // 执行图片替换
          try {
            const imgRes = await strategy.getImage(text, content, pptstyle)
            if (item.type === 'image') {
              const replacedItem = await replaceImg(item, ...imgRes)
              return replacedItem
            }
            if (item.type === 'shape') {
              const replacedItem = await replaceOnlyImg(item, ...imgRes)
              return replacedItem
            }
          } catch (error) {
            console.error('图片替换失败:', error)
            return item
          }
        })
      )

      return { ...slide, elements: updatedElements }
    }

    const strategy: any = imageStrategies[data?.create_image_type]
    if (!strategy) return

    let targetSlides: any[] = []
    const targetSlideIds =
      data?.action_objs.map((obj: any) => obj.slideId) || []

    const targetElementIds =
      data?.action_objs.flatMap((obj: any) => obj.elements || []) || []

    if (data.acion_type === 'specify_slide') {
      targetSlides = slides.value.filter((slide) =>
        targetSlideIds.includes(slide.id)
      )
    } else if (data.acion_type === 'specify_shape') {
      targetSlides = slides.value.filter((slide) =>
        slide.elements.some((el) => targetElementIds.includes(el.id))
      )
    } else {
      targetSlides = [...slides.value]
    }

    if (targetSlides.length === 0) {
      console.warn('未找到需要处理的目标幻灯片')
      return
    }

    const updatedSlides = slides.value.map((slide) => {
      if (!targetSlides.some((t) => t.id === slide.id)) return slide

      return {
        ...slide,
        elements: slide.elements.map((item) => {
          const shouldReplace = targetElementIds.includes(item.id)

          if (shouldReplace) {
            return { ...item, imgResect: true }
          }
          return item
        }),
      }
    })

    slides.value = updatedSlides

    const processedSlides: any = []
    const slidesStore = useSlidesStore()
    for (const [index, slide] of targetSlides.entries()) {
      const slideIndex = slides.value.findIndex((s) => s.id === slide.id)
      mainStore.setActiveGroupElementId('')
      mainStore.setActiveElementIdList([])
      slidesStore.updateSlideIndex(slideIndex)
      const processedSlide = await processSlide(slide, strategy)
      processedSlides.push(processedSlide)
    }

    const finalSlides = slides.value.map((slide) => {
      const processed = processedSlides.find((p) => p.id === slide.id)
      return processed || slide
    })

    slides.value = finalSlides

    addHistorySnapshot()
  }

  return {
    handleRunChatResult,
    handleGenerateImage,
    handleSearchImage,
  }
}
