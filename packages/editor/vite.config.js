import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// lib 构建: 产物可直接发布到 npm 仓库
export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'VjsonEditor',
      fileName: 'vjson-editor',
      formats: ['es'],
    },
    rollupOptions: {
      // vue 与 @vjson/core 声明为外部依赖, 由宿主工程提供
      external: ['vue', '@vjson/core'],
      output: {
        // SFC 样式抽取为独立 css 文件
        assetFileNames: (assetInfo) => (assetInfo.names?.[0]?.endsWith('.css') ? 'vjson-editor.css' : assetInfo.names[0]),
      },
    },
  },
})
