<script setup>
  /**
   * VjsonEditor: vjson 可视化编辑器主组件
   * 三个标签页: vjson节点(结构化树/JSON源码双模式) / scriptSetup / 样式 + 右侧实时预览
   *
   * 用法(传入 reactive vjson 对象, 编辑器就地修改):
   *   const vjson = reactive({ version, name, desc, template, scriptSetup, style })
   *   <VjsonEditor :vjson="vjson" />
   *
   * 轻量化设计: 无第三方编辑器依赖; 预览 debounce 300ms + markRaw + 组件缓存(compileVjson 按
   * name+内容缓存, 内容不变零编译); 树/面板就地编辑 reactive 对象, 无深拷贝开销
   */
  import { defineComponent, h, markRaw, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
  import { compileVjson } from '@vjson/core'
  import NodeTree from './components/NodeTree.vue'
  import NodeInspector from './components/NodeInspector.vue'
  import ScriptSetupPanel from './components/ScriptSetupPanel.vue'
  import StylePanel from './components/StylePanel.vue'
  import { createEmptyNode, downloadJson, replaceVjsonContent } from './utils.js'

  const props = defineProps({
    vjson: { type: Object, required: true },
    /** 预览重编译防抖(ms) */
    debounceDelay: { type: Number, default: 300 },
  })

  /* ---------------- 标签页与节点树 ---------------- */
  const activeTab = ref('node')
  const tabs = [
    { key: 'node', label: 'vjson节点' },
    { key: 'scriptSetup', label: 'scriptSetup' },
    { key: 'style', label: '样式' },
  ]
  const nodeMode = ref('tree') // tree: 结构化 | source: JSON 源码
  const selectedNode = ref(null)

  function onSelectNode(node) {
    selectedNode.value = node
  }

  function onAddChild(node) {
    if (!Array.isArray(node.children)) node.children = []
    const child = createEmptyNode()
    node.children.push(child)
    selectedNode.value = child
  }

  function onRemoveNode({ list, index }) {
    const [removed] = list.splice(index, 1)
    if (selectedNode.value === removed) selectedNode.value = null
  }

  function onMoveNode({ list, index, dir }) {
    const target = index + dir
    if (target < 0 || target >= list.length) return
    ;[list[index], list[target]] = [list[target], list[index]]
  }

  function addRootNode() {
    if (!Array.isArray(props.vjson.template)) props.vjson.template = []
    const node = createEmptyNode()
    props.vjson.template.push(node)
    selectedNode.value = node
  }

  /* ---------------- JSON 源码模式(仅编辑 template) ---------------- */
  const jsonText = ref('')
  const jsonError = ref('')
  let sourceTimer = null

  watch(nodeMode, (mode) => {
    if (mode === 'source') {
      jsonText.value = JSON.stringify(props.vjson.template ?? [], null, 2)
      jsonError.value = ''
    }
  })

  function onSourceInput(e) {
    jsonText.value = e.target.value
    clearTimeout(sourceTimer)
    sourceTimer = setTimeout(() => {
      try {
        const parsed = JSON.parse(jsonText.value)
        if (!Array.isArray(parsed)) throw new Error('顶层必须是 vdomJson 节点数组')
        if (!Array.isArray(props.vjson.template)) props.vjson.template = []
        props.vjson.template.splice(0, props.vjson.template.length, ...parsed)
        selectedNode.value = null // 树已整体替换, 旧选中引用失效
        jsonError.value = ''
      } catch (err) {
        jsonError.value = err.message
      }
    }, 500)
  }

  /* ---------------- 实时预览 ---------------- */
  const previewComp = shallowRef(null)
  const previewKey = ref(0)
  const compileError = ref('')
  let previewTimer = null

  function compilePreview() {
    let comp
    try {
      comp = compileVjson(props.vjson) // 内部按 name+内容缓存, 内容不变零编译
      compileError.value = ''
    } catch (err) {
      compileError.value = err.message
      comp = defineComponent({
        name: 'VjsonEditorError',
        render: () =>
          h(
            'pre',
            { class: 'vje-preview-error' },
            `[vjson] 编译失败:\n${err.message}`
          ),
      })
    }
    previewComp.value = markRaw(comp)
    previewKey.value++ // 强制重挂载, 保证 scriptSetup 状态重建
  }

  // 监听整个 vjson 对象(JSON.stringify 收集全部深层依赖), 防抖重编译
  watch(
    () => JSON.stringify(props.vjson),
    () => {
      clearTimeout(previewTimer)
      previewTimer = setTimeout(compilePreview, props.debounceDelay)
    },
    { immediate: true }
  )

  /* ---------------- 样式注入(编辑器扩展字段 style) ---------------- */
  let styleEl = null
  onMounted(() => {
    styleEl = document.createElement('style')
    styleEl.setAttribute('data-vjson-editor', '')
    document.head.appendChild(styleEl)
    watch(
      () => props.vjson.style,
      (css) => {
        if (styleEl) styleEl.textContent = typeof css === 'string' ? css : ''
      },
      { immediate: true }
    )
  })
  onBeforeUnmount(() => {
    styleEl?.remove()
    styleEl = null
    clearTimeout(previewTimer)
    clearTimeout(sourceTimer)
  })

  /* ---------------- 工具栏: 导入/导出/复制 ---------------- */
  const fileInput = ref(null)
  const toast = ref('')
  let toastTimer = null

  function showToast(msg) {
    toast.value = msg
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => (toast.value = ''), 2000)
  }

  function triggerImport() {
    fileInput.value?.click()
  }

  async function onImportFile(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // 允许重复导入同一文件
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text())
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('必须是 vjson 对象')
      replaceVjsonContent(props.vjson, parsed)
      selectedNode.value = null
      showToast('导入成功')
    } catch (err) {
      showToast(`导入失败: ${err.message}`)
    }
  }

  function onExport() {
    downloadJson(props.vjson, `${props.vjson.name || 'vjson'}.json`)
  }

  async function onCopy() {
    const text = JSON.stringify(props.vjson, null, 2)
    try {
      await navigator.clipboard.writeText(text)
      showToast('已复制 JSON 到剪贴板')
    } catch {
      // 非安全上下文降级: 选中隐藏 textarea 复制
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
      showToast('已复制 JSON')
    }
  }
</script>

<template>
  <div class="vje">
    <header class="vje-toolbar">
      <div class="vje-title">
        <span class="vje-name">{{ vjson.name || '(未命名组件)' }}</span>
        <span v-if="vjson.desc" class="vje-desc">{{ vjson.desc }}</span>
      </div>
      <div class="vje-actions">
        <input ref="fileInput" type="file" accept=".json,application/json" hidden @change="onImportFile" />
        <button @click="triggerImport">导入</button>
        <button @click="onExport">导出</button>
        <button @click="onCopy">复制 JSON</button>
        <span v-if="toast" class="vje-toast">{{ toast }}</span>
      </div>
    </header>

    <div class="vje-body">
      <section class="vje-editor">
        <nav class="vje-tabs">
          <button
            v-for="t in tabs"
            :key="t.key"
            :class="{ active: activeTab === t.key }"
            @click="activeTab = t.key"
          >
            {{ t.label }}
          </button>
          <span class="vje-tabs-extra">
            <template v-if="activeTab === 'node'">
              <button :class="{ active: nodeMode === 'tree' }" @click="nodeMode = 'tree'">结构化</button>
              <button :class="{ active: nodeMode === 'source' }" @click="nodeMode = 'source'">JSON 源码</button>
            </template>
          </span>
        </nav>

        <div class="vje-panel">
          <template v-if="activeTab === 'node'">
            <div v-if="nodeMode === 'tree'" class="vje-node-split">
              <div class="vje-tree">
                <div class="vje-tree-list">
                  <NodeTree
                    v-for="(node, i) in vjson.template || []"
                    :key="i"
                    :node="node"
                    :selected="selectedNode"
                    :sibling-list="vjson.template"
                    :index="i"
                    @select="onSelectNode"
                    @add-child="onAddChild"
                    @remove="onRemoveNode"
                    @move="onMoveNode"
                  />
                </div>
                <button class="vje-add-root" @click="addRootNode">＋ 添加根节点</button>
              </div>
              <div class="vje-inspector">
                <NodeInspector :node="selectedNode" />
              </div>
            </div>
            <div v-else class="vje-source">
              <textarea :value="jsonText" spellcheck="false" @input="onSourceInput"></textarea>
              <p v-if="jsonError" class="vje-error">JSON 错误: {{ jsonError }}</p>
              <p v-else class="vje-source-tip">编辑 template 节点数组, 停止输入 500ms 后自动应用</p>
            </div>
          </template>
          <ScriptSetupPanel v-else-if="activeTab === 'scriptSetup'" :vjson="vjson" />
          <StylePanel v-else :vjson="vjson" />
        </div>
      </section>

      <section class="vje-preview">
        <div class="vje-preview-head">
          <span>实时预览</span>
          <span class="vje-status" :class="compileError ? 'err' : 'ok'">
            {{ compileError ? '编译失败' : '编译正常' }}
          </span>
        </div>
        <div class="vje-preview-body">
          <component :is="previewComp" v-if="previewComp" :key="previewKey" />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
  .vje {
    display: flex;
    flex-direction: column;
    border: 1px solid #dcdfe6;
    border-radius: 6px;
    background: #fff;
    height: 100%;
    min-height: 560px;
    overflow: hidden;
  }
  .vje-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid #ebeef5;
    background: #f5f7fa;
  }
  .vje-title {
    display: flex;
    align-items: baseline;
    gap: 8px;
    min-width: 0;
  }
  .vje-name {
    font-weight: 600;
    font-size: 14px;
    color: #303133;
  }
  .vje-desc {
    font-size: 12px;
    color: #909399;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .vje-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: none;
  }
  .vje-actions button {
    border: 1px solid #dcdfe6;
    background: #fff;
    border-radius: 3px;
    padding: 3px 10px;
    font-size: 12px;
    color: #606266;
    cursor: pointer;
  }
  .vje-actions button:hover {
    color: #409eff;
    border-color: #409eff;
  }
  .vje-toast {
    font-size: 12px;
    color: #67c23a;
  }
  .vje-body {
    display: flex;
    flex: 1;
    min-height: 0;
  }
  .vje-editor {
    display: flex;
    flex-direction: column;
    flex: 1.2;
    min-width: 0;
    border-right: 1px solid #ebeef5;
  }
  .vje-tabs {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 0 8px;
    border-bottom: 1px solid #ebeef5;
    flex: none;
  }
  .vje-tabs button {
    border: none;
    background: none;
    padding: 8px 12px;
    font-size: 13px;
    color: #606266;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
  }
  .vje-tabs button:hover {
    color: #409eff;
  }
  .vje-tabs button.active {
    color: #409eff;
    border-bottom-color: #409eff;
    font-weight: 600;
  }
  .vje-tabs-extra {
    margin-left: auto;
    display: inline-flex;
    gap: 2px;
  }
  .vje-tabs-extra button {
    font-size: 12px;
    padding: 4px 8px;
    border: 1px solid #dcdfe6;
    border-radius: 3px;
    margin-bottom: 0;
  }
  .vje-tabs-extra button.active {
    color: #409eff;
    border-color: #409eff;
    border-bottom-color: #409eff;
    background: #ecf5ff;
  }
  .vje-panel {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
  .vje-node-split {
    display: flex;
    height: 100%;
  }
  .vje-tree {
    flex: 1;
    min-width: 0;
    overflow: auto;
    padding: 6px 4px;
    border-right: 1px solid #ebeef5;
    display: flex;
    flex-direction: column;
  }
  .vje-tree-list {
    flex: 1;
  }
  .vje-add-root {
    flex: none;
    margin-top: 6px;
    border: 1px dashed #c0c4cc;
    background: none;
    border-radius: 3px;
    padding: 4px;
    color: #909399;
    cursor: pointer;
    font-size: 12px;
  }
  .vje-add-root:hover {
    color: #409eff;
    border-color: #409eff;
  }
  .vje-inspector {
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }
  .vje-source {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 8px;
    box-sizing: border-box;
  }
  .vje-source textarea {
    flex: 1;
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
  .vje-error {
    margin: 6px 0 0;
    font-size: 12px;
    color: #f56c6c;
    white-space: pre-wrap;
  }
  .vje-source-tip {
    margin: 6px 0 0;
    font-size: 12px;
    color: #c0c4cc;
  }
  .vje-preview {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }
  .vje-preview-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 12px;
    font-size: 13px;
    font-weight: 600;
    color: #303133;
    border-bottom: 1px solid #ebeef5;
    background: #fafafa;
    flex: none;
  }
  .vje-status {
    font-size: 12px;
    font-weight: normal;
    padding: 1px 8px;
    border-radius: 8px;
  }
  .vje-status.ok {
    color: #67c23a;
    background: #f0f9eb;
  }
  .vje-status.err {
    color: #f56c6c;
    background: #fef0f0;
  }
  .vje-preview-body {
    flex: 1;
    overflow: auto;
    padding: 16px;
  }
  .vje-preview-body :deep(.vje-preview-error) {
    color: #f56c6c;
    background: #fef0f0;
    padding: 10px;
    border-radius: 4px;
    font-size: 12px;
    white-space: pre-wrap;
    margin: 0;
  }
</style>
