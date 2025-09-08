import { ref, onMounted, onUnmounted, watch } from 'vue'

export function useActivityMonitor(saveCallback: any, idleTimeout = 30 * 1000) {
  const lastActivityTime = ref(Date.now())
  const isIdle = ref(false)
  let idleTimer: any = null

  // 观察者模式 - 主题（被观察者）
  const activitySubject = {
    observers: [],
    subscribe(observer: any) {
      this.observers.push(observer)
    },
    notify() {
      this.observers.forEach((observer) => observer.updateActivity())
    },
  }

  // 观察者 - 负责更新活动时间
  const activityObserver = {
    updateActivity() {
      lastActivityTime.value = Date.now()
      isIdle.value = false
      resetIdleTimer()
    },
  }

  // 订阅观察者
  activitySubject.subscribe(activityObserver)

  // 重置空闲计时器
  const resetIdleTimer = () => {
    if (idleTimer) {
      clearTimeout(idleTimer)
    }
    idleTimer = setTimeout(() => {
      isIdle.value = true
      saveCallback()
    }, idleTimeout)
  }

  // 监听活动事件
  const setupActivityListeners = () => {
    const events = [
      'mousedown',
      'keypress',
      'touchstart',
      'scroll',
      'input',
      'change',
    ]

    events.forEach((event) => {
      window.addEventListener(event, () => activitySubject.notify())
    })
  }

  // 监听网络请求
  const setupRequestInterceptor = () => {
    const originalFetch = window.fetch

    window.fetch = async (...args) => {
      activitySubject.notify()
      return originalFetch(...args)
    }

    const originalXHROpen = XMLHttpRequest.prototype.open

    XMLHttpRequest.prototype.open = function (...args) {
      this.addEventListener('loadend', () => activitySubject.notify())
      originalXHROpen.apply(this, args)
    }
  }

  // 初始化
  onMounted(() => {
    setupActivityListeners()
    setupRequestInterceptor()
    resetIdleTimer()
  })

  // 清理
  onUnmounted(() => {
    if (idleTimer) clearTimeout(idleTimer)
  })

  return {
    lastActivityTime,
    isIdle,
  }
}
