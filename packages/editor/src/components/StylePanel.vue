<script setup>
  /**
   * 样式编辑: 编辑 vjson 扩展字段 style(纯 CSS 文本), 预览时由 VjsonEditor 动态注入 <style>
   * 建议: 组件元素带 data-vjson-{name} 作用域属性, 可用 [data-vjson-{name}] 前缀限定样式范围
   */
  import { computed } from 'vue'

  const props = defineProps({
    vjson: { type: Object, required: true },
  })

  const css = computed({
    get: () => (typeof props.vjson.style === 'string' ? props.vjson.style : ''),
    set: (v) => {
      if (v) props.vjson.style = v
      else delete props.vjson.style
    },
  })

  const scopeHint = computed(() =>
    props.vjson.name ? `[data-vjson-${props.vjson.name}]` : '[data-vjson-组件name]'
  )
</script>

<template>
  <div class="style-panel">
    <p class="style-tip">
      编写组件级 CSS（随 vjson 一起保存/导出，预览时实时注入）。组件内元素自动携带作用域属性，可用
      <code>{{ scopeHint }}</code> 作为选择器前缀避免样式污染，例如：
      <code>{{ scopeHint }} .section { margin: 12px 0; }</code>
    </p>
    <textarea
      v-model="css"
      class="style-input"
      spellcheck="false"
      placeholder="/* 组件样式, 如 */&#10;.vjson-demo .section {&#10;  margin: 12px 0;&#10;}"
    ></textarea>
  </div>
</template>

<style scoped>
  .style-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 10px 12px;
    box-sizing: border-box;
    font-size: 12px;
  }
  .style-tip {
    margin: 0 0 8px;
    color: #909399;
    line-height: 1.6;
  }
  .style-tip code {
    font-family: Consolas, Monaco, monospace;
    color: #e6a23c;
    background: #fdf6ec;
    padding: 0 3px;
    border-radius: 2px;
  }
  .style-input {
    flex: 1;
    min-height: 200px;
    box-sizing: border-box;
    width: 100%;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    padding: 8px;
    font-family: Consolas, Monaco, monospace;
    font-size: 12px;
    line-height: 1.6;
    color: #303133;
    outline: none;
    resize: none;
  }
  .style-input:focus {
    border-color: #409eff;
  }
</style>
