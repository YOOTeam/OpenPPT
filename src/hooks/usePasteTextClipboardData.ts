import { storeToRefs } from 'pinia'
import { useKeyboardStore, useMainStore, useSlidesStore } from '@/store'
import { pasteCustomClipboardString } from '@/utils/clipboard'
import { parseText2Paragraphs } from '@/utils/textParser'
import { getImageDataURL, isSVGString, svg2File } from '@/utils/image'
import { isValidURL, isHtmlString } from '@/utils/common'
import useCreateElement from '@/hooks/useCreateElement'
import useAddSlidesOrElements from '@/hooks/useAddSlidesOrElements'
import { onUploads } from '@/utils/upload'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import { getHtmladd } from '@/api/careate'

interface PasteTextClipboardDataOptions {
  onlySlide?: boolean
  onlyElements?: boolean
}

/**
 * 判断图片URL字符串
 *
 * ！！！注意，你需要判断允许哪些来源的图片地址被匹配，然后自行编写正则表达式
 * ！！！必须确保图片来源都是合法、可靠、可控、无访问限制的
 */
const isValidImgURL = (url: string) => {
  return /^https:\/\/ChatPPT.cn(\/[\w-./?%&=]*)?\.(jpg|jpeg|png|svg|webp)(\?.*)?$/i.test(
    url
  )
}

export default () => {
  const { shiftKeyState } = storeToRefs(useKeyboardStore())
  const { handleElement, handleElementId, userToken } = storeToRefs(
    useMainStore()
  )

  const { createTextElement, createImageElement, createWebElement } =
    useCreateElement()
  const { addElementsFromData, addSlidesFromData } = useAddSlidesOrElements()
  const slidesStore = useSlidesStore()
  const { addHistorySnapshot } = useHistorySnapshot()
  /**
   * 粘贴普通文本：创建为新的文本元素
   * @param text 文本
   */
  const createTextElementFromClipboard = (text: string) => {
    createTextElement(
      {
        left: 0,
        top: 0,
        width: 600,
        height: 50,
      },
      { content: text }
    )
  }

  /**
   * 解析剪贴板内容，根据解析结果选择合适的粘贴方式
   * @param text 剪贴板内容
   * @param options 配置项：onlySlide -- 仅处理页面粘贴；onlyElements -- 仅处理元素粘贴；
   */
  const pasteTextClipboardData = async (
    text: string,
    options?: PasteTextClipboardDataOptions
  ) => {
    const onlySlide = options?.onlySlide || false
    const onlyElements = options?.onlyElements || false
    const clipboardData = pasteCustomClipboardString(text)

    // 元素或页面
    if (typeof clipboardData === 'object') {
      const { type, data } = clipboardData

      if (type === 'elements' && !onlySlide) addElementsFromData(data)
      else if (type === 'slides' && !onlyElements) addSlidesFromData(data)
    }

    // 普通文本
    else if (!onlyElements && !onlySlide) {
      // 普通文字
      if (shiftKeyState.value) {
        const string = parseText2Paragraphs(clipboardData)
        createTextElementFromClipboard(string)
      } else {
        // 尝试检查是否为图片地址链接
        if (isValidImgURL(clipboardData)) {
          createImageElement(clipboardData)
          addHistorySnapshot()
        }
        // 尝试检查是否为超链接
        else if (isValidURL(clipboardData)) {
          if (handleElement.value?.type === 'iframe') {
            const props = { src: clipboardData }
            slidesStore.updateElement({ id: handleElementId.value, props })
            addHistorySnapshot()
          } else {
            createTextElementFromClipboard(
              `<a href="${clipboardData}" title="${clipboardData}" target="_blank">${clipboardData}</a>`
            )
          }
        }
        // 尝试检查是否为SVG代码
        else if (isSVGString(clipboardData)) {
          const file = svg2File(clipboardData)
          getImageDataURL(file).then((dataURL) => createImageElement(dataURL))
        }
        // 尝试检查是否为html或htm代码
        else if (isHtmlString(clipboardData)) {
          const htmlStr = clipboardData
            .replace('```html', '')
            .replace('```', '')
            .trim()
          const blob = new Blob([htmlStr], { type: 'text/html' })
          const file = new File([blob], `${clipboardData}.html`, {
            type: 'text/html',
            lastModified: new Date().getTime(),
          })

          const res: any = await onUploads(file, 'htmlFile', '', {
            'Content-Type': 'text/html',
          })
          if (!res?.url) return { code: 500 }
          const title = htmlStr.match(/<title>(.*?)<\/title>/i)?.[1]
          const props = {
            src: res?.url,
          }
          const resAdd: any = await getHtmladd({
            file_key: res?.url,
            name: title || '自定义网页',
          })
          if (resAdd?.code === 200) {
            slidesStore.updateElement({ id: handleElementId.value, props })
          }
          if (!handleElement.value) {
            createWebElement(res?.url, '600', '500', 'none')
          }
          addHistorySnapshot()
        }
        // 普通文字
        else {
          const string = parseText2Paragraphs(clipboardData)
          createTextElementFromClipboard(string)
        }
      }
    }
  }

  return {
    pasteTextClipboardData,
  }
}
