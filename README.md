# vjson — 基于 Vue 3 的运行时 JSON 渲染引擎

vjson 是一个 **以 JSON 格式描述 Vue 组件、运行时（runtime）实时渲染** 的渲染引擎。它无需经过编译、构建流程，即可将 JSON 动态转换为标准 Vue 组件，实现"数据即页面、变更即生效"。配套提供可视化编辑器，支持节点树编辑、scriptSetup 片段管理、样式编辑与实时预览。

> 详细文档见 `packages/doc`（`pnpm doc:dev` 启动文档站点）。

## Monorepo 结构

```
vjson/
├── packages/
│   ├── core/     @vjson/core    渲染引擎核心(可发布 npm)
│   │   └── src/
│   │       ├── index.js          对外入口
│   │       ├── useVjsonRender.js vjson -> Vue 组件主入口
│   │       └── core/             校验 / 代码生成 / 动态编译 / 开放变量
│   ├── editor/   @vjson/editor  可视化编辑器(可发布 npm)
│   │   └── src/                 VjsonEditor + 节点树 / 属性面板 / scriptSetup / 样式面板
│   ├── play/     @vjson/play    功能验证应用(私有)
│   └── doc/      @vjson/doc     文档站点(VitePress, 私有)
└── pnpm-workspace.yaml
```

## 命令

```sh
pnpm install      # 安装全部 workspace 依赖
pnpm build        # 构建 @vjson/core 与 @vjson/editor lib 产物(可发布 npm)
pnpm play:dev     # 启动 play 验证应用(http://localhost:5173)
pnpm doc:dev      # 启动文档站点
```

## 快速上手

```sh
pnpm add @vjson/core
```

```vue
<script setup>
  import { useVjsonRender } from '@vjson/core'

  const vjsonStr = `
  {
    "version": "1.0.1",
    "name": "hello-page",
    "template": [
      { "type": "h2", "children": ["Hello vjson!"] },
      { "type": "input", "v-model": "nameRef.value", "placeholder": "请输入姓名" }
    ],
    "scriptSetup": ["const nameRef = ref('张三')"]
  }
  `
  const VjsonComponent = useVjsonRender(vjsonStr)
</script>

<template>
  <VjsonComponent />
</template>
```

可视化编辑器：

```vue
<script setup>
  import { reactive } from 'vue'
  import { VjsonEditor } from '@vjson/editor'
  import '@vjson/editor/style.css'

  const vjson = reactive({ version: '1.0.1', name: 'demo', template: [], scriptSetup: [], style: '' })
</script>

<template>
  <VjsonEditor :vjson="vjson" />
</template>
```

## 构建产物(publish)

| 包 | 产物 | 说明 |
| --- | --- | --- |
| `@vjson/core` | `dist/vjson-core.js` | ES 单文件产物，vue 声明为 external |
| `@vjson/editor` | `dist/vjson-editor.js` + `dist/vjson-editor.css` | vue / @vjson/core 声明为 external，样式独立导出 |

发布：`pnpm -C packages/core publish` / `pnpm -C packages/editor publish`（构建产物已包含在 `files` 字段中）。

## 核心特性

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
