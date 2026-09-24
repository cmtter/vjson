# 快速上手

## 安装

```sh
# 渲染引擎核心
pnpm add @vjson/core

# 可视化编辑器(可选)
pnpm add @vjson/editor
```

## 基本使用

**第 1 步**：编写 vjson（JSON 字符串或对象均可）：

```js
const vjsonStr = `
{
  "version": "1.0.1",
  "name": "hello-page",
  "desc": "最简示例",
  "template": [
    { "name": "title", "type": "h2", "children": ["Hello vjson!"] },
    { "type": "input", "v-model": "nameRef.value", "placeholder": "请输入姓名" },
    { "type": "p", ":title": "nameRef.value", "children": ["(输入后 hover 此处查看 v-model 绑定值)" ] }
  ],
  "scriptSetup": [
    "const nameRef = ref('张三')"
  ]
}
`
```

> 注：vjson 的静态 children 字符串是纯文本，不支持 `{{ }}` 插值语法；需要展示动态文本时，可借助 `:title` 等动态属性，或在事件 handler 中驱动其他指令变化。

**第 2 步**：在业务组件中调用 `useVjsonRender` 得到 Vue 组件：

```vue
<script setup>
  import { useVjsonRender } from '@vjson/core'

  const VjsonComponent = useVjsonRender(vjsonStr)
</script>

<template>
  <VjsonComponent />
</template>
```

## 编译失败容错

`useVjsonRender` 在校验/编译失败时不会抛出异常打断页面，而是返回一个错误占位组件——开发环境（DEV）直接在页面渲染错误详情，生产环境仅在控制台输出错误。传入第二个参数 `{ silent: true }` 可改为静默模式（返回 `null`）。

## 运行时更新

vjson 内容变更后再次调用 `useVjsonRender` 时，引擎按 `name + 内容` 缓存比对，内容变化会自动重新编译；也可显式调用导出的 `recompileVjson(vjson)` 清除缓存后重编译。

## 本地开发(monorepo 仓库内)

```sh
pnpm install          # 安装全部 workspace 依赖
pnpm build            # 构建 core / editor lib 产物
pnpm play:dev         # 启动 play 验证应用
pnpm doc:dev          # 启动文档站点
```
