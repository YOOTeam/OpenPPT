import axios from 'axios'
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'

import { baseUrlConfig } from '@/utils/baseUrl'

import { analyseStyle, textToImgApiPost, writtenwords } from '@/api/careate'
export default () => {
  const mainStore = useMainStore()
  const { userToken } = storeToRefs(mainStore)
  const baseUrl = baseUrlConfig.apiUrl
  const headers = {
    'Content-Type': 'application/json',
    authorization: userToken.value || 'inside-user-token',
    ver: 'v1',
    accesskeyid: 'csVyGKphwMxRcJ5w',
    channel: 'chatppt-editor',
  }

  const getTextToImg = async (data: any) => {
    const res: any = await textToImgApiPost(data)
    return res
  }

  const getTextKeyWord = async (data: any) => {
    if (!window._PROCESS_CONTENT) {
      return Promise.resolve({
        code: 204,
        data: null,
        message: 'success',
      })
    }
    return await writtenwords(data)
  }

  const getAnalyseStyle = async (str: string) => {
    if (!str) return ''
    const res: any = await analyseStyle({ text: str }, 'analyseStyle')
    let result = ''
    if (res.code === 200 && res.data.style) {
      if (Array.isArray(res.data.style)) {
        result = res.data.style.join(',')
      } else {
        result = res.data.style
      }
      return result
    }
  }

  // 节流相关变量
  let lastUpdateTime = 0
  const UPDATE_INTERVAL = 200 // 200毫秒更新一次界面
  let pendingData = ''
  let animationFrameId: any = null
  // 取消请求相关
  let abortController: any = null
  const streamData = ref<string>('')
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const streamResult: any = ref({
    content: '',
    actionName: '',
    errCode: null,
    errMsg: '',
    rawChunks: [],
  })

  // 节流更新函数
  const throttledUpdate = (newData: any) => {
    if (newData) {
    }

    pendingData += newData

    // 使用requestAnimationFrame进行节流
    if (!animationFrameId) {
      animationFrameId = requestAnimationFrame(() => {
        const now = Date.now()
        if (now - lastUpdateTime >= UPDATE_INTERVAL) {
          pendingData = ''
          lastUpdateTime = now
        }
        animationFrameId = null
      })
    }
  }

  // 解析流式数据
  const parseStreamChunk = (chunk: any) => {
    try {
      // 移除可能的前缀并修剪空白
      const jsonStr = chunk.replace(/^data:\s*/, '').trim()

      // 检查结束标记
      if (jsonStr === '[DONE]') return null

      // 解析JSON
      const data = JSON.parse(jsonStr)
      return data
    } catch (e) {
      console.warn('解析JSON失败:', e, '原始数据:', chunk)
      return null
    }
  }
  // 获取流数据
  const fetchStreamData = async (url: string, data: any) => {
    try {
      // 初始化状态
      isLoading.value = true
      error.value = null
      streamData.value = ''
      pendingData = ''
      lastUpdateTime = Date.now()
      streamResult.value = {
        content: '',
        actionName: '',
        errCode: null,
        errMsg: '',
        rawChunks: [],
      }
      // 创建AbortController以便取消请求
      abortController = new AbortController()

      const response: any = await fetch(baseUrl + url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data),
        signal: abortController.signal,
      })
      response.headers['Accept'] = 'text/event-stream'

      if (!response.ok) {
        throw new Error(`HTTP错误! 状态码: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // 处理可能的分块（假设以双换行分隔）
        const chunks = buffer.split('\n\n')
        buffer = chunks.pop() || '' // 保留未完成的块

        for (const chunk of chunks) {
          if (!chunk.trim()) continue

          const parsed = parseStreamChunk(chunk)
          if (!parsed) continue

          // 存储原始数据
          streamResult.value.rawChunks.push(parsed)

          // 拼接data字段内容
          if (parsed.data !== undefined && parsed.data !== null) {
            streamResult.value.content += parsed.data
          }

          // 更新其他字段
          if (parsed.actionName !== undefined) {
            streamResult.value.actionName = parsed.actionName
          }
          if (parsed.errCode !== undefined) {
            streamResult.value.errCode = parsed.errCode
          }
          if (parsed.errMsg !== undefined) {
            streamResult.value.errMsg = parsed.errMsg
          }
        }
      }
    } catch (err: any) {
      // 如果不是用户主动取消的错误
      if (err.name !== 'AbortError') {
        error.value = err.message
        console.error('获取流数据失败:', err)
      }
    } finally {
      isLoading.value = false
      abortController = null
    }
  }

  // 解析流式数据
  const parseStreamData = (rawData: any) => {
    try {
      // 处理可能的前缀（如"data:"）
      const jsonStr = rawData.replace(/^data:\s*/, '').trim()
      if (jsonStr === '[DONE]') return null

      // 尝试解析为JSON
      return JSON.parse(jsonStr)
    } catch (e) {
      console.warn('解析JSON失败:', e, '原始数据:', rawData)
      return null
    }
  }

  // 取消请求
  const cancelRequest = () => {
    if (abortController) {
      abortController.abort()
    }
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
    // 将pending数据一次性更新
    if (pendingData) {
      streamData.value += pendingData
      pendingData = ''
    }
  }

  return {
    getTextToImg,
    getTextKeyWord,
    cancelRequest,
    fetchStreamData,
    getAnalyseStyle,
    streamData,
    streamResult,
    isLoading,
    error,
  }
}
