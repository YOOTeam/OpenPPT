import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import { ref, onMounted, onUnmounted } from 'vue'

class WebSocketService {
  url: string
  socket: WebSocket | null
  isAlive: boolean
  reconnectAttempts: number
  MAX_RECONNECT_ATTEMPTS: number
  HEARTBEAT_INTERVAL: number
  heartbeatTimer: ReturnType<typeof setInterval> | null
  reconnectTimer: ReturnType<typeof setTimeout> | null
  token?: string

  constructor(url: string, token?: string) {
    this.url = url
    this.socket = null
    this.isAlive = false // 用于判断心跳是否正常
    this.reconnectAttempts = 0 // 重连尝试次数
    this.MAX_RECONNECT_ATTEMPTS = 5 // 最大重连次数
    this.HEARTBEAT_INTERVAL = 30000 // 心跳间隔时间 (30秒)
    this.heartbeatTimer = null
    this.reconnectTimer = null
    this.token = token
    this.connect()
  }

  connect() {
    this.socket = new WebSocket(this.url, [this.token ?? ''])
    this.socket.onopen = () => {
      this.reconnectAttempts = 0 // 成功连接后重置重试次数
      this.startHeartbeat() // 开始心跳检测
    }

    this.socket.onmessage = (event) => {
      // 处理接收到的消息
    }

    this.socket.onclose = () => {
      this.stopHeartbeat()
      this.attemptReconnect()
    }

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }

  startHeartbeat() {
    if (!this.heartbeatTimer) {
      this.heartbeatTimer = setInterval(() => {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.isAlive = false
          this.sendPing()
        }
      }, this.HEARTBEAT_INTERVAL)
    }
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  sendPing() {
    setTimeout(() => {
      if (this.socket) {
        this.socket.send(JSON.stringify({ type: 'ping' }))
      }
    }, this.HEARTBEAT_INTERVAL / 2) // 如果没有pong响应，则关闭并重连
  }

  receivePong() {
    this.isAlive = true
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++
      this.reconnectTimer = setTimeout(() => {
        this.connect()
      }, 1000 * this.reconnectAttempts) // 指数退避算法
    } else {
      console.error('Max reconnect attempts reached')
    }
  }

  sendMessage(message: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message))
    }
  }

  close() {
    this.stopHeartbeat()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }
}

export default function useWebSocket(url: string) {
  const { userToken } = storeToRefs(useMainStore())

  const ws: any = new WebSocketService(url, userToken.value)
  const message = ref(null)
  const isConnected = ref(false)

  const onMessage = (callback: any): void => {
    ws.socket.onmessage = (event: any) => {
      message.value = event.data
      callback(event.data)
      if (event.data.includes('pong')) {
        ws.receivePong()
      }
    }
  }

  const onClose = (callback: any) => {
    ws.socket.onclose = () => {
      isConnected.value = false
      callback()
    }
  }

  const onOpen = (callback: any) => {
    ws.socket.onopen = () => {
      isConnected.value = true
      callback()
    }
  }

  onMounted(() => {
    // 进行事件监听
    onOpen(() => {})
    onClose(() => {})
    onMessage((data: any) => {})
  })

  onUnmounted(() => {
    ws.close()
  })
  return ws
}
