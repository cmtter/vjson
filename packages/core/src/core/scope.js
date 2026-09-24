/**
 * 开放变量管理: new Function 注入的 API 白名单
 */
import {
  defineComponent,
  h,
  withDirectives,
  vShow,
  ref,
  shallowRef,
  reactive,
  computed,
  watch,
  watchEffect,
  onMounted,
  onUnmounted,
  onBeforeMount,
  onBeforeUnmount,
  toRef,
  toRefs,
  toRaw,
  getCurrentInstance,
  nextTick,
  provide,
  inject,
  mergeProps,
  resolveDynamicComponent,
  resolveComponent,
} from 'vue'

/** 运行时注入的开放变量(API 白名单), 动态代码无需 import 即可使用 */
export const OPEN_SCOPE = {
  // 组件与渲染
  defineComponent,
  h,
  withDirectives,
  vShow,
  mergeProps,
  resolveDynamicComponent,
  resolveComponent,
  // 响应式
  ref,
  shallowRef,
  reactive,
  computed,
  watch,
  watchEffect,
  toRef,
  toRefs,
  toRaw,
  // 生命周期
  onMounted,
  onUnmounted,
  onBeforeMount,
  onBeforeUnmount,
  // 其他常用 API
  getCurrentInstance,
  nextTick,
  provide,
  inject,
}

/** useRouter/useRoute 可选注入(vue-router 未安装时降级为空壳, 避免执行报错) */
export function registerRouterApi({ useRouter, useRoute }) {
  Object.assign(OPEN_SCOPE, { useRouter, useRoute })
}

/** 与运行时内置标识符冲突的保留名(scriptSetup 预检用) */
export const RESERVED_NAMES = new Set([
  ...Object.keys(OPEN_SCOPE),
  'router',
  'route',
  'props',
  'emit',
  'slots',
  'attrs',
  'expose',
  'resolveEepress',
  'resolveEepressSet',
  'withVfor',
  '__vjson',
])
