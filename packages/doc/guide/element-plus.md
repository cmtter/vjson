# Element Plus 集成

vjson 通过 Vue 的全局注册组件机制天然支持任意组件库，以 Element Plus 为例。

## 第 1 步：全局注册组件库

```js
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'

createApp(App).use(ElementPlus).mount('#app')
```

## 第 2 步：vjson 中以组件名直接引用

支持 `el-table` 这类中划线命名，引擎会自动回退到全局注册组件解析：

```jsonc
{
  "type": "el-table",
  ":data": "tableRef.value",
  "border": true,
  "stripe": true,
  "@row-click": "handleRowClick",
  "children": [
    { "type": "el-table-column", "prop": "name", "label": "姓名" },
    {
      "type": "el-table-column",
      "label": "操作",
      "children": [
        {
          "slot": "default(scope)",
          "type": "el-button",
          "size": "small",
          ":type": "'primary'",
          "@click": "handleEdit($event, scope.row)",
          "children": ["编辑"]
        }
      ]
    }
  ]
}
```

## 要点说明

- `:data` 动态属性绑定表格数据源；`border`/`stripe` 为静态布尔属性；
- `@row-click` 使用标识符事件形式；
- 操作列通过 `"slot": "default(scope)"` 声明作用域插槽，`scope.row` 取行数据；
- 按钮的 `type="primary"` 因与 vjson 保留字段冲突，写作 `":type": "'primary'"`；
- 事件冒泡：vjson 暂不支持 `.stop` 等事件修饰符，需要阻断冒泡时在 handler 内调用 `$event.stopPropagation()`（例如阻止按钮 click 冒泡触发 `@row-click`）。
