/**
 * vjson 编辑器入口
 *
 * 用法:
 *   import { VjsonEditor } from '@vjson/editor'
 *   import '@vjson/editor/style.css'
 *   const vjson = reactive({ version, name, desc, template, scriptSetup, style })
 *   <VjsonEditor :vjson="vjson" />
 *
 * 编辑器就地修改传入的 reactive vjson 对象, 并内置实时预览;
 * style 为编辑器扩展字段(纯 CSS 文本), 预览时动态注入, 随 vjson 一起导出
 */
export { default as VjsonEditor } from './VjsonEditor.vue'
export { default } from './VjsonEditor.vue'
