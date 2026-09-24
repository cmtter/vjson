import { defineConfig } from 'vite'

// lib 构建: 产物可直接发布到 npm 仓库
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'VjsonCore',
      fileName: 'vjson-core',
      formats: ['es'],
    },
    rollupOptions: {
      // vue 声明为外部依赖, 由宿主工程提供
      external: ['vue'],
      output: {
        // 保留原始模块结构便于 tree-shaking
        preserveModules: false,
      },
    },
  },
})
