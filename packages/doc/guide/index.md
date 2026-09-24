# vjson

vjson 是一个 **以 JSON 格式描述 Vue 组件、运行时（runtime）实时渲染** 的渲染引擎。它无需经过编译、构建流程，即可将 JSON 动态转换为标准 Vue 组件，实现"数据即页面、变更即生效"。

并配套提供 **可视化编辑器**（@vjson/editor），支持节点树编辑、scriptSetup 片段管理、样式编辑与实时预览。

## monorepo 结构

| 包 | 说明 |
| --- | --- |
| `@vjson/core` | 渲染引擎核心：vjson 校验、代码生成、动态编译、组件缓存 |
| `@vjson/editor` | 可视化编辑器：节点树 / 属性面板 / scriptSetup / 样式 + 实时预览 |
| `@vjson/play` | 功能验证应用（playground） |
| `@vjson/doc` | 文档站点（本站） |

## 核心能力

| 特性 | 语法 | 说明 |
| --- | --- | --- |
| 静态属性 | `prop1: '123'` | 原样透传为组件/元素属性 |
| 动态属性 | `':prop2': 'dataRef.value'` | 表达式在 setup 上下文中求值后传入 |
| 条件渲染 | `'v-if': 'expr'` | 表达式为真才渲染该节点 |
| 列表循环 | `'v-for': '(item, index, keyField) in list'` | 支持 keyField 取循环节点 key |
| 双向绑定 | `'v-model': 'expr'` / `'v-model:title': 'expr'` | 组件/原生元素自动适配 |
| 批量属性绑定 | `'v-bind': 'attrsRef.value'` | 求值对象合并进属性 |
| 显隐控制 | `'v-show': 'expr'` | 指令方式保留 DOM 仅切换 display |
| 事件绑定 | `'@click': 'handler'` | 标识符引用与内联语句两种形式 |
| 插槽 | `children` + `slot` 字段 | 默认/具名/作用域插槽 |
| 动态业务逻辑 | `scriptSetup: [...]` | 字符串数组注入 setup 函数体 |

## 下一步

- [快速上手](./getting-started)
- [vjson 数据结构规范](./vjson-spec)
- [编辑器使用手册](./editor)
