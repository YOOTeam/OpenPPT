import type { AxiosInstance, AxiosResponse, CancelTokenSource } from 'axios'
import axios from 'axios'
import md5 from 'js-md5'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import Qs from 'qs'
import message from '@/utils/message'
import { isPC } from '@/utils/common'
import { baseUrlConfig } from '@/utils/baseUrl'
const _isPc = isPC()

// 定义请求头配置类型
interface HeadersConfig {
  Accept: string
  Authorization: string
  'Accept-Language': string
  channel: string
  [key: string]: string // 允许其他动态键值对
}

// 获取更多请求头参数
function moreheaders(): HeadersConfig {
  const config: HeadersConfig = {
    Accept: 'application/json;charset=utf-8',
    Authorization: 'Bearer ' + (window._APPKEYTOKEN || ''),
    'Accept-Language': localStorage.getItem('lang') || '',
    channel: 'openCode',
    client: '',
  }

  return config
}

const getInsideConfig = () => {
  const data = {
    keyToken: window._APPKEYTOKEN || '',
    headers: moreheaders(),
  }

  return data
}

const replaceUrl = baseUrlConfig.hostUrl
const queue: any = {}
const service: AxiosInstance = axios.create({
  baseURL: window._AIP_BASE_URL || import.meta.env.VITE_APP_BASE_API, // 从环境变量中读取基础 URL
  timeout: 600000, // 请求超时时间
})

// 创建一个全局的 CancelToken 管理器
class CancelTokenManager {
  private sources: { [key: string]: CancelTokenSource }
  private controllers: any
  private cancleID: any

  constructor() {
    this.cancleID = []
    this.sources = {}
    this.controllers = new Map()
  }
  cancelGroup(group = 'default') {
    if (this.controllers.has(group)) {
      this.controllers.get(group).forEach((c: any) => c.abort())
      this.controllers.get(group).clear()
    }
  }

  async fetch(url: any, options = {}, group = 'default') {
    this.cancelGroup(group)

    const controller = new AbortController()
    if (!this.controllers.has(group)) {
      this.controllers.set(group, new Set())
    }
    this.controllers.get(group).add(controller)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error: any) {
      if (error.name !== 'AbortError') throw error
      return null
    } finally {
      this.controllers.get(group)?.delete(controller)
    }
  }

  // 添加一个 CancelToken
  addSource(key: string): CancelTokenSource {
    const source = axios.CancelToken.source()
    this.sources[key] = source
    return source
  }

  getCancelRequestSource(): any {
    return this.cancleID
  }

  deletCanclsId() {
    this.cancleID = []
  }

  deletSources(key: string) {}
  // 取消一个请求
  cancelRequest(key: string, message?: string): void {
    if (this.sources[key]) {
      this.sources[key].cancel(message || 'Request canceled by user')
      delete this.sources[key] // 取消后移除

      if (key === 'viewThemeModleSingle' || key === 'viewThemeModleFull') {
        this.cancleID.push(key)
      }
    }
  }

  // 取消多个
  cancelRequests(requestIds: string[]) {
    requestIds.forEach((id) => this.cancelRequest(id))
  }

  // 取消所有请求
  cancelAllRequests(message?: string): void {
    Object.keys(this.sources).forEach((key) => {
      this.sources[key].cancel(message || 'All requests canceled by user')
      delete this.sources[key]
    })

    this.controllers.forEach((group: any) => {
      group.forEach((c: any) => c.abort())
      group.clear()
    })
    this.controllers.clear()
  }
  // 取消指定前缀的所有请求
  cancelRequestsWithPrefix(prefix: string) {
    const toCancel: string[] = []

    for (const key in this.sources) {
      if (key.startsWith(prefix)) {
        toCancel.push(key)
      }
    }
    if (toCancel?.length) {
      this.cancelRequests(toCancel)
    }
  }
}

// 创建全局的 CancelTokenManager 实例
const cancelTokenManager = new CancelTokenManager()

service.interceptors.request.use(
  (config: any) => {
    if (config.url === '/chatppt/ip' || config.url === '/product/user') {
      config.baseURL = 'https://api.yoojober.com'
    }
    // 在发送请求之前做一些处理，例如添加 token
    if (config.data && !config.isJson) {
      config.headers!['Content-Type'] =
        'application/x-www-form-urlencoded;charset=UTF-8'
      config.transformRequest = [
        function (data: any) {
          data = Qs.stringify(data)
          return data
        },
      ]
    }

    if (config.header) {
      config.headers['Content-Type'] = config.header['Content-Type']
      if (config.header['authorization']) {
        config.headers['authorization'] = config.header['authorization']
      }
    }

    queue[config.url] = true
    return config
  },
  (error: any) => {
    // 处理请求错误
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // 对响应数据做一些处理
    const { data } = response
    codeError(data)
    return data
  },
  (error: any) => {
    // 处理响应错误
    if (axios.isCancel(error)) {
    } else {
      message.error(error.message || '服务器异常')
    }
    return Promise.reject(error)
  }
)

// 封装通用的请求方法
export function request<T>(config: any): Promise<T> {
  const options = Object.assign(getInsideConfig(), config)

  if (options.header) {
    options.headers = Object.assign(options.headers, options.header)
    delete options.header
  }

  try {
    let type: any = {}
    // s视觉模型 取消接口
    if (options.url === '/aimodel/canceltask') {
      cancelTokenManager.deletCanclsId()
    }

    if (options.method === 'post') {
      type = options.data
    } else {
      type = options.params
    }

    if (
      type &&
      typeof type.timestamp !== 'undefined' &&
      typeof type.sign !== 'undefined'
    ) {
      delete type.timestamp
      delete type.sign
    }

    let str = ''
    if (type) {
      const time: any = new Date().getTime() / 1000
      type.timestamp = parseInt(time)

      const params = type
      // 1.先对key进行自然排序
      const temp = []
      for (const i in params) {
        if (i !== 'cancelToken') {
          temp.push(i)
        }
      }
      temp.sort()

      // 2.再按key的自然顺序  拼接加密字符串
      temp.forEach(function (item) {
        let type = 'string'
        if (params[item] === null) {
          params[item] = ''
        } else {
          type = typeof params[item]
        }
        if (type === 'boolean' || type === 'string' || type === 'number') {
          str += item + '=' + params[item] + '&'
        }
      })
      if (str) {
        str += options.keyToken
        // type.sign = md5(str)
      }
    }
    if (options?.requestId) {
      cancelTokenManager.cancelRequest(options.requestId)
    }

    // 如果提供了 requestId，则添加 CancelToken
    if (options?.requestId) {
      const source = cancelTokenManager.addSource(options.requestId)
      options.cancelToken = source.token

      if (options.requestId) {
      }
    }

    return service(options)
  } catch (error) {
    if (!axios.isCancel(error)) {
      throw error
    }
    // 如果是取消请求的错误，不抛出
    return Promise.reject(null)
  } finally {
  }
}

// 取消单个请求
export function cancelRequest(requestId: string, message?: string): void {
  cancelTokenManager.cancelRequest(requestId, message)
}

// 取消所有请求
export function cancelAllRequests(message?: string): void {
  cancelTokenManager.cancelAllRequests(message)
}
// 取消多个请求
export function cancelRequestsRequests(requestId?: any): void {
  cancelTokenManager.cancelRequests(requestId)
}

// 取消指定前缀的所有请求
export function cancelRequestsWithPrefix(prefix?: any): void {
  cancelTokenManager.cancelRequestsWithPrefix(prefix)
}

export function returnCancel(): any {
  return cancelTokenManager.getCancelRequestSource()
}

const codeError = (data: any) => {
  const mainStore = useMainStore()
  const { showToolbar, mobileLayout } = storeToRefs(mainStore)
  const lang = localStorage.getItem('lang')
  const linkType = localStorage.getItem('linkType')

  if (data && data.msg) {
    switch (data.code) {
      case 400:
        if (data.msg === '缺少AccessToken') {
          if (showToolbar.value || mobileLayout.value) {
            mainStore.setOpenNoTokenToobal(true)
          } else {
            mainStore.setOpenNoTokenModal(true)
          }
        } else {
          message.info(data.msg || '请求参数异常')
        }

        break
      case 500:
        message.info(data.msg || '服务器异常')
        break
      case 1901:
        break
      case 10003:
        if (linkType !== 'iframe') {
          sessionStorage.removeItem('themeModle')
          sessionStorage.removeItem('singlePageId')
          if (lang) {
            localStorage.setItem('lang', lang)
          }
          localStorage.removeItem('userinfo')
          localStorage.removeItem('token')

          message.info(data.msg || '登录失效，请重新登录！')
        }

        break
      case 200:
      case 905:
      case 2816:
      case 2817:
      case 11002:
      case 10001:
      case 10002:
      case 2022:
      case 2061:
      case 204:
      case 2806:
      case 2886:
      case 2887:
      case 3500:
      case 3202:
        break
      case 403:
        message.info(data.msg || '无访问权限，请联系企业管理员')
        break
      default:
        // message.info(data.msg || '服务端异常，请联系技术支持')
        break
    }
  }
}
