import { useScreenStore, useSlidesStore, useMainStore } from '@/store'
import {
  enterFullscreen,
  exitFullscreen,
  isFullscreen,
} from '@/utils/fullscreen'

export default () => {
  const screenStore = useScreenStore()
  const slidesStore = useSlidesStore()

  // 生成一个随机8位数的唯一id
  const generateRandom8DigitId = () => {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let id = ''
    for (let i = 0; i < 8; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return id
  }
  const screeningId = generateRandom8DigitId()

  // 进入放映状态（从当前页开始）
  const enterScreening = () => {
    screenStore.setPlayId(screeningId)
    enterFullscreen()
    screenStore.setScreening(true)
  }

  // 进入放映状态（从第一页开始）
  const enterScreeningFromStart = () => {
    screenStore.setPlayId(screeningId)
    slidesStore.updateSlideIndex(0)
    enterScreening()
  }

  // 退出放映状态
  const exitScreening = () => {
    screenStore.setScreening(false)
    useMainStore().setActionAnimation(false)
    if (isFullscreen()) exitFullscreen()
  }

  return {
    enterScreening,
    enterScreeningFromStart,
    exitScreening,
  }
}
