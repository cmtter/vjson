<script setup>
  /**
   * 运行时渲染 demo: 覆盖静态/动态属性、事件、v-if/v-for/v-show/v-model/v-bind、
   * 默认/具名/作用域插槽、el-table 集成(来自 README 完整示例)
   */
  import { useVjsonRender } from '@vjson/core'

  const vjsonStr = `
  {
    "version": "1.0.1",
    "name": "demo-page",
    "desc": "vjson 运行时渲染完整示例",
    "template": [
      {
        "name": "root",
        "type": "div",
        "class": "vjson-demo",
        "children": [
          { "name": "title", "type": "h2", "children": ["vjson 运行时渲染示例"] },

          { "name": "show-p", "type": "p", "v-show": "showRef.value", "children": ["我是被 v-show 控制的段落"] },
          { "name": "toggle-btn", "type": "button", "@click": "handleToggle", "children": ["切换 v-show / v-if"] },

          {
            "name": "form-area",
            "type": "div",
            "v-if": "showRef.value",
            "class": "section",
            "children": [
              { "type": "label", "children": ["姓名:"] },
              { "type": "input", "v-model": "formRef.value.name", "placeholder": "请输入姓名" },
              { "type": "input", ":type": "'checkbox'", "v-model": "formRef.value.agree" },
              { "type": "span", "children": [" 同意条款"] }
            ]
          },

          {
            "name": "list-area",
            "type": "ul",
            "class": "section",
            "children": [
              {
                "type": "li",
                "v-for": "(item, index, id) in listRef.value",
                ":title": "item.label",
                "@click": "handleSelect($event, item)",
                "children": ["列表项(keyField=id, 点击试试): "]
              }
            ]
          },

          {
            "name": "bind-area",
            "type": "div",
            "v-bind": "attrsRef.value",
            "children": ["我是被 v-bind 批量绑定属性的节点(打开 devtools 查看 class / data-role)"]
          },

          {
            "name": "table-area",
            "type": "div",
            "class": "section",
            "children": [
              {
                "name": "user-table",
                "type": "el-table",
                ":data": "tableRef.value",
                "border": true,
                "stripe": true,
                "@row-click": "handleRowClick",
                "children": [
                  { "type": "el-table-column", "prop": "id", "label": "ID", "width": "80" },
                  { "type": "el-table-column", "prop": "name", "label": "姓名" },
                  { "type": "el-table-column", "prop": "age", "label": "年龄", "width": "100" },
                  { "type": "el-table-column", "prop": "city", "label": "城市" },
                  {
                    "type": "el-table-column",
                    "label": "操作",
                    "width": "120",
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
            ]
          },

          {
            "name": "panel",
            "type": "MyPanel",
            "v-model:title": "panelRef.value.title",
            "children": [
              { "slot": "title", "type": "span", "style": "color:#e6a23c", "children": ["具名插槽 title 内容"] },
              {
                "slot": "default(item)",
                "type": "div",
                "children": [
                  { "type": "p", ":title": "item.label", "children": ["作用域插槽内容(hover 查看作用域数据)"] },
                  { "type": "button", "@click": "handleSelect($event, item)", "children": ["点击作用域数据"] }
                ]
              }
            ]
          }
        ]
      }
    ],
    "scriptSetup": [
      "const showRef = ref(true)\\nconst formRef = ref({ name: '张三', agree: true })\\nconst listRef = ref([{ id: 1, label: '苹果' }, { id: 2, label: '香蕉' }, { id: 3, label: '橙子' }])\\nconst panelRef = ref({ title: '面板标题' })\\nconst attrsRef = ref({ class: 'bind-area', 'data-role': 'demo' })\\nconst tableRef = ref([{ id: 1, name: '张三', age: 25, city: '北京' }, { id: 2, name: '李四', age: 32, city: '上海' }, { id: 3, name: '王五', age: 28, city: '广州' }])",
      "const handleToggle = () => { showRef.value = !showRef.value }",
      "const handleSelect = (e, item) => { alert('选中: ' + item.label) }",
      "const handleRowClick = (row, column, event) => { alert('点击行: ' + row.name) }",
      "const handleEdit = (e, row) => { e.stopPropagation(); alert('编辑: ' + row.name) }",
      "const MyPanel = defineComponent({ name: 'MyPanel', props: { title: String }, emits: ['update:title'], setup(panelProps, { emit, slots }) { return () => h('div', { style: 'border:1px solid #dcdfe6;border-radius:6px;padding:12px;margin-top:12px;text-align:left;' }, [ h('div', { style: 'font-weight:600;margin-bottom:8px;' }, slots.title ? slots.title() : panelProps.title), h('button', { onClick: () => emit('update:title', panelProps.title + '~') }, '点我触发 v-model:title 回写'), slots.default ? slots.default({ label: '来自插槽作用域的数据' }) : null ]) } })"
    ]
  }
  `
  const VjsonComponent = useVjsonRender(vjsonStr)
</script>

<template>
  <VjsonComponent />
</template>

<style>
  .vjson-demo .section {
    margin: 12px 0;
    max-width: 720px;
  }
  .vjson-demo button {
    margin-right: 8px;
    cursor: pointer;
  }
  .vjson-demo li {
    cursor: pointer;
    color: #409eff;
  }
  .vjson-demo .bind-area {
    margin: 12px 0;
    padding: 8px;
    background: #f5f7fa;
    border-radius: 4px;
  }
</style>
