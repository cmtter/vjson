<script setup>
  /**
   * 通用属性键值行编辑: 按前缀过滤节点属性, 就地增删改
   * prefix: ''(静态属性) | ':'(动态属性) | '@'(事件) | 'v-model:'(参数绑定)
   */
  import { computed, reactive } from 'vue'
  import { NODE_RESERVED_FIELDS, coerceValue, renameNodeKey } from '../utils.js'

  const props = defineProps({
    node: { type: Object, required: true },
    prefix: { type: String, default: '' },
    keyPlaceholder: { type: String, default: '属性名' },
    valuePlaceholder: { type: String, default: '属性值' },
    /** 静态属性模式: 'true'/'false' 解析为布尔 */
    coerce: { type: Boolean, default: false },
  })

  const isStatic = computed(() => props.prefix === '')

  /** 当前前缀下的属性行(依赖 props.node 的响应式键值) */
  const rows = computed(() => {
    const out = []
    for (const [field, value] of Object.entries(props.node)) {
      if (isStatic.value) {
        if (NODE_RESERVED_FIELDS.has(field)) continue
        if (field.startsWith(':') || field.startsWith('@') || field.startsWith('v-model:')) continue
      } else if (!field.startsWith(props.prefix)) {
        continue
      }
      out.push({ key: field, value })
    }
    return out
  })

  const adding = reactive({ key: '', value: '' })

  function fullKey(key) {
    return props.prefix + key
  }

  /** 值编辑(静态属性做布尔字面量推断) */
  function onValueInput(row, e) {
    const raw = e.target.value
    props.node[row.key] = props.coerce ? coerceValue(raw) : raw
  }

  /** 键重命名(失焦确认, 冲突/非法时还原) */
  function onKeyChange(row, e) {
    const input = e.target
    if (!renameNodeKey(props.node, row.key, fullKey(input.value))) {
      input.value = row.key.slice(props.prefix.length)
    }
  }

  function removeRow(row) {
    delete props.node[row.key]
  }

  function addRow() {
    const key = adding.key.trim()
    if (!key || fullKey(key) in props.node) return
    props.node[fullKey(key)] = props.coerce ? coerceValue(adding.value) : adding.value
    adding.key = ''
    adding.value = ''
  }
</script>

<template>
  <div class="prop-rows">
    <div v-if="rows.length" class="prop-rows-list">
      <div v-for="row in rows" :key="row.key" class="prop-row">
        <span class="prop-prefix" :class="{ transparent: !prefix }">{{ prefix || '·' }}</span>
        <input
          class="prop-key"
          :value="row.key.slice(prefix.length)"
          :placeholder="keyPlaceholder"
          spellcheck="false"
          @change="onKeyChange(row, $event)"
        />
        <input
          class="prop-value"
          :value="String(row.value)"
          :placeholder="valuePlaceholder"
          spellcheck="false"
          @input="onValueInput(row, $event)"
        />
        <button class="prop-del" title="删除属性" @click="removeRow(row)">✕</button>
      </div>
    </div>
    <p v-else class="prop-empty">暂无{{ keyPlaceholder }}配置</p>

    <div class="prop-row prop-add">
      <span class="prop-prefix" :class="{ transparent: !prefix }">{{ prefix || '·' }}</span>
      <input v-model="adding.key" class="prop-key" :placeholder="keyPlaceholder" spellcheck="false" @keyup.enter="addRow" />
      <input v-model="adding.value" class="prop-value" :placeholder="valuePlaceholder" spellcheck="false" @keyup.enter="addRow" />
      <button class="prop-add-btn" title="添加" :disabled="!adding.key.trim()" @click="addRow">＋</button>
    </div>
  </div>
</template>

<style scoped>
  .prop-rows-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 6px;
  }
  .prop-row {
    display: grid;
    grid-template-columns: 26px minmax(0, 1fr) minmax(0, 1.4fr) 24px;
    align-items: center;
    gap: 4px;
  }
  .prop-add {
    border-top: 1px dashed #e4e7ed;
    padding-top: 6px;
  }
  .prop-key,
  .prop-value {
    min-width: 0;
    box-sizing: border-box;
    border: 1px solid #dcdfe6;
    border-radius: 3px;
    padding: 3px 6px;
    font-size: 12px;
    color: #303133;
    outline: none;
  }
  .prop-key:focus,
  .prop-value:focus {
    border-color: #409eff;
  }
  .prop-key {
    font-family: Consolas, Monaco, monospace;
    color: #476582;
  }
  .prop-prefix {
    font-family: Consolas, Monaco, monospace;
    font-size: 11px;
    color: #e6a23c;
    text-align: center;
  }
  .prop-prefix.transparent {
    color: transparent;
  }
  .prop-del,
  .prop-add-btn {
    border: none;
    background: none;
    cursor: pointer;
    font-size: 12px;
    color: #909399;
    padding: 2px 4px;
    border-radius: 3px;
  }
  .prop-del:hover {
    color: #f56c6c;
    background: #fef0f0;
  }
  .prop-add-btn:hover:not(:disabled) {
    color: #409eff;
    background: #ecf5ff;
  }
  .prop-add-btn:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }
  .prop-empty {
    margin: 0 0 6px;
    font-size: 12px;
    color: #c0c4cc;
  }
</style>
