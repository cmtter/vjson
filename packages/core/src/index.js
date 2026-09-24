/**
 * @vjson/core 对外入口
 *
 * useVjsonRender: vjson -> Vue 组件(主入口)
 * recompileVjson: 清除缓存后重编译
 * VjsonError:     校验/编译错误类型
 * registerRouterApi: 可选注入 vue-router(useRouter/useRoute)
 * OPEN_SCOPE:     new Function 注入的开放变量白名单
 */
export { default as useVjsonRender } from './useVjsonRender.js'
export { recompileVjson, VjsonError } from './useVjsonRender.js'
export { registerRouterApi, OPEN_SCOPE } from './core/scope.js'
export { compileVjson, clearVjsonCache } from './core/compile.js'
export { validateVjson } from './core/validate.js'
export { generateRenderCode } from './core/codegen.js'
