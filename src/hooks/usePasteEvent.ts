import { onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import { getImageDataURL } from '@/utils/image'
import usePasteTextClipboardData from './usePasteTextClipboardData'
import useCreateElement from './useCreateElement'
import message from '@/utils/message'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import { onUploads } from '@/utils/upload'
import useSvgStyle from '@/hooks/useSvgStyle'
import useThemeFileTemplate from '@/hooks/useThemeFileTemplate'
import $ from 'jquery'
import { fetchUrl, isSvgUrl, isSvgHtml } from '@/utils/common'
export default () => {
  const {
    editorAreaFocus,
    thumbnailsFocus,
    disableHotkeys,
    handleElement,
    handleElementId,
    userToken,
  } = storeToRefs(useMainStore())
  const slidesStore = useSlidesStore()
  const { viewportRatio, viewportSize } = storeToRefs(slidesStore)
  const { returnNewShape, changeShape } = useSvgStyle()
  const { replaceImg, replaceOnlyImg } = useThemeFileTemplate()
  const { pasteTextClipboardData } = usePasteTextClipboardData()
  const { createImageElement, createShapeElement } = useCreateElement()
  const { addHistorySnapshot } = useHistorySnapshot()
  // 粘贴图片到幻灯片元素
  const pasteImageFile = (imageFile: File) => {
    getImageDataURL(imageFile).then((dataURL) => createImageElement(dataURL))
  }

  /**
   * 粘贴事件监听
   * @param e ClipboardEvent
   */
  const pasteListener = async (e: ClipboardEvent) => {
    if (!editorAreaFocus.value && !thumbnailsFocus.value) return

    if (disableHotkeys.value) return

    if (!e.clipboardData) return

    const clipboardDataItems = e.clipboardData.items
    const clipboardDataFirstItem = clipboardDataItems[0]

    if (!clipboardDataFirstItem) return

    // 如果剪贴板内有图片，优先尝试读取图片
    for (const item of clipboardDataItems) {
      if (userToken.value) {
        if (item.kind === 'file' && item.type.indexOf('image') !== -1) {
          const imageFile = item.getAsFile()
          if (handleElement.value) {
            const res = await onUploads(imageFile, 'image')
            if (res?.url) {
              if (handleElement.value.type === 'image') {
                const item = await replaceImg(handleElement.value, res.url)
                const props = item.value
                slidesStore.updateElement({ id: handleElementId.value, props })
                message.closeAll()
                addHistorySnapshot()
                return
              }
              if (
                handleElement.value.type === 'shape' &&
                handleElement.value.fillPicture?.src
              ) {
                const item = await replaceOnlyImg(handleElement.value, res.url)
                const props = item.value
                slidesStore.updateElement({ id: handleElementId.value, props })
                message.closeAll()
                addHistorySnapshot()
                return
              }
            }
            addHistorySnapshot()
            return
          }
          if (imageFile) pasteImageFile(imageFile)
          addHistorySnapshot()
          return
        }
      } else {
        if (item.kind === 'file' && item.type.indexOf('image') !== -1) {
          const imageFile = item.getAsFile()
          if (imageFile) pasteImageFile(imageFile)
          return
        }
      }
    }
    const event = e

    // 如果剪贴板内没有图片，但有文字内容，尝试解析文字内容
    if (
      clipboardDataFirstItem.kind === 'string' &&
      clipboardDataFirstItem.type === 'text/plain'
    ) {
      clipboardDataFirstItem.getAsString((text) => {
        if (isSvgUrl(text) || isSvgHtml(text)) {
          if (handleElement.value?.type === 'shape') {
            pasteSvg(event, text)
          } else if (!handleElement.value) {
            pasteSvg(event, text, 'create')
          }
        } else {
          pasteTextClipboardData(text)
        }
      })
    }
    if (
      clipboardDataFirstItem.kind === 'string' &&
      clipboardDataFirstItem.type === 'text/html'
    ) {
      clipboardDataFirstItem.getAsString((text) => {
        const parser = new DOMParser()
        const doc = parser.parseFromString(text as any, 'text/html')
        const link = $(doc.body).find('a').attr('href')
        pasteTextClipboardData(link as any)
      })
    }
  }

  const pasteSvg = async (event: any, text: string, type?: string) => {
    try {
      let content: any = ''
      if (isSvgUrl(text)) {
        content = await fetchUrl(text)
      } else {
        content = text.replace(/\\"/g, '"').replace(/\\n/g, '\n')
      }
      const shape = returnNewShape(content)
      if (type === 'create') {
        const position = {
          width: 100,
          height: 100,
          left: (viewportSize.value - 100) / 2,
          top: (viewportSize.value * viewportRatio.value - 100) / 2,
        }
        createShapeElement(position, shape, { attrArry: shape.attrArry || [] })
      } else {
        changeShape(shape)
      }
    } catch (error) {
      message.error('粘贴内容错误')
    }
  }

  onMounted(() => {
    document.addEventListener('paste', pasteListener)
  })
  onUnmounted(() => {
    document.removeEventListener('paste', pasteListener)
  })
}
