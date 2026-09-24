import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'

// play 验证应用: 全局注册 Element Plus 供 vjson 中 el-xxx 组件解析
createApp(App).use(ElementPlus).mount('#app')
