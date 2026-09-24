<script setup>
  /**
   * 递归 vdomJson 节点树: 展示/选中/折叠, 携带兄弟数组与下标向上冒泡增删移动事件
   * 事件约定:
   *   select(node)                      选中节点
   *   add-child(node)                   在 node 下追加子节点
   *   remove({ list, index })           删除节点(list 为其兄弟数组)
   *   move({ list, index, dir })        上移/下移(dir: -1 | 1)
   */
  import { computed, ref } from 'vue'

  defineOptions({ name: 'NodeTree' })

  const props = defineProps({
    node: { type: [Object, String], required: true },
    selected: { type: Object, default: null },
    /** 兄弟节点数组与自身下标(用于删除/移动) */
    siblingList: { type: Array, default: null },
    index: { type: Number, default: 0 },
    depth: { type: Number, default: 0 },
  })

  const emit = defineEmits(['select', 'add-child', 'remove', 'move'])

  const expanded = ref(true)
  const isText = computed(() => typeof props.node === 'string')
  const children = computed(() => (isText.value ? null : Array.isArray(props.node.children) ? props.node.children : null))

  /** 指令徽标(存在即展示, 仅对象节点) */
  const directives = computed(() =>
    isText.value
      ? []
      : ['v-if', 'v-for', 'v-show', 'v-model', 'v-bind'].filter((d) => props.node[d] != null)
  )

  /** 属性徽标计数 */
  const attrCount = computed(() => {
    if (isText.value) return 0
    let n = 0
    for (const field of Object.keys(props.node)) {
      if (field.startsWith(':') || field.startsWith('@') || field.startsWith('v-model:')) n++
    }
    return n
  })

  /** 文本节点预览(超长截断) */
  const textPreview = computed(() => {
    const t = String(props.node)
    return t.length > 18 ? t.slice(0, 18) + '…' : t
  })

  function toggle(e) {
    e.stopPropagation()
    expanded.value = !expanded.value
  }
</script>

<template>
  <div class="node-tree">
    <!-- 文本子节点: 只展示/删除/移动, 内容请在 JSON 源码模式编辑 -->
    <div
      v-if="isText"
      class="tree-row text-row"
      :style="{ paddingLeft: depth * 14 + 8 + 'px' }"
      title="文本子节点, 内容请在 JSON 源码模式编辑"
    >
      <span class="tree-toggle placeholder"></span>
      <span class="tree-text">"{{ textPreview }}"</span>
      <span class="tree-spacer"></span>
      <span class="tree-ops" @click.stop>
        <button v-if="index > 0" title="上移" @click="emit('move', { list: siblingList, index, dir: -1 })">↑</button>
        <button v-if="siblingList && index < siblingList.length - 1" title="下移" @click="emit('move', { list: siblingList, index, dir: 1 })">↓</button>
        <button class="danger" title="删除节点" @click="emit('remove', { list: siblingList, index })">✕</button>
      </span>
    </div>

    <template v-else>
    <div
      class="tree-row"
      :class="{ selected: node === selected }"
      :style="{ paddingLeft: depth * 14 + 8 + 'px' }"
      @click="emit('select', node)"
    >
      <span v-if="children && children.length" class="tree-toggle" @click="toggle">{{ expanded ? '▾' : '▸' }}</span>
      <span v-else class="tree-toggle placeholder"></span>
      <span class="tree-type">{{ node.type }}</span>
      <span v-if="node.name" class="tree-name">{{ node.name }}</span>
      <span v-if="node.slot" class="tree-badge slot">slot:{{ node.slot }}</span>
      <span v-for="d in directives" :key="d" class="tree-badge directive">{{ d }}</span>
      <span v-if="attrCount" class="tree-badge attr">{{ attrCount }} 属性</span>
      <span class="tree-spacer"></span>
      <span class="tree-ops" @click.stop>
        <button title="添加子节点" @click="emit('add-child', node)">＋</button>
        <button v-if="index > 0" title="上移" @click="emit('move', { list: siblingList, index, dir: -1 })">↑</button>
        <button v-if="siblingList && index < siblingList.length - 1" title="下移" @click="emit('move', { list: siblingList, index, dir: 1 })">↓</button>
        <button class="danger" title="删除节点" @click="emit('remove', { list: siblingList, index })">✕</button>
      </span>
    </div>
    <div v-if="expanded && children && children.length" class="tree-children">
      <NodeTree
        v-for="(child, i) in children"
        :key="i"
        :node="child"
        :selected="selected"
        :sibling-list="children"
        :index="i"
        :depth="depth + 1"
        @select="emit('select', $event)"
        @add-child="emit('add-child', $event)"
        @remove="emit('remove', $event)"
        @move="emit('move', $event)"
      />
    </div>
    </template>
  </div>
</template>

<style scoped>
  .tree-row {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 6px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 12px;
    white-space: nowrap;
  }
  .tree-row:hover {
    background: #f5f7fa;
  }
  .tree-row.selected {
    background: #ecf5ff;
    outline: 1px solid #b3d8ff;
  }
  .tree-toggle {
    width: 12px;
    text-align: center;
    color: #909399;
    font-size: 10px;
    flex: none;
    user-select: none;
  }
  .tree-toggle.placeholder {
    visibility: hidden;
  }
  .tree-type {
    font-family: Consolas, Monaco, monospace;
    color: #409eff;
    font-weight: 600;
  }
  .tree-name {
    color: #909399;
  }
  .tree-text {
    font-family: Consolas, Monaco, monospace;
    color: #c0c4cc;
    font-style: italic;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .text-row {
    cursor: default;
  }
  .tree-badge {
    font-size: 10px;
    padding: 0 4px;
    border-radius: 2px;
    line-height: 16px;
    flex: none;
  }
  .tree-badge.directive {
    background: #f0f9eb;
    color: #67c23a;
  }
  .tree-badge.slot {
    background: #fdf6ec;
    color: #e6a23c;
  }
  .tree-badge.attr {
    background: #f4f4f5;
    color: #909399;
  }
  .tree-spacer {
    flex: 1;
  }
  .tree-ops {
    display: none;
    gap: 2px;
  }
  .tree-row:hover .tree-ops {
    display: inline-flex;
  }
  .tree-ops button {
    border: none;
    background: none;
    cursor: pointer;
    font-size: 11px;
    color: #909399;
    padding: 1px 4px;
    border-radius: 2px;
  }
  .tree-ops button:hover {
    color: #409eff;
    background: #e8f3ff;
  }
  .tree-ops button.danger:hover {
    color: #f56c6c;
    background: #fef0f0;
  }
</style>
