import { defineStore } from 'pinia'
export interface ChatState {
  pptJsonData: any
  currentTextNode?: any
  isEnd?: any
}

export const useChatInfo = defineStore('chatInfo', {
  state: (): ChatState => ({
    pptJsonData: {
      color: '',
      style: '',
      content: '',
    },
    currentTextNode: null,
    isEnd: null,
  }),

  actions: {
    setPptJsonData(data: any) {
      this.pptJsonData = { ...this.pptJsonData, ...data }
    },
    setCurrentTextNode(data: any) {
      this.currentTextNode = data
    },
    setIsEnd(data: boolean) {
      this.isEnd = data
    },
  },
})
