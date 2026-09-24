import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// play: 功能验证应用, 通过 workspace 协议直接引用 core / editor 源码(不经 lib 构建)
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@vjson/core': fileURLToPath(new URL('../core/src/index.js', import.meta.url)),
      '@vjson/editor': fileURLToPath(new URL('../editor/src/index.js', import.meta.url)),
    },
  },
})
