// import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { createHtmlPlugin } from 'vite-plugin-html'
const moment = require('moment')
export default defineConfig(({ command, mode }) => {
  return {
    base: '',
    plugins: [
      vue(),
      createHtmlPlugin({
        /**
         * 需要注入 index.html ejs 模版的数据
         */
        inject: {
          data: {
            timestamp: new Date().getTime(),
          },
        },
      }),
    ],
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
          @import '@/assets/styles/variable.scss';
          @import '@/assets/styles/mixin.scss';
        `,
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src/'), // 确保路径正确指向你的源代码目录
      },
    },
    server: {
      host: '0.0.0.0',
    },
    build: {
      rollupOptions: {
        external: /^src\/.*/,
        output: {
          entryFileNames: `assets/[name].[hash].js`,
          assetFileNames: `assets/[name].[hash].[ext]`,
        },
      },
    },
  }
})
