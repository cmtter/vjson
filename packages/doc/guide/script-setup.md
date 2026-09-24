# scriptSetup 代码片段

`scriptSetup` 是字符串数组，每个元素是一段独立的 JS 代码片段，运行时按数组顺序拼接注入到动态构造的 setup 函数体内。因此：

- **片段存在顺序依赖**：后段可以引用前段声明的变量，反之不行（不做声明提升分析）；
- **与模板共享同一作用域**：片段中声明的 `ref`、handler 等可被 `template` 中的表达式与事件直接引用，语义与 `<script setup>` 一致；
- 建议一个片段聚焦一件事（数据声明、事件处理、局部组件定义等），便于来源管理与排查。

## 可直接使用的注入变量

| 类别 | 可用标识符 |
| --- | --- |
| 组件与渲染 | `defineComponent`、`h`、`withDirectives`、`vShow`、`mergeProps`、`resolveDynamicComponent`、`resolveComponent` |
| 响应式 | `ref`、`shallowRef`、`reactive`、`computed`、`watch`、`watchEffect`、`toRef`、`toRefs`、`toRaw` |
| 生命周期 | `onMounted`、`onUnmounted`、`onBeforeMount`、`onBeforeUnmount` |
| 其他 API | `getCurrentInstance`、`nextTick`、`provide`、`inject` |
| 内置上下文 | `props`、`emit`、`slots`、`attrs`、`expose`（setup 参数解构）；`router`、`route`（vue-router 已注册时注入，未注册时为 `undefined` 占位） |

## 内置辅助函数

无需声明即可使用，与业务代码同作用域：

| 函数 | 职责 |
| --- | --- |
| `resolveEepress(fn)` | 表达式求值容错：执行 thunk，异常时返回 `undefined`，保证单个表达式错误不打断整页渲染 |
| `resolveEepressSet(setter)` | 表达式赋值容错（v-model 写入端） |
| `withVfor(keyField, arrayFn, cb)` | 循环渲染容错：数据源非数组或求值失败时安全返回 `undefined`，正常时 map 生成节点数组并按 keyField 取 key |

## 保留字约束

`scriptSetup` 中不要声明与上述注入变量同名的标识符（如 `const h = ...`），否则 `const` 重复声明会导致整个组件编译失败；引擎在开发态会对这类冲突输出 `console.warn` 预警。

## 局部组件定义示例

```js
"const MyPanel = defineComponent({ name: 'MyPanel', props: { title: String }, emits: ['update:title'], setup(panelProps, { emit, slots }) { return () => h('div', { class: 'panel' }, [ h('div', null, slots.title ? slots.title() : panelProps.title), slots.default ? slots.default({ label: '作用域数据' }) : null ]) } })"
```

定义后，`template` 中即可通过 `"type": "MyPanel"` 引用（type 取 setup 上下文变量）。
