import { onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import {
  isFullscreen,
  exitFullscreen,
  enterFullscreen,
} from '@/utils/fullscreen'
import useScreening from '@/hooks/useScreening'
import { useMainStore } from '@/store'
import { backUrl } from '@/utils/baseUrl'
export default () => {
  const fullscreenState = ref(true)
  const escExit = ref(true)
  const isSpeechAudioExit = ref(false)
  const { exitScreening } = useScreening()
  const handleFullscreenChange = () => {
    fullscreenState.value = isFullscreen()
    if (!fullscreenState.value && escExit.value) exitScreening()
    escExit.value = true
  }

  onMounted(() => {
    fullscreenState.value = isFullscreen()
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange) // Safari 兼容
  })
  onUnmounted(() => {
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
    document.removeEventListener(
      'webkitfullscreenchange',
      handleFullscreenChange
    )
  })

  const manualExitFullscreen = () => {
    if (!fullscreenState.value) return
    escExit.value = false
    exitFullscreen()
  }

  return {
    isSpeechAudioExit,
    fullscreenState,
    manualExitFullscreen,
  }
}
