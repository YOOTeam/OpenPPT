import type { Icons } from '@/plugins/icon'

declare module 'vue' {
  export type GlobalComponents = Icons
}

declare module '@baiducloud/sdk'
export {}
