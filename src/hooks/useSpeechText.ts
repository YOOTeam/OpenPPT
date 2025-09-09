import { storeToRefs } from 'pinia'
import { useSlidesStore, useMainStore } from '@/store'
import {
  createnote,
  getRunChat,
  translateText,
  selectNote,
} from '@/api/careate'
import { onUploads } from '@/utils/upload'
import useExport from '@/hooks/useExport'
import { ref, onBeforeUnmount, watch, computed } from 'vue'
import message from '@/utils/message'
import useSaveJSON from '@/hooks/useSaveJSON'
import { nanoid } from 'nanoid'
import { cancelRequestsWithPrefix } from '@/utils/HttpRequest'
import CryptoJS from 'crypto-js'
import { useI18n } from 'vue-i18n'
export default () => {
  const { t } = useI18n()
  const { saveJSONData, userCanSave } = useSaveJSON()

  const { exportApiToJSON } = useExport()
  const mainStore = useMainStore()
  const slidesStore = useSlidesStore()
  const lang = localStorage.getItem('lang')
  const { createLoading, useFileId, useInfo, sceneData } =
    storeToRefs(mainStore)

  const { slideIndex, slides, currentSlide, title } = storeToRefs(slidesStore)

  const optcityType = ref(1)
  const nodesList = ref<any[]>([])
  const updateAll = ref(true)
  let count = 0
  const moldSreve = ref(2)

  const returnJsonUrl = async () => {
    const json = exportApiToJSON(slides.value)
    const blob = new Blob([JSON.stringify(json)], {
      type: 'application/json',
    })
    const file = new File([blob], `${title.value}.json`, {
      type: 'application/json',
    })
    let type = 'onlineEditorJson'

    const res: any = await onUploads(file, type)
    return res
  }

  const hasTextContent = (htmlString: string) => {
    const tempDiv: any = document.createElement('div')
    tempDiv.innerHTML = htmlString
    return !tempDiv.textContent.trim()
  }

  const createSpeechData: any = ref({})

  /**
   * 创建演讲
   * @param type 1:生成时 2:点击按钮 或者 chat指令
   * @param isSingle 是否创建所有页
   * @param url json文件地址
   * @param
   */
  const handleCreateSpeech = async (
    type: number,
    isSingle?: boolean,
    url?: string
  ) => {
    let jsonUrl: any = ''
    optcityType.value = type
    updateAll.value = !isSingle
    nodesList.value = []
    count = 0
    clearInterval(jsonDataApiTimer.value)
    jsonDataTime.value = 0
    createSpeechData.value = {
      status: 'start',
      count: 1,
    }
    if (type === 2) {
      mainStore.setShowLoadingMarks(true)
      mainStore.setInitDataTotal(slides.value.length)
      const message = isSingle ? t('speack.tips1') : t('speack.tips2')
      const data: any = {
        tips: message,
        showClose: true,
        isclose: false,
        height: null,
        noshow: false,
      }
      if (isSingle) {
        data.noshow = true
      }
      mainStore.setCreateLoading(data)
      if (!isSingle) {
        for (let index = 0; index < slides.value.length; index++) {
          await delay(100)
          slidesStore.updateSlideIndex(index)
        }
        slidesStore.updateSlideIndex(0)
      }
      const res = await returnJsonUrl()
      jsonUrl = res?.url
    } else {
      jsonUrl = url
    }

    const params: any = {
      url: jsonUrl,
      type: type === 3 ? 2 : type,
      id: useFileId.value,
    }
    if (!useFileId.value) {
      // 测试环境 默认ppt的文件id
      if (
        import.meta.env.VUE_APP_CURRENTMODE === 'dev' ||
        import.meta.env.VUE_APP_CURRENTMODE === 'test'
      ) {
        params.id = 'nu5hhztTNM'
      } else {
        // 正式环境 默认ppt的文件id
        params.id = 'BztQDmtV58'
      }
    }
    if (isSingle) {
      params.page = slideIndex.value + 1
      params.slide_ids = [currentSlide.value.id]
    }

    params.scene = sceneData?.value?.scene || 'normal'
    const nodeRes: any = await createnote(params)
    if (nodeRes.code === 200) {
      if (type === 2) {
        mainStore.setCreateLoading({
          tips: isSingle ? t('speack.tips3') : t('speack.tips1'),
        })
      }

      getJsonDataInfo(useFileId.value)
      if (type === 2) {
        selectNote({
          page: slidesStore.slides.length,
        })
      } else {
        selectNote({
          page: 1,
        })
      }
    } else {
      createSpeechData.value.status = 'error'
      mainStore.setShowLoadingMarks(false)
    }
  }

  // 防止chat/info接口拿不到数据一直请求问题 超过5分钟就不要在请求
  const jsonDataApiTimer: any = ref(null)
  const jsonDataTime = ref(0)
  const initJsonTime = () => {
    jsonDataApiTimer.value = setInterval(() => {
      jsonDataTime.value += 1000
    }, 1000)
  }

  // chatppt 解析ppt接口 是异步行为  需要轮训
  const getJsonDataInfo = async (id?: string) => {
    count += 1
    // 提示语c
    if (optcityType.value === 2) {
      const message = count > 4 ? t('speack.tips4') : t('speack.tips3')
      mainStore.setCreateLoading({
        tips: message,
      })
    }
    if (!useFileId.value) {
      // 测试环境 默认ppt的文件id
      if (
        import.meta.env.VUE_APP_CURRENTMODE === 'dev' ||
        import.meta.env.VUE_APP_CURRENTMODE === 'test'
      ) {
        id = 'nu5hhztTNM'
      } else {
        // 正式环境 默认ppt的文件id
        id = 'BztQDmtV58'
      }
    }
    const res: any = await getRunChat({ request_id: id })
    mainStore.setActiveElementIdList([])
    mainStore.setHandleElementId('')
    try {
      // note_status = 2 时表示完成轮训
      if (res.data?.note_status == '1') {
        if (res.data?.content?.note?.length) {
          await initNotes(res.data?.content, res.data?.note_status)
          clearInterval(jsonDataApiTimer.value)
          jsonDataTime.value = 0
          initJsonTime()
        }

        // 定时超过 5 分钟 没有数据 则停止轮询
        if (jsonDataTime.value > 300000) {
          createSpeechData.value.status = 'error'
          clearInterval(jsonDataApiTimer.value)
          jsonDataTime.value = 0
          mainStore.setCreateLoading({
            showLoading: false,
            showRemark: null,
          })

          return
        }

        if (
          !createLoading.value.isclose ||
          createSpeechData.value?.isclose === true
        ) {
          await delay(1000)
          await getJsonDataInfo(id)
        } else {
          // 主动关闭
          createSpeechData.value.status = 'close'
          createSpeechData.value.isclose = false
          mainStore.setCreateLoading({
            isclose: false,
          })
        }
      } else if (res.data?.note_status == '2') {
        // 解析完成
        await initNotes(res.data?.content, res.data?.note_status)
        closeJsonLoading(res)
        if (optcityType.value === 2) {
          message.success(t('speack.success'))
        }
        createSpeechData.value.status = 'end'
        if (
          (optcityType.value === 2 || optcityType.value === 3) &&
          userCanSave()
        ) {
          saveJSONData()
        }
      } else {
        if (res.data?.note_status == '3') {
          message.error(t('speack.error'))
        }
        // 其他异常情况
        clearInterval(jsonDataApiTimer.value)
        jsonDataTime.value = 0
        closeJsonLoading(res)
        createSpeechData.value.status = 'error'
      }
    } catch (error) {
      // 报错导致 不能继续执行
      createSpeechData.value.status = 'error'
      closeJsonLoading(res)
    }
  }

  const initNotes = async (data: any, status?: any) => {
    if (
      createLoading.value.isclose ||
      createSpeechData.value?.isclose === true
    ) {
      return
    }
    if (updateAll.value) {
      if (
        JSON.stringify(nodesList.value) !== JSON.stringify(data.note) &&
        data?.note?.length
      ) {
        if (optcityType.value === 2 || optcityType.value === 3) {
          const idsInArr1 = new Set(
            nodesList.value.map((item: any) => item.page)
          )
          const diferentNodes = data.note.filter(
            (item: any) => !idsInArr1.has(item.page) && item.page > 0
          )
          for (let index = 0; index < diferentNodes.length; index++) {
            createSpeechData.value.count += 1
            mainStore.setCreateLoading({
              showRemark: false,
              tips: t('speack.tips4'),
            })

            const element = diferentNodes[index]
            const slideIndex = element.page - 1
            let slideData: any = null
            slides.value.forEach((ele: any, index: number) => {
              if (index === slideIndex) {
                slideData = ele
              }
            })

            slidesStore.updateSlideIndex(slideIndex)
            const remark = handleSetRemark(element.text)
            slidesStore.updateSlide({ remark }, slideData.id)
            mainStore.setCreateLoading({
              showRemark: true,
            })
          }
        }
        nodesList.value = JSON.parse(JSON.stringify(data.note))
      }
    } else {
      const noList = nodesList.value.find(
        (item: any) => item.page === slideIndex.value + 1 && item.page > 0
      )
      if (!noList) {
        const diferentNodes = data.note.find((item: any) => {
          return item.page === slideIndex.value + 1
        })
        if (diferentNodes && diferentNodes.text) {
          const remark = handleSetRemark(diferentNodes.text)
          slidesStore.updateSlide({ remark })
          mainStore.setCreateLoading({
            showRemark: true,
            tips: t('speack.tips4'),
          })
          nodesList.value.push(diferentNodes)
          await delay(1000)
          closeJsonLoading()
          mainStore.setCreateLoading({
            isclose: true,
          })
          createSpeechData.value.isclose = true

          if (status != '2') {
            message.success(t('speack.success'))
          }
        }
      }
    }
  }

  const initNoteCreate = async () => {
    mainStore.setCreateLoading({
      tips: t('speack.tips1'),
      noshow: false,
    })
    for (let index = 0; index < nodesList.value.length; index++) {
      await delay(400)
      mainStore.setCreateLoading({
        showRemark: false,
      })
      const element = nodesList.value[index]
      const slideIndex = element.page - 1
      let slideData: any = null
      slides.value.forEach((ele: any, index: number) => {
        if (index === slideIndex) {
          slideData = ele
        }
      })
      mainStore.setCreateLoading({
        tips: t('speack.tips4'),
      })
      slidesStore.updateSlideIndex(slideIndex)
      const remark = handleSetRemark(element.text)
      if (slideData) {
        slidesStore.updateSlide({ remark }, slideData.id)
        mainStore.setCreateLoading({
          showRemark: true,
        })
      }
    }
  }

  const closeJsonLoading = (res?: any) => {
    clearInterval(jsonDataApiTimer.value)
    jsonDataTime.value = 0
    if (optcityType.value === 2) {
      mainStore.setShowLoadingMarks(false)
      mainStore.setCreateLoading({
        showClose: false,
      })
    }
  }

  const delay = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  const handleSetRemark = (remark: string) => {
    remark = remark.replace('####', '')

    return remark
  }
  onBeforeUnmount(() => {
    clearInterval(jsonDataApiTimer.value)
    jsonDataTime.value = 0
  })

  /**
   * 将Base64音频转换为File对象
   * @param {string} base64Data - Base64编码的音频数据（可带或不带data:前缀）
   * @param {string} [filename="audio.mp3"] - 生成的文件名
   * @param {string} [mimeType="audio/mp3"] - 文件MIME类型
   * @returns {File} 返回File对象
   */
  const base64ToFile = (
    base64Data: any,
    filename = 'audio.mp3',
    mimeType = 'audio/mp3'
  ) => {
    // 1. 移除可能的Base64前缀（如"data:audio/mp3;base64,"）
    const base64WithoutPrefix = base64Data.split(',')[1] || base64Data

    // 2. 将Base64字符串转换为二进制字节数组
    const byteCharacters = atob(base64WithoutPrefix)
    const byteArrays = []

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512)
      const byteNumbers = new Array(slice.length)

      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i)
      }

      byteArrays.push(new Uint8Array(byteNumbers))
    }

    // 3. 创建Blob对象
    const blob = new Blob(byteArrays, { type: mimeType })

    // 4. 将Blob转为File对象
    return new File([blob], filename, { type: mimeType })
  }

  class ConcurrentProcessor {
    slides: any
    maxConcurrent: number
    maxRetries: number
    completed: number
    total: number
    results: any
    progressCallbacks: any
    progressTotal: number
    tokenData: any
    voice_type: string
    audioType: string
    isCancelled: boolean
    isSelf: boolean
    constructor(
      slides: any,
      tokenData: any,
      voice: string,
      audioType: string,
      maxConcurrent = 5,
      maxRetries = 2,
      progressTotal = 100,
      isSelf = false
    ) {
      this.slides = slides
      this.maxConcurrent = maxConcurrent
      this.maxRetries = maxRetries
      this.progressTotal = progressTotal
      this.completed = 0
      this.total = slides.length
      this.results = []
      this.progressCallbacks = []
      this.tokenData = tokenData
      this.voice_type = voice
      this.audioType = audioType
      this.isCancelled = false
      this.isSelf = isSelf
    }

    // 注册进度回调
    onProgress(callback: any) {
      this.progressCallbacks.push(callback)
      return this
    }

    // 更新进度
    updateProgress() {
      const progress = Math.round(
        (this.completed / this.total) * this.progressTotal
      )
      this.progressCallbacks.forEach((cb: any) =>
        cb(progress, this.completed, this.total)
      )
    }

    // 取消生成
    cancel() {
      this.isCancelled = true
      cancelRequestsWithPrefix('translate')
      cancelRequestsWithPrefix('getAudio')
      cancelRequestsWithPrefix('uploadAudio')
      cancelRequestsWithPrefix('saveaudio')
    }
    // 带重试机制的请求
    async fetchWithRetry(
      url: any,
      data: any,
      isSelf = false,
      retries = 0
    ): Promise<any> {
      try {
        if (url === 'getAudio') {
          if (isSelf) {
            return await getBuildvoice(data, `getAudio-${nanoid(5)}`)
          }
          return await getAudio(
            data,
            this.tokenData?.token,
            `getAudio-${nanoid(5)}`
          )
        }
      } catch (error) {
        if (this.isCancelled) {
          throw new Error('请求已被取消')
        }
        if (retries < this.maxRetries) {
          console.warn(`请求失败，第 ${retries + 1} 次重试...`, error)
          // 可以添加指数退避
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (retries + 1))
          )
          return this.fetchWithRetry(url, data, isSelf, retries + 1)
        }
        throw error
      }
    }

    // 处理单个文本的完整流程
    async processText(text: any, elId: string, index: number): Promise<any> {
      if (this.isCancelled) {
        return {
          index,
          skipped: true,
          text: text,
        }
      }
      try {
        if (!text) {
          const saveResult = await saveaudio(
            {
              id: useFileId.value,
              page: index + 1,
              url: '',
              md5: '',
              slide_id: elId,
              remark_en: '',
            },
            `saveaudio-${nanoid(10)}`
          )
          return {
            index,
            success: true,
            data: saveResult,
          }
        }
        text = text
          .replace(/<[^>]+>/g, '')
          .replace(/\[AI生成内容仅供参考，请注意甄别准确性\]/g, '')
          .replace(/[\r\n]+/g, '')
          .trim()

        // 1. 翻译
        const translation: any = await translateText(
          { text: text, to: 'en' },
          `translate-${nanoid(5)}`
        )
        // const translation = await this.fetchWithRetry(translateText, {
        //   text,
        // })

        const isEnglish = this.voice_type
          ? this.voice_type.indexOf('-english') > -1
          : false
        if (isEnglish) {
          this.audioType = '英文'
        }
        this.voice_type = this.voice_type
          ? this.voice_type.replace('-english', '')
          : ''
        let data = {}
        if (this.isSelf) {
          data = {
            text: text,
            voice_id: this.voice_type,
            type: moldSreve.value,
          }
        } else {
          data = {
            app: {
              appid: this.tokenData?.app_id,
              token: this.tokenData?.token,
              cluster: 'volcano_tts',
            },
            user: {
              uid: useInfo?.value?.user_id,
            },
            audio: {
              voice_type: this.voice_type,
              encoding: 'mp3',
              speed_ratio: 1.0,
            },
            request: {
              reqid: nanoid(16),
              text:
                this.audioType === '英文' && translation.code === 200
                  ? translation.data
                  : text,
              operation: 'query',
            },
          }
        }

        // 2. 生成语音
        // const audioData: any = await getAudio(data, this.tokenData.token)
        const audioData = await this.fetchWithRetry(
          'getAudio',
          data,
          this.isSelf
        )
        let audioFile = null

        if (this.isSelf) {
          audioFile =
            moldSreve.value === 2
              ? audioFile
              : base64ToFile(audioData, `page${index}-${nanoid(10)}.mp3`)
        } else {
          audioFile = audioData.data
            ? base64ToFile(audioData.data, `page${index}-${nanoid(10)}.mp3`)
            : null
        }

        // 3. 上传
        let uploadResult: any = {}

        if (this.isSelf && moldSreve.value === 2) {
          uploadResult.url =
            audioData.code === 200 ? audioData.data.wav_path[0] : ''
        } else {
          uploadResult = audioFile
            ? await onUploads(
                audioFile,
                'chatppt_audio',
                `uploadAudio-${nanoid(10)}`
              )
            : null
        }

        const remarkMd5 = CryptoJS.MD5(text).toString()
        // 4. 保存结果
        const saveResult = await saveaudio(
          {
            id: useFileId.value,
            page: index + 1,
            url: uploadResult?.url,
            md5: remarkMd5,
            slide_id: elId,
            remark_en: translation.code === 200 ? translation.data : '',
          },
          `saveaudio-${nanoid(10)}`
        )

        return {
          index,
          success: true,
          data: saveResult,
        }
      } catch (error: any) {
        if (this.isCancelled) {
          return {
            index,
            cancelled: true,
            text: text,
          }
        }

        return {
          index,
          success: false,
          error: error.message,
          text: text,
        }
      } finally {
        if (!this.isCancelled) {
          this.completed++
          this.updateProgress()
        }
      }
    }

    // 并发处理所有文本
    // eslint-disable-next-line require-await
    async processAll() {
      this.isCancelled = false
      const batches = []

      // 创建批次
      for (let i = 0; i < this.slides.length; i += this.maxConcurrent) {
        batches.push(this.slides.slice(i, i + this.maxConcurrent))
      }

      // 按批次处理
      let count = 0
      for (const batch of batches) {
        if (this.isCancelled) break
        const promises = batch.map((item: any, index: number) =>
          this.processText(item.remark, item.id, count + index)
        )
        count++
        const batchResults = await Promise.all(promises)
        this.results.push(...batchResults)
      }

      return { results: this.results, cancelled: this.isCancelled }
    }
  }

  return {
    handleCreateSpeech,
    nodesList,
    initNoteCreate,
    createSpeechData,
    ConcurrentProcessor,
  }
}
