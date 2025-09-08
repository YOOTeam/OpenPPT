import { storeToRefs } from 'pinia'
import useExport from '@/hooks/useExport'
import { useMainStore, useSlidesStore } from '@/store'
import { onUploads } from '@/utils/upload'

export default () => {
  const mainStore = useMainStore()
  const slidesStore = useSlidesStore()
  const { slides, title } = storeToRefs(slidesStore)
  const { exportApiToJSON } = useExport()

  const getJSONData = async (data?: any, sessionStorageData?: any) => {
    let datajson = null
    if (data) {
      datajson = Array.isArray(data) ? exportApiToJSON(data) : data
    } else {
      datajson = slides.value?.length ? exportApiToJSON(slides.value) : null
    }
    if (!datajson) return
    if (!sessionStorageData) {
      const blob = new Blob([JSON.stringify(datajson)], {
        type: 'application/json',
      })
      const file = new File([blob], `${title.value}.json`, {
        type: 'application/json',
      })

      let type = 'onlineEditorJson'

      const res: any = await onUploads(file, type)
      if (!res?.url) return { code: 500 }
      mainStore.setChatInfo({
        toChatData: {
          ppt_json: res.url,
        },
      })
    }
  }
  return {
    getJSONData,
  }
}
