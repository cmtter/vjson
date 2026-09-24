# FAQ

## Q1：`new Function` 动态执行有什么安全与兼容性约束？

`new Function` 属于 eval 类动态执行，依赖 CSP 的 `unsafe-eval` 授权——启用严格 `script-src`（不含 `unsafe-eval`）的站点无法使用。同时，**vjson 来源即代码来源**：`scriptSetup` 中的代码会被原样执行，因此 vjson 必须只来自可信的管控端（数据库、内部接口），严禁直接接受终端用户提交的 vjson，否则等同于开放任意 JS 执行。

## Q2：组件缓存机制是怎样的？

编译结果以 `vjson.name` 为 key 缓存，value 中同时记录 vjson 的 JSON 字符串。同一 `name` 内容不变时直接复用组件实例（避免重复编译）；内容变化时自动重新编译，天然支持运行时热更新。`name` **必须唯一**——不同业务组件重名会互相覆盖缓存。可通过 `recompileVjson` 显式触发重编译。

## Q3：表达式写错了会怎样？

所有动态表达式（`:prop`、`v-if`、`v-for` 数据源、v-model 读写端等）均被 `resolveEepress` / `resolveEepressSet` / `withVfor` 包裹 try/catch 容错：单个表达式异常只会导致**该属性/该节点不渲染**（返回 `undefined`），不会打断整页渲染；开发态会在控制台输出 `[vjson]` 前缀的警告辅助定位。生产环境错误静默为 `undefined`，请务必在 DEV 环境排查。

## Q4：为什么 `el-button` 的 `type="primary"` 要写成 `":type": "'primary'"`？

`type`/`key`/`name`/`slot`/`children` 是 vjson 保留字段。组件自身属性与保留字段同名时（`el-button` 的 `type`、`input` 的 `type` 等），必须用 `":type"` 动态绑定字面量表达式的形式，否则会被引擎当作组件类型解析，导致渲染异常。

## Q5：支持事件修饰符（`.stop` / `.prevent`）吗？

暂不支持。需要阻断冒泡/默认行为时，请在 handler 中使用 `$event.stopPropagation()` / `$event.preventDefault()`。

## Q6：调试时如何定位动态代码？

引擎为生成的组件代码注入了 `//# sourceURL=vjson://{name}.js`，DevTools 中可按 vjson 组件名定位到动态生成的源码；编译失败时错误信息会包含组件名与原始报错堆栈。

## Q7：性能有什么需要权衡的？

编译期成本转移到了运行期：首次渲染需要拼串 + `new Function` 编译（有组件缓存兜底）；每次 patch 时动态表达式以闭包求值并伴随 try/catch，大列表高频更新场景存在额外开销。建议：高频变化的大列表尽量下沉为静态组件、vjson 只描述结构骨架，并对编译结果做好缓存复用。

## Q8：如何在 scriptSetup 中使用 vue-router？

在宿主应用安装 vue-router 后，调用 core 导出的 `registerRouterApi({ useRouter, useRoute })` 注册；之后动态代码中即可通过 `router` / `route` 使用路由能力。未注册时 `router`/`route` 为 `undefined` 占位，不影响编译。
