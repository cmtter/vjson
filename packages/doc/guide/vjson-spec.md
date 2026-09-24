# vjson 数据结构规范

## 顶层字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `version` | string | 否 | 规范版本号（如 `'1.0.1'`），用于协议演进 |
| `name` | string | 是 | 组件名称，**必须唯一**；用作组件 `name` 选项、`__scopeId`（`data-vjson-{name}`）与缓存 key，仅允许字母、数字、下划线、中划线 |
| `desc` | string | 否 | 组件描述，纯元信息不参与渲染 |
| `template` | vdomJson[] | 是 | 页面元素描述（类比 SFC `<template>`），非空数组，支持多根节点（fragment） |
| `scriptSetup` | string[] | 否 | setup 业务逻辑代码片段数组（类比 `<script setup>`），按数组顺序拼接执行 |
| `style` | string | 否 | 编辑器扩展字段（纯 CSS 文本），预览时动态注入，随 vjson 一起导出 |

## vdomJson 节点字段

一个节点即一个对象，除 `children` 内的纯字符串（文本子节点）外，核心字段如下：

### 节点标识

| 字段 | 说明 |
| --- | --- |
| `key` | 节点渲染 key（diff 用）；v-for 节点优先使用 keyField 取出的循环 key |
| `name` | 节点唯一名称（内部标识，便于定位/排查） |
| `type` | 节点类型，三种取值见下文 |

### type 的三种取值形式

| 形式 | 示例 | 解析方式 |
| --- | --- | --- |
| HTML 标签 | `'div'`、`'input'` | 直接作为 `h()` 的元素类型 |
| Vue 组件名 | `'el-table'`、`'ElTable'` | 先尝试 setup 上下文变量，再回退当前应用的全局注册组件（`resolveComponent`），支持中划线命名 |
| setup 上下文变量 | `'MyPanel'` | 直接引用 `scriptSetup` 中定义的组件变量（需为合法 JS 标识符） |

### 属性写法

```jsonc
{
  "type": "input",
  "placeholder": "请输入姓名",        // 静态属性: 字符串字面量原样透传
  "disabled": true,                   // 静态属性: 布尔等 JSON 字面量同样透传
  ":value": "formRef.value.name",     // 动态属性: ':prop' 前缀, 值为表达式字符串
  "v-bind": "attrsRef.value"          // 批量绑定: 求值对象 Object.assign 合并, 覆盖同名属性
}
```

### 事件绑定（`@eventName`）

两种形式：

```jsonc
{
  "type": "button",
  "@click": "handleClick",                    // 形式1: 标识符, 直接引用 setup 上下文函数
  "@click": "handleClick($event, item)"       // 形式2: 内联语句, 包装为 ($event) => (...) 执行
}
```

内联形式中的 `$event` 为 Vue 事件对象，`item` 等其他标识符来自外层 v-for / 作用域插槽的闭包变量。事件最终映射为 `h()` 属性中的 `onEventName`（如 `@row-click` → `onRowClick`）。

### 指令语法

```jsonc
{
  "v-if": "showRef.value === true",              // 条件渲染: 为真才渲染
  "v-show": "showRef.value",                     // 显隐控制: 指令方式, 保留 DOM
  "v-for": "(item, index, keyField) in listRef.value",  // 列表循环
  "v-model": "formRef.value.name",               // 双向绑定(默认)
  "v-model:title": "panelRef.value.title"        // 双向绑定(指定 prop)
}
```

**v-for 与 keyField**：`(item, index, keyField) in 数据源表达式` 中——

- `item`、`index` 与 Vue 原生语义一致；
- `keyField` 是第三个参数，声明"从 `item[keyField]` 中取出循环节点的 key"（例如 `(item, index, id) in listRef.value` 会以 `item.id` 作为节点 key）；缺省时回退使用 index 作为 key；
- v-for 与 v-if 同时存在时，**v-for 优先**（循环先展开，v-if 在每个循环体内生效），与 Vue SFC 语义一致。

### v-model 语义区分

| 场景 | 生成结果 |
| --- | --- |
| 组件 + 默认 | `value` 属性 + `onUpdate:value` 回调（遵循 vjson 规范，默认 prop 为 `value`） |
| 组件 + `v-model:title` | `title` 属性 + `onUpdate:title` 回调 |
| 原生 input（text 等默认） | `value` 属性 + `onInput` 回调 |
| 原生 input（`:type` 为 checkbox/radio） | `checked` 属性 + `onChange` 回调 |
| 原生 select | `value` 属性 + `onChange` 回调 |

### children 与插槽写法

`children` 为子节点数组，元素可以是纯字符串（文本子节点）或 vdomJson 节点。对 HTML 标签而言 children 就是普通子节点；对**组件**而言 children 会按 `slot` 声明分组生成为插槽对象，三种写法：

```jsonc
{
  "type": "MyPanel",
  "children": [
    // 1. 默认插槽: 不声明 slot 字段, 或 slot: "default"
    { "type": "span", "children": ["默认插槽内容"] },

    // 2. 具名插槽: slot 为插槽名, 内容渲染到组件的 name 对应插槽
    { "slot": "title", "type": "span", "children": ["具名插槽内容"] },

    // 3. 带参数的作用域插槽: slot: "插槽名(参数名)", 参数接收组件回传的插槽 props
    {
      "slot": "default(item)",
      "type": "p",
      ":title": "item.label",
      "children": ["作用域插槽内容"]
    }
  ]
}
```

> 注意：作用域插槽的参数拿到的是**完整的插槽 props 对象**（如 Element Plus 的 `default(scope)` 中用 `scope.row`），并非解构后的单值。

### 保留字段冲突（重要）

`type`、`key`、`name`、`slot`、`children`、以及全部 `v-` / `@` / `:` 前缀字段是 vjson 的保留字段。若组件本身的属性与之同名（最典型的是 `el-button` 的 `type="primary"`、原生 `input` 的 `type="checkbox"`），**必须改用动态属性形式表达**：

```jsonc
{ "type": "el-button", ":type": "'primary'" }     // 而不是 "type": "primary"
{ "type": "input", ":type": "'checkbox'" }        // 而不是 "type": "checkbox"
```

否则 JSON 同名字段会被 vjson 当作组件类型字段消费，直接破坏节点解析。
