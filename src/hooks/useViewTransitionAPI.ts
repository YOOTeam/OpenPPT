import { nextTick } from 'vue'
/**
 * 用于创建视图过渡动画的hook
 * @param triggerFn 触发视图过渡的函数
 * @returns 包装后的触发函数
 */
export function useViewTransition(triggerFn: (type: string) => void) {
  // 使用 useCallback 缓存函数
  return function (type: string) {
    // 检查浏览器是否支持 View Transitions API
    if ('startViewTransition' in document) {
      nextTick().then(() => {
        // DOM 更新完成后使用 View Transitions API
        document
          .startViewTransition(() => {
            // 执行传入的触发函数
            triggerFn(type)
          })
          .finished.then(() => {
            // 动画结束后执行
          })
      })
    } else {
      // 浏览器不支持，直接执行触发函数
      triggerFn(type)
    }
  }
}
