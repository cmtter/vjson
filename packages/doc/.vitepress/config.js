import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: 'vjson',
  description: '基于 Vue 3 的运行时 JSON 渲染引擎与可视化编辑器',
  // guide 目录作为文档根
  srcDir: 'guide',
  themeConfig: {
    nav: [
      { text: '指南', link: '/' },
      { text: 'vjson 规范', link: '/vjson-spec' },
      { text: '编辑器', link: '/editor' },
    ],
    sidebar: {
      '/': [
        {
          text: '开始',
          items: [
            { text: '介绍', link: '/' },
            { text: '快速上手', link: '/getting-started' },
          ],
        },
        {
          text: 'vjson 渲染引擎 (core)',
          items: [
            { text: '数据结构规范', link: '/vjson-spec' },
            { text: 'scriptSetup 代码片段', link: '/script-setup' },
            { text: 'Element Plus 集成', link: '/element-plus' },
            { text: 'FAQ', link: '/faq' },
          ],
        },
        {
          text: 'vjson 编辑器 (editor)',
          items: [{ text: '编辑器使用手册', link: '/editor' }],
        },
      ],
    },
  },
})
