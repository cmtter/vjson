/**
 * vjson 编辑器工具函数
 */

/** vdomJson 节点保留字段(不作为静态属性透传) */
export const NODE_RESERVED_FIELDS = new Set([
  'key',
  'name',
  'type',
  'children',
  'slot',
  'v-if',
  'v-show',
  'v-for',
  'v-bind',
  'v-model',
])

/** 通用键名前缀(动态属性/事件/v-model 参数之外的属性均视为静态属性) */
const PREFIXES = [':', '@', 'v-model:']

/**
 * 判断节点字段是否为"属性类"字段(静态/动态/事件/v-model参数),
 * 用于在树标题上展示指令徽标、在属性面板中分类
 */
export function isAttrField(field) {
  return !NODE_RESERVED_FIELDS.has(field) && !PREFIXES.some((p) => field.startsWith(p))
}

/**
 * 节点字段分类: 静态属性 / 动态属性 / 事件 / v-model 参数绑定
 * @returns {{ statics: [string, any][], dynamics: [string, any][], events: [string, any][], vmodels: [string, any][] }}
 */
export function classifyNodeFields(node) {
  const statics = []
  const dynamics = []
  const events = []
  const vmodels = []
  for (const [field, value] of Object.entries(node)) {
    if (NODE_RESERVED_FIELDS.has(field)) continue
    if (field.startsWith(':')) dynamics.push([field.slice(1), value])
    else if (field.startsWith('@')) events.push([field.slice(1), value])
    else if (field.startsWith('v-model:')) vmodels.push([field.slice('v-model:'.length), value])
    else statics.push([field, value])
  }
  return { statics, dynamics, events, vmodels }
}

/** 创建空 vdomJson 节点 */
export function createEmptyNode(type = 'div') {
  return { type, children: [] }
}

/**
 * 静态属性值类型推断: 'true'/'false' 字面量转为布尔, 其余保持字符串
 * (vjson 静态属性支持布尔字面量, 如 el-table 的 border: true)
 */
export function coerceValue(v) {
  if (v === 'true') return true
  if (v === 'false') return false
  return v
}

/** 就地重命名节点属性键(冲突时保留原键) */
export function renameNodeKey(node, oldKey, newKey) {
  const key = newKey.trim()
  if (!key || key === oldKey) return false
  if (key in node) return false
  node[key] = node[oldKey]
  delete node[oldKey]
  return true
}

/** 用解析后的对象整体替换 reactive vjson 内容(保留引用) */
export function replaceVjsonContent(target, parsed) {
  for (const k of Object.keys(target)) delete target[k]
  Object.assign(target, parsed)
}

/** 下载 JSON 文件 */
export function downloadJson(obj, filename = 'vjson.json') {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
