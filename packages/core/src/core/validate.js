/**
 * vjson 结构校验与指令解析
 */
import { RESERVED_NAMES } from './scope.js'

export class VjsonError extends Error {
  constructor(message) {
    super(message)
    this.name = 'VjsonError'
  }
}

/** 常见 html 标签集合(用于判断节点 type 是否为原生元素) */
const HTML_TAGS = new Set(
  'a,abbr,address,area,article,aside,audio,b,base,bdi,bdo,blockquote,body,br,button,canvas,caption,cite,code,col,colgroup,data,datalist,dd,del,details,dfn,dialog,div,dl,dt,em,embed,fieldset,figcaption,figure,footer,form,h1,h2,h3,h4,h5,h6,head,header,hgroup,hr,html,i,iframe,img,input,ins,kbd,label,legend,li,link,main,map,mark,menu,meta,meter,nav,noscript,object,ol,optgroup,option,output,p,param,picture,pre,progress,q,rp,rt,ruby,s,samp,script,search,section,select,slot,small,source,span,strong,style,sub,summary,sup,table,tbody,td,template,textarea,tfoot,th,thead,time,title,tr,track,u,ul,var,video,wbr'.split(
    ','
  )
)

/** 判断节点 type 是否为原生 html 标签 */
export const isHtmlTag = (type) => HTML_TAGS.has(type)

/** v-for: "(item, index, keyField) in dataRef.value" */
const VFOR_RE = /^\s*\(?\s*([A-Za-z_$][\w$]*)\s*(?:,\s*([A-Za-z_$][\w$]*)\s*)?(?:,\s*([A-Za-z_$][\w$]*)\s*)?\)?\s+in\s+([\s\S]+)$/
/** slot: "title" / "title(param)" / "default(param)" */
const SLOT_RE = /^\s*([A-Za-z_$][\w$-]*)\s*(?:\(\s*([A-Za-z_$][\w$]*)\s*\))?\s*$/
/** 组件标识符: MyComp / el-table / comps.MyComp(中划线组件名用于全局注册组件解析) */
const TYPE_RE = /^[A-Za-z_$][\w$-]*(\.[A-Za-z_$][\w$-]*)*$/
/** vjson name(用于组件 name 与 __scopeId) */
const NAME_RE = /^[\w-]+$/
/** scriptSetup 顶层声明(保留字冲突预检) */
const DECL_RE = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g

/**
 * 解析 v-for 表达式: "(item, index, keyField) in dataRef.value"
 * keyField 用于从 item[keyField] 取出循环节点的 key
 */
export function parseVFor(expr) {
  const m = VFOR_RE.exec(expr)
  if (!m) {
    throw new VjsonError(`v-for 表达式格式错误: "${expr}"，应为 "(item, index, keyField) in 数据源"`)
  }
  return { item: m[1], index: m[2] || '', keyField: m[3] || '', source: m[4].trim() }
}

/**
 * 解析 slot 声明: "title" / "title(param)" / "default(param)"
 */
export function parseSlot(expr) {
  const m = SLOT_RE.exec(expr)
  if (!m) {
    throw new VjsonError(`slot 声明格式错误: "${expr}"，应为 "slotName" 或 "slotName(param)"`)
  }
  return { name: m[1], param: m[2] || '' }
}

/**
 * 校验 vjson 顶层结构与 vdomJson 节点, 不合法时抛出 VjsonError(聚合所有错误信息)
 */
export function validateVjson(vjson) {
  const errors = []

  if (!vjson || typeof vjson !== 'object' || Array.isArray(vjson)) {
    throw new VjsonError('vjson 必须是一个对象')
  }

  if (typeof vjson.name !== 'string' || !vjson.name.trim()) {
    errors.push('顶层字段 name 必须为非空字符串(组件名称, 必须唯一)')
  } else if (!NAME_RE.test(vjson.name)) {
    errors.push(`name "${vjson.name}" 只能包含字母、数字、下划线与中划线`)
  }
  if (vjson.version != null && typeof vjson.version !== 'string') errors.push('顶层字段 version 必须为字符串')
  if (vjson.desc != null && typeof vjson.desc !== 'string') errors.push('顶层字段 desc 必须为字符串')

  if (!Array.isArray(vjson.template) || vjson.template.length === 0) {
    errors.push('顶层字段 template 必须为非空数组(vdomJson 节点数组)')
  } else {
    vjson.template.forEach((node, i) => validateNode(node, `template[${i}]`, errors))
  }

  if (vjson.scriptSetup != null) {
    if (!Array.isArray(vjson.scriptSetup) || vjson.scriptSetup.some((s) => typeof s !== 'string')) {
      errors.push('顶层字段 scriptSetup 必须为字符串数组')
    } else {
      checkReserved(vjson.scriptSetup)
    }
  }

  if (errors.length) {
    throw new VjsonError('vjson 校验失败:\n  - ' + errors.join('\n  - '))
  }
}

/** 递归校验单个 vdomJson 节点 */
function validateNode(node, path, errors) {
  if (typeof node === 'string') return // 纯文本子节点

  if (!node || typeof node !== 'object' || Array.isArray(node)) {
    errors.push(`${path} 必须是 vdomJson 对象或字符串`)
    return
  }

  if (typeof node.type !== 'string' || !node.type.trim()) {
    errors.push(`${path}.type 必须为非空字符串(html tag / vue 组件名 / setup 上下文变量)`)
  } else if (!isHtmlTag(node.type) && !TYPE_RE.test(node.type)) {
    errors.push(`${path}.type "${node.type}" 不是合法的 html 标签或组件标识符`)
  }

  for (const f of ['v-if', 'v-show', 'v-bind', 'v-model', 'slot', 'v-for']) {
    if (node[f] != null && typeof node[f] !== 'string') errors.push(`${path}.${f} 必须为字符串(表达式)`)
  }
  for (const [field, value] of Object.entries(node)) {
    if ((field.startsWith(':') || field.startsWith('@') || field.startsWith('v-model:')) && typeof value !== 'string') {
      errors.push(`${path}.${field} 必须为字符串(表达式)`)
    }
  }

  if (typeof node['v-for'] === 'string') {
    try {
      parseVFor(node['v-for'])
    } catch (e) {
      errors.push(`${path}.v-for ${e.message}`)
    }
  }
  if (typeof node.slot === 'string') {
    try {
      parseSlot(node.slot)
    } catch (e) {
      errors.push(`${path}.slot ${e.message}`)
    }
  }

  if (node.children != null) {
    if (!Array.isArray(node.children)) {
      errors.push(`${path}.children 必须为数组`)
    } else {
      node.children.forEach((c, i) => validateNode(c, `${path}.children[${i}]`, errors))
    }
  }
}

/** 预检 scriptSetup 是否声明了与内置变量冲突的标识符(仅告警, 编译失败时会有明确报错) */
function checkReserved(scriptSetup) {
  scriptSetup.forEach((segment, i) => {
    DECL_RE.lastIndex = 0
    let m
    while ((m = DECL_RE.exec(segment))) {
      if (RESERVED_NAMES.has(m[1])) {
        console.warn(`[vjson] scriptSetup[${i}] 声明了内置标识符 "${m[1]}"，与 vjson 运行时冲突, 可能导致编译失败`)
      }
    }
  })
}
