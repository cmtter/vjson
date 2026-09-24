/**
 * codegen: vdomJson 节点 -> h() 渲染代码字符串生成
 *
 * 编译期展开 template, 生成静态的 h() 调用树, 动态部分以
 * resolveEepress / withVfor / __resolveType 包裹的表达式内联。
 */
import { isHtmlTag, parseVFor, parseSlot } from './validate.js'

/** 纯标识符/成员表达式(事件可直接内联引用), 否则包装为内联箭头函数 */
const IDENT_RE = /^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*$/

/** vjson 指令/元信息字段, 不作为静态属性透传 */
const RESERVED_FIELDS = new Set([
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

const camelize = (s) => s.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''))
const toHandlerKey = (s) => 'on' + camelize(s).charAt(0).toUpperCase() + camelize(s).slice(1)
const lit = (v) => JSON.stringify(v)

/**
 * 生成 render 函数体表达式: `[ 节点, 节点, ... ]`(多根 fragment)
 */
export function generateRenderCode(vjson) {
  const nodes = vjson.template.map((node, i) => genNode(node, `template[${i}]`)).join(',\n')
  return `[\n${indent(nodes)}\n]`
}

/** 单个 vdomJson 节点 -> 表达式字符串 */
function genNode(node, path) {
  // 表达式
  if(typeof node === 'string' && node[0] === ':'){
    return `resolveEepress(() => (${node.slice(1)}))`
  }
  // 纯文本节点
  if (typeof node === 'string') return lit(node) // 纯文本子节点

  // v-for: 循环优先于 v-if(与 vue sfc 语义一致), v-if/v-show 在循环体内生效
  if (node['v-for'] != null) {
    const { item, index, keyField, source } = parseVFor(node['v-for'])
    const indexName = index || '__vforIndex'
    // withVfor 的 cb 第三参为 item[keyField] 取出的 key(无 keyField 时回退 index)
    const inner = genConditional(node, '__vforKey')
    return `withVfor(${lit(keyField)}, () => (${source}), (${item}, ${indexName}, __vforKey) => ${inner})`
  }
  return genConditional(node, null)
}

/** v-if 条件包裹(无 v-if 时直接返回 h 代码) */
function genConditional(node, vforKey) {
  const code = genH(node, vforKey)
  if (node['v-if'] != null) {
    return `(resolveEepress(() => (${node['v-if']})) ? ${code} : null)`
  }
  return code
}

/** h(...) / withDirectives(h(...), [[vShow, ...]]) */
function genH(node, vforKey) {
  const typeCode = genType(node)
  const propsCode = genProps(node, vforKey)
  const childrenCode = genChildren(node)
  const hCode = `h(${typeCode}, ${propsCode}, ${childrenCode})`
  if (node['v-show'] != null) {
    return `withDirectives(${hCode}, [[vShow, resolveEepress(() => (${node['v-show']}))]])`
  }
  return hCode
}

/**
 * 节点 type 解析:
 * - html tag -> 字符串字面量
 * - setup 上下文变量(合法 JS 标识符) -> __resolveType('Name', () => Name)
 * - 中划线组件名(如 el-table, 非 JS 标识符) -> __resolveType('el-table', () => undefined)
 *   回退当前应用的全局注册组件, 最终回退原始字符串
 */
function genType(node) {
  if (isHtmlTag(node.type)) return lit(node.type)
  const getter = IDENT_RE.test(node.type) ? `() => (${node.type})` : `() => undefined`
  return `__resolveType(${lit(node.type)}, ${getter})`
}

/** props 对象生成: 静态属性 -> 动态属性 -> v-model -> 事件 -> key, v-bind 最后以 Object.assign 合并 */
function genProps(node, vforKey) {
  const entries = []

  // key: v-for 循环 key 优先, 其次节点静态 key
  if (vforKey) {
    entries.push(`key: ${vforKey}`)
  } else if (node.key != null) {
    entries.push(`key: ${lit(node.key)}`)
  }

  const dynamics = []
  const events = []
  const vModels = []

  for (const [field, value] of Object.entries(node)) {
    if (RESERVED_FIELDS.has(field)) continue
    if (field.startsWith('@')) {
      events.push([field.slice(1), value])
    } else if (field.startsWith(':')) {
      dynamics.push([field.slice(1), value])
    } else if (field.startsWith('v-model:')) {
      vModels.push([field.slice('v-model:'.length), value])
    } else {
      entries.push(`${lit(field)}: ${lit(value)}`) // 静态属性
    }
  }
  if (node['v-model'] != null) vModels.push([null, node['v-model']])

  // 动态属性: ':prop': 'expr' -> prop: resolveEepress(() => expr)
  for (const [prop, expr] of dynamics) {
    entries.push(`${lit(prop)}: resolveEepress(() => (${expr}))`)
  }

  // v-model: 分解为 值属性 + onUpdate 回调(赋值端 resolveEepressSet 容错)
  for (const [prop, expr] of vModels) {
    entries.push(...genVModel(node, prop, expr))
  }

  // 事件: '@eventName' -> onEventName, 标识符引用直接内联, 内联语句包装为箭头函数
  for (const [eventName, value] of events) {
    const trimmed = value.trim()
    const handler = IDENT_RE.test(trimmed) ? trimmed : `($event) => (${value})`
    entries.push(`${lit(toHandlerKey(eventName))}: ${handler}`)
  }

  if (!entries.length && node['v-bind'] == null) return '{}'
  let propsCode = `{\n${indent(entries.join(',\n'))}\n}`
  if (node['v-bind'] != null) {
    propsCode = `Object.assign(${propsCode}, resolveEepress(() => (${node['v-bind']})))`
  }
  return propsCode
}

/**
 * v-model 语义区分:
 * - 组件: prop -> prop + 'onUpdate:prop'(默认 modelValue)
 * - 原生 input/textarea: value + onInput
 * - 原生 select: value + onChange
 * - 原生 input 且 ':type' 为 checkbox/radio 字面量: checked + onChange
 */
function genVModel(node, prop, expr) {
  const isNative = isHtmlTag(node.type)
  if (!isNative || prop != null) {
    // 组件语义(显式 prop 或非原生元素), 默认 prop 为 value(与需求规范一致)
    const name = prop || 'modelValue'
    return [
      `${lit(name)}: resolveEepress(() => (${expr}))`,
      `${lit('onUpdate:' + name)}: (__vmodelVal) => resolveEepressSet(() => { ${expr} = __vmodelVal })`,
    ]
  }

  const tag = node.type
  const inputType = tag === 'input' && typeof node[':type'] === 'string' ? node[':type'].replace(/^['"]|['"]$/g, '') : ''
  if (tag === 'input' && (inputType === 'checkbox' || inputType === 'radio')) {
    return [
      `checked: resolveEepress(() => (${expr}))`,
      `onChange: ($event) => resolveEepressSet(() => { ${expr} = $event.target.checked })`,
    ]
  }
  const event = tag === 'select' ? 'onChange' : 'onInput'
  return [
    `value: resolveEepress(() => (${expr}))`,
    `${event}: ($event) => resolveEepressSet(() => { ${expr} = $event.target.value })`,
  ]
}

/**
 * children 生成:
 * - html 元素 -> children 表达式数组(单一文本节点直接传字符串)
 * - 组件 -> 插槽对象 { default: () => [...], title: (param) => [...] }
 */
function genChildren(node) {
  const children = node.children
  if (!children || !children.length) return 'null'

  if (isHtmlTag(node.type)) {
    if (children.length === 1 && typeof children[0] === 'string') return lit(children[0])
    const arr = children.map((c, i) => genNode(c, `children[${i}]`)).join(',\n')
    return `[\n${indent(arr)}\n]`
  }
  return genSlots(children)
}

/** children 按声明分组为插槽对象: 无 slot/default -> 默认插槽, 'title'/'title(param)' -> 具名/作用域插槽 */
function genSlots(children) {
  const groups = new Map() // slotName -> { param, nodes: [] }
  for (const child of children) {
    let slotName = 'default'
    let param = ''
    if (typeof child === 'object' && child != null && child.slot != null) {
      const parsed = parseSlot(child.slot)
      slotName = parsed.name
      param = parsed.param
    }
    if (!groups.has(slotName)) groups.set(slotName, { param: '', nodes: [] })
    const group = groups.get(slotName)
    // 同一插槽多次声明参数时, 以首个非空参数为准(作用域插槽参数名)
    if (param && !group.param) group.param = param
    group.nodes.push(child)
  }

  const entries = []
  for (const [slotName, { param, nodes }] of groups) {
    const body = nodes.map((n, i) => genNode(n, `slot[${i}]`)).join(',\n')
    const list = `[\n${indent(body)}\n]`
    // 作用域插槽参数名与外层 v-for 变量同名时, 按 JS 闭包遮蔽语义(内层优先)
    entries.push(`${lit(slotName)}: (${param}) => ${list}`)
  }
  return `{\n${indent(entries.join(',\n'))}\n}`
}

function indent(code) {
  return code
    .split('\n')
    .map((line) => '  ' + line)
    .join('\n')
}
