import { defineStore } from 'pinia'
export interface UserState {
  useInfo?: any
}

export const useApiData = defineStore('apiData', {
  state: (): UserState => ({
    useInfo: null,
  }),

  actions: {
    setUseInfo(useInfo: any) {
      this.useInfo = useInfo
    },
  },
})
