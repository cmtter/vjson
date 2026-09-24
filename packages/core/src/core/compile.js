/**
 * compile: 组装 setup + render 代码, 通过 new Function 动态构造 Vue 组件, 并按 name 缓存
 *
 * 组件代码结构(与需求文档一致):
 *   return defineComponent((props, { emit, slots, attrs, expose }) => {
 *     // 默认内置变量: router / route(vue-router 可选)
 *     // vjson.scriptSetup 代码片段(顺序拼接)
 *     // 内置特殊函数: resolveEepress / resolveEepressSet / withVfor / __resolveType
 *     return () => [ h(...) ... ]
 *   }, { name, __scopeId: 'data-vjson-{name}' })
 */
import { resolveComponent, getCurrentInstance } from 'vue'
import { validateVjson } from './validate.js'
import { generateRenderCode } from './codegen.js'
import { OPEN_SCOPE } from './scope.js'

const DEV = typeof import.meta !== 'undefined' && import.meta.env?.DEV

/** 运行时辅助函数源码: 与动态代码同作用域注入(不进开放变量, 避免被外部拿到) */
const HELPERS_CODE = `
  // 表达式求值容错: 求值失败返回 undefined, 保证单个表达式异常不打断整页渲染
  const resolveEepress = (fn) => {
    try {
      return fn()
    } catch (e) {
      ${DEV ? `console.warn('[vjson] 表达式求值失败:', e && e.message)` : ''}
      return undefined
    }
  }

  // 表达式赋值容错(v-model 写入端)
  const resolveEepressSet = (setter) => {
    try {
      return setter()
    } catch (e) {
      ${DEV ? `console.warn('[vjson] 表达式赋值失败:', e && e.message)` : ''}
      return undefined
    }
  }

  // 循环渲染容错: keyField 用于从 item[keyField] 取循环节点 key, 缺省回退 index
  const withVfor = (keyField, arrayFn, cb) => {
    try {
      const list = arrayFn()
      if (!Array.isArray(list)) return undefined
      return list.map((item, index) => cb(item, index, keyField ? item[keyField] : index))
    } catch (e) {
      ${DEV ? `console.warn('[vjson] v-for 渲染失败:', e && e.message)` : ''}
      return undefined
    }
  }

  // 节点 type 解析: html tag 之外, setup 上下文变量优先, 回退全局注册组件, 最终回退原始字符串
  const __resolveType = (name, getter) => {
    try {
      const t = getter()
      if (t) return t
    } catch (e) { /* setup 变量未定义 */ }
    try {
      const c = resolveComponent(name)
      if (c !== name) return c
    } catch (e) { /* 未注册组件 */ }
    ${DEV ? `console.warn('[vjson] 未解析到组件 "${name}"，按原始标签渲染')` : ''}
    return name
  }
`

/** 组件缓存: name -> { source, component }; source 不变直接复用, 变化时重新编译(热更新) */
const componentCache = new Map()

/**
 * vjson 对象 -> Vue 组件
 * @param {object} vjson 已通过 validateVjson 校验的 vjson 对象
 * @returns Vue 组件(defineComponent 结果)
 */
export function compileVjson(vjson) {
  validateVjson(vjson)

  const source = JSON.stringify(vjson)
  const cached = componentCache.get(vjson.name)
  if (cached && cached.source === source) return cached.component

  const component = buildComponent(vjson)
  componentCache.set(vjson.name, { source, component })
  return component
}

/** 清空组件缓存(name 缺省时全部清空) */
export function clearVjsonCache(name) {
  if (name == null) componentCache.clear()
  else componentCache.delete(name)
}

/** 拼接完整组件代码并执行 */
function buildComponent(vjson) {
  const scriptSetupCode = (vjson.scriptSetup || [])
    .map((segment, i) => `// --- scriptSetup[${i}] ---\n${segment}`)
    .join('\n')

  // vue-router 未注册时不注入 router/route(避免执行报错), 注入 undefined 占位
  const routerCode = OPEN_SCOPE.useRouter
    ? `const router = __useRouter()\n  const route = __useRoute()`
    : `const router = undefined\n  const route = undefined`

  const code = `
return defineComponent((props, { emit, slots, attrs, expose }) => {
  // 默认内置变量
  ${routerCode}

  // vjson.scriptSetup 业务逻辑
  ${scriptSetupCode}

  // 内置特殊函数
  ${HELPERS_CODE}

  return () => ${generateRenderCode(vjson)}
}, {
  name: ${JSON.stringify(vjson.name)},
  __scopeId: ${JSON.stringify('data-vjson-' + vjson.name)},
})
//# sourceURL=vjson://${encodeURIComponent(vjson.name)}.js`

  try {
    const factory = new Function(...Object.keys(buildScope()), code)
    return factory(...Object.values(buildScope()))
  } catch (e) {
    throw new Error(`[vjson] 组件 "${vjson.name}" 编译失败: ${e.message}\n${e.stack || ''}`)
  }
}

/**
 * 每次编译构建独立 scope(开放变量 + 编译期辅助), 避免共享对象被动态代码意外修改
 */
function buildScope() {
  return {
    ...OPEN_SCOPE,
    resolveComponent,
    __useRouter: OPEN_SCOPE.useRouter,
    __useRoute: OPEN_SCOPE.useRoute,
  }
}

export { getCurrentInstance }
