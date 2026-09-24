<script setup>
  /**
   * scriptSetup 代码片段编辑: 卡片列表, 支持增删/上下移, textarea 自适应高度
   * 片段顺序即执行顺序(后段可引用前段声明的变量)
   */
  import { nextTick, onMounted, ref } from 'vue'

  const props = defineProps({
    vjson: { type: Object, required: true },
  })

  const textareas = ref([])

  function ensureArray() {
    if (!Array.isArray(props.vjson.scriptSetup)) props.vjson.scriptSetup = []
    return props.vjson.scriptSetup
  }

  /** textarea 高度自适应 + 实时同步内容(驱动预览 debounce) */
  function onInput(el, i) {
    autoResize(el)
    ensureArray()[i] = el.value
  }

  function autoResize(el) {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }

  onMounted(() => {
    nextTick(() => textareas.value.forEach(autoResize))
  })

  function addSegment() {
    ensureArray().push('// 新代码片段\n')
  }

  function removeSegment(index) {
    ensureArray().splice(index, 1)
  }

  function moveSegment(index, dir) {
    const list = ensureArray()
    const target = index + dir
    if (target < 0 || target >= list.length) return
    ;[list[index], list[target]] = [list[target], list[index]]
  }
</script>

<template>
  <div class="ss-panel">
    <p class="ss-tip">
      每个卡片是一段独立 JS 代码片段，<b>按顺序</b>拼接注入 setup 函数体（后段可引用前段声明的变量）。
      可直接使用 ref / computed / watch / onMounted 等 Vue API 与 emit / slots / attrs 等内置上下文。
    </p>

    <div v-for="(segment, i) in ensureArray()" :key="i" class="ss-card">
      <div class="ss-card-head">
        <span class="ss-index">#{{ i }}</span>
        <span class="ss-ops">
          <button title="上移" :disabled="i === 0" @click="moveSegment(i, -1)">↑</button>
          <button title="下移" :disabled="i === ensureArray().length - 1" @click="moveSegment(i, 1)">↓</button>
          <button class="danger" title="删除片段" @click="removeSegment(i)">✕</button>
        </span>
      </div>
      <textarea
        :ref="(el) => (textareas[i] = el)"
        :value="segment"
        spellcheck="false"
        @input="onInput($event.target, i)"
      ></textarea>
    </div>

    <button class="ss-add" @click="addSegment">＋ 添加代码片段</button>
  </div>
</template>

<style scoped>
  .ss-panel {
    height: 100%;
    overflow-y: auto;
    padding: 10px 12px;
    box-sizing: border-box;
    font-size: 12px;
  }
  .ss-tip {
    margin: 0 0 10px;
    color: #909399;
    line-height: 1.6;
  }
  .ss-card {
    border: 1px solid #ebeef5;
    border-radius: 4px;
    margin-bottom: 8px;
    overflow: hidden;
  }
  .ss-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #f5f7fa;
    padding: 2px 6px;
  }
  .ss-index {
    font-family: Consolas, Monaco, monospace;
    color: #909399;
  }
  .ss-ops {
    display: inline-flex;
    gap: 2px;
  }
  .ss-ops button {
    border: none;
    background: none;
    cursor: pointer;
    font-size: 11px;
    color: #909399;
    padding: 1px 4px;
    border-radius: 2px;
  }
  .ss-ops button:hover:not(:disabled) {
    color: #409eff;
    background: #e8f3ff;
  }
  .ss-ops button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  .ss-ops button.danger:hover {
    color: #f56c6c;
    background: #fef0f0;
  }
  .ss-card textarea {
    display: block;
    width: 100%;
    box-sizing: border-box;
    border: none;
    outline: none;
    resize: vertical;
    min-height: 60px;
    padding: 6px 8px;
    font-family: Consolas, Monaco, monospace;
    font-size: 12px;
    line-height: 1.5;
    color: #303133;
  }
  .ss-add {
    width: 100%;
    border: 1px dashed #c0c4cc;
    background: none;
    border-radius: 4px;
    padding: 6px;
    color: #909399;
    cursor: pointer;
    font-size: 12px;
  }
  .ss-add:hover {
    color: #409eff;
    border-color: #409eff;
  }
</style>
