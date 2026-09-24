/**
 * useVjsonRender: vjson 对外渲染入口
 *
 * 用法:
 *   const VjsonComponent = useVjsonRender(vjsonStrOrObject)
 *   <VjsonComponent />
 *
 * - 入参兼容 vjson JSON 字符串与对象
 * - 编译失败时返回错误占位组件(页面不白屏), 错误信息渲染在开发态
 * - 支持 vjson 变更后重新编译(按 name + 内容缓存)
 */
import { compileVjson, clearVjsonCache } from './core/compile.js'
import { VjsonError } from './core/validate.js'
import { h, defineComponent } from 'vue'

const DEV = typeof import.meta !== 'undefined' && import.meta.env?.DEV

/** 解析入参: JSON 字符串 -> 对象 */
function parseInput(vjsonInput) {
  if (typeof vjsonInput === 'string') {
    const trimmed = vjsonInput.trim()
    if (!trimmed) throw new VjsonError('vjson 字符串为空')
    try {
      return JSON.parse(trimmed)
    } catch (e) {
      throw new VjsonError(`vjson 不是合法的 JSON: ${e.message}`)
    }
  }
  if (vjsonInput && typeof vjsonInput === 'object') return vjsonInput
  throw new VjsonError('vjson 入参必须为 JSON 字符串或对象')
}

/** 编译错误占位组件: 保证单条 vjson 异常不拖垮整页 */
function createErrorComponent(error, name) {
  return defineComponent({
    name: name || 'VjsonError',
    render() {
      const message = `[vjson] 渲染失败: ${error.message}`
      if (DEV) {
        return h(
          'pre',
          { style: 'color:#d33;background:#fee;padding:8px 12px;border-radius:4px;white-space:pre-wrap;' },
          message
        )
      }
      console.error(message)
      return null
    },
  })
}

/**
 * 将 vjson 编译为可渲染的 Vue 组件
 * @param {string|object} vjsonInput vjson JSON 字符串或对象
 * @param {object} [options]
 * @param {boolean} [options.silent] 编译失败时不渲染错误占位(返回 null)
 * @returns Vue 组件
 */
export default function useVjsonRender(vjsonInput, options = {}) {
  let component
  try {
    const vjson = parseInput(vjsonInput)
    component = compileVjson(vjson)
  } catch (error) {
    if (options.silent) {
      console.error(`[vjson] 编译失败: ${error.message}`)
      return null
    }
    component = createErrorComponent(error, typeof vjsonInput === 'object' ? vjsonInput?.name : undefined)
  }
  return component
}

/** 供运行时更新场景使用: 清除缓存后重新编译 */
export function recompileVjson(vjsonInput, options) {
  if (vjsonInput && typeof vjsonInput === 'object' && vjsonInput.name) {
    clearVjsonCache(vjsonInput.name)
  }
  return useVjsonRender(vjsonInput, options)
}

export { VjsonError }
