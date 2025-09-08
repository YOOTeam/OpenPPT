import { useSlidesStore } from '@/store'
import type { PPTElement, PPTElementLink } from '@/types/slides'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import message from '@/utils/message'
import { useI18n } from 'vue-i18n'
export default () => {
  const { t } = useI18n()
  const slidesStore = useSlidesStore()
  const { addHistorySnapshot } = useHistorySnapshot()
  // 添加方法
  const startsWithWWW = (str: string): boolean => {
    return str.startsWith('www.')
  }
  const setLink = (handleElement: PPTElement, link: PPTElementLink) => {
    const linkRegExp =
      /^(https?):\/\/[\w\-]+(\.[\w\-]+)+([\w\-.,@?^=%&:\/~+#]*[\w\-@?^=%&\/~+#])?$/
    if (link.type === 'web' && link.target) {
      if (startsWithWWW(link.target)) {
        link.target = 'https://' + link.target
      }
    }
    if (link.type === 'web' && !linkRegExp.test(link.target)) {
      message.error(t('canvas.errorLink'))
      return false
    }
    if (link.type === 'slide' && !link.target) {
      message.error(t('canvas.targetLink'))
      return false
    }
    const props = { link }
    slidesStore.updateElement({ id: handleElement.id, props })
    addHistorySnapshot()
    return true
  }

  const removeLink = (handleElement: PPTElement) => {
    slidesStore.removeElementProps({ id: handleElement.id, propName: 'link' })
    addHistorySnapshot()
  }

  return {
    setLink,
    removeLink,
  }
}
