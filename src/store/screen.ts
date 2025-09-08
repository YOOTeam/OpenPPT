import { defineStore } from 'pinia'

export interface ScreenState {
  screening: boolean
  rem: number
  interactionData: {
    interactionType: string
    elInteractionType: string
  }
  playId: any
}

export const useScreenStore = defineStore('screen', {
  state: (): ScreenState => ({
    screening: false, // 是否进入放映状态
    rem: 1,
    interactionData: {
      interactionType: 'none',
      elInteractionType: 'default',
    },
    playId: null,
  }),

  actions: {
    setPlayId(id: any) {
      this.playId = id
    },
    setInteractionData(data: any) {
      this.interactionData = data
    },

    setScreening(screening: boolean) {
      this.screening = screening
    },
    setRem(rem: number) {
      this.rem = rem
    },
  },
})
