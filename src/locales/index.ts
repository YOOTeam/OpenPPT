import { createI18n } from 'vue-i18n'
import zh_CN from './zh_CN'
import zh_TW from './zh_TW'
import en from './en'
const messages = {
  'en-US': en,
  'zh-CN': zh_CN,
  'zh-TW': zh_TW,
}
const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('lang') || 'zh-CN', // 首先从缓存里拿，没有的话就用浏览器语言，
  fallbackLocale: 'zh-CN', // 设置备用语言
  messages,
})

export default i18n
