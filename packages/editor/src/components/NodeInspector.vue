<script setup>
  /**
   * 节点属性面板: 编辑选中 vdomJson 节点的全部字段(就地修改 reactive 节点)
   * 基础字段(type/name/key/slot) + 指令(v-if/v-for/v-show/v-model/v-bind) + 四类属性区
   */
  import PropRows from './PropRows.vue'

  const props = defineProps({
    node: { type: Object, default: null },
  })

  /** 指令字段(值为空时删除键, 保持导出 JSON 干净) */
  const DIRECTIVES = [
    { field: 'v-if', placeholder: '条件表达式, 如 showRef.value === true' },
    { field: 'v-for', placeholder: '(item, index, keyField) in dataRef.value' },
    { field: 'v-show', placeholder: '显隐表达式, 如 showRef.value' },
    { field: 'v-model', placeholder: '双向绑定表达式, 如 formRef.value.name' },
    { field: 'v-bind', placeholder: '批量绑定对象表达式, 如 attrsRef.value' },
  ]

  /** 基础文本字段(空值时删除键) */
  const BASIC = [
    { field: 'type', placeholder: 'html 标签 / 组件名 / setup 变量', required: true },
    { field: 'name', placeholder: '节点唯一名称(可选)' },
    { field: 'key', placeholder: '渲染 key(可选)' },
    { field: 'slot', placeholder: '插槽声明, 如 title / title(param)' },
  ]

  function onFieldInput(field, e) {
    const value = e.target.value.trim()
    if (value) {
      props.node[field] = value
    } else {
      delete props.node[field]
    }
  }

  function fieldValue(field) {
    return props.node[field] != null ? String(props.node[field]) : ''
  }
</script>

<template>
  <div class="inspector">
    <p v-if="!node" class="inspector-empty">在左侧节点树中点击选择一个节点进行编辑</p>
    <template v-else>
      <section class="inspector-section">
        <h4>基础字段</h4>
        <div v-for="f in BASIC" :key="f.field" class="field-row">
          <label :class="{ required: f.required }">{{ f.field }}</label>
          <input
            :value="fieldValue(f.field)"
            :placeholder="f.placeholder"
            spellcheck="false"
            @input="onFieldInput(f.field, $event)"
          />
        </div>
      </section>

      <section class="inspector-section">
        <h4>指令</h4>
        <div v-for="d in DIRECTIVES" :key="d.field" class="field-row">
          <label>{{ d.field }}</label>
          <input
            :value="fieldValue(d.field)"
            :placeholder="d.placeholder"
            spellcheck="false"
            class="mono"
            @input="onFieldInput(d.field, $event)"
          />
        </div>
      </section>

      <section class="inspector-section">
        <h4>动态属性 <code>:prop</code></h4>
        <PropRows :node="node" prefix=":" key-placeholder="属性名" value-placeholder="表达式, 如 dataRef.value" />
      </section>

      <section class="inspector-section">
        <h4>v-model 参数绑定 <code>v-model:arg</code></h4>
        <PropRows :node="node" prefix="v-model:" key-placeholder="prop 名" value-placeholder="表达式, 如 panelRef.value.title" />
      </section>

      <section class="inspector-section">
        <h4>事件 <code>@event</code></h4>
        <PropRows :node="node" prefix="@" key-placeholder="事件名, 如 click" value-placeholder="handler 或 handler($event, item)" />
      </section>

      <section class="inspector-section">
        <h4>静态属性</h4>
        <PropRows :node="node" prefix="" key-placeholder="属性名" value-placeholder="属性值(true/false 会解析为布尔)" coerce />
      </section>

      <p class="inspector-tip">子节点的增删与排序请在左侧节点树中操作</p>
    </template>
  </div>
</template>

<style scoped>
  .inspector {
    height: 100%;
    overflow-y: auto;
    padding: 10px 12px;
    box-sizing: border-box;
    font-size: 12px;
  }
  .inspector-empty {
    color: #c0c4cc;
    text-align: center;
    margin-top: 40px;
  }
  .inspector-section {
    margin-bottom: 14px;
  }
  .inspector-section h4 {
    margin: 0 0 6px;
    font-size: 12px;
    color: #606266;
    border-bottom: 1px solid #ebeef5;
    padding-bottom: 4px;
  }
  .inspector-section h4 code {
    color: #e6a23c;
    font-family: Consolas, Monaco, monospace;
  }
  .field-row {
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr);
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
  }
  .field-row label {
    font-family: Consolas, Monaco, monospace;
    color: #476582;
    text-align: right;
  }
  .field-row label.required::after {
    content: ' *';
    color: #f56c6c;
  }
  .field-row input {
    box-sizing: border-box;
    width: 100%;
    border: 1px solid #dcdfe6;
    border-radius: 3px;
    padding: 3px 6px;
    font-size: 12px;
    outline: none;
    color: #303133;
  }
  .field-row input:focus {
    border-color: #409eff;
  }
  .field-row input.mono {
    font-family: Consolas, Monaco, monospace;
  }
  .inspector-tip {
    color: #c0c4cc;
    font-size: 11px;
    text-align: center;
  }
</style>
