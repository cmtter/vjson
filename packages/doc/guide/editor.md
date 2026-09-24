# 编辑器使用手册

`@vjson/editor` 提供 vjson 可视化编辑器 `VjsonEditor`，三个标签页（vjson 节点 / scriptSetup / 样式）+ 右侧实时预览。

## 安装与使用

```sh
pnpm add @vjson/editor
```

```vue
<script setup>
  import { reactive } from 'vue'
  import { VjsonEditor } from '@vjson/editor'
  import '@vjson/editor/style.css'

  // vjson 定义(reactive 对象, 编辑器就地修改)
  const vjson = reactive({
    version: '1.0.1',
    name: 'demo-page',
    desc: '示例',
    template: [{ type: 'div', children: ['Hello'] }],
    scriptSetup: [],
    style: '',
  })
</script>

<template>
  <VjsonEditor :vjson="vjson" />
</template>
```

## Props

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `vjson` | Object | 必填 | reactive vjson 对象，编辑器**就地修改**该对象 |
| `debounceDelay` | Number | 300 | 预览重编译防抖（ms） |

## vjson 节点标签页

- **结构化模式**：左侧节点树（选择 / 增删子节点 / 上下移动），右侧属性面板编辑选中节点的基础字段（type/name/key/slot）、指令（v-if/v-for/v-show/v-model/v-bind）与四类属性区（静态属性 / 动态属性 `:prop` / 事件 `@event` / v-model 参数 `v-model:arg`）；
- **JSON 源码模式**：直接编辑 template 节点数组的 JSON 文本，停止输入 500ms 后自动应用（格式错误时行内提示，不应用）。

## scriptSetup 标签页

卡片列表编辑代码片段，支持增删 / 上下移动；**片段顺序即执行顺序**（后段可引用前段声明的变量），textarea 高度自适应。

## 样式标签页

编辑 vjson 扩展字段 `style`（纯 CSS 文本），预览时动态注入 `<style data-vjson-editor>`，随 vjson 一起导出。

## 实时预览

- 监听整个 vjson 对象，防抖后重编译预览（引擎按 name + 内容缓存，内容不变零编译）；
- 编译失败时预览区显示错误详情并标记"编译失败"状态；
- 预览组件 `markRaw` + key 强制重挂载，保证 scriptSetup 状态重建。

## 工具栏

| 操作 | 说明 |
| --- | --- |
| 导入 | 选择本地 .json 文件，解析后整体替换 vjson 内容（保留 reactive 引用） |
| 导出 | 下载当前 vjson 为 `{name}.json` |
| 复制 JSON | 复制格式化 JSON 到剪贴板（非安全上下文自动降级 execCommand） |

## 轻量化设计

无第三方编辑器依赖；树 / 面板就地编辑 reactive 对象，无深拷贝开销；预览 debounce 300ms + markRaw + 组件缓存。
