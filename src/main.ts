import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import ArcoVue from '@arco-design/web-vue'
import '@arco-design/web-vue/dist/arco.css'
import '@icon-park/vue-next/styles/index.css'
import 'prosemirror-view/style/prosemirror.css'
import 'animate.css'
import '@/assets/styles/prosemirror.scss'
import '@/assets/styles/global.scss'
import '@/assets/styles/font.scss'
import '@/assets/styles/chat.scss'
import '@/assets/iconfont/iconfont.css'
import i18n from './locales'
import vuetyped from 'vue3typed'
const pinia = createPinia()

import AntArr from '@/plugins/AntDesignVue'

import Icon from '@/plugins/icon'
import Directive from '@/plugins/directive'

const app = createApp(App)
app.use(ArcoVue)
app.use(AntArr)
app.use(Icon)
app.use(Directive)
app.use(i18n)
app.use(pinia)
app.use(vuetyped)
app.mount('#app')

document.documentElement.style.setProperty(
  '--assets-url',
  window._ASSETS_URL || ''
)
