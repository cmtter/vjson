<script setup>
  /**
   * play 入口: 通过顶部导航切换 core(运行时渲染) 与 editor(可视化编辑器) 验证页
   */
  import { ref } from 'vue'
  import RuntimeDemo from './demos/RuntimeDemo.vue'
  import EditorDemo from './demos/EditorDemo.vue'

  const demos = [
    { key: 'runtime', label: 'core · 运行时渲染', comp: RuntimeDemo },
    { key: 'editor', label: 'editor · 可视化编辑器', comp: EditorDemo },
  ]
  const active = ref(demos[0])
</script>

<template>
  <div class="play">
    <header class="play-header">
      <h1>vjson playground</h1>
      <nav class="play-nav">
        <button
          v-for="d in demos"
          :key="d.key"
          :class="{ active: active.key === d.key }"
          @click="active = d"
        >
          {{ d.label }}
        </button>
      </nav>
    </header>
    <main class="play-body">
      <component :is="active.comp" />
    </main>
  </div>
</template>

<style>
  body {
    margin: 0;
  }
  #app {
    padding: 12px;
    box-sizing: border-box;
    height: 100vh;
    display: flex;
    flex-direction: column;
  }
  .play {
    display: flex;
    flex-direction: column;
    height: 100%;
    text-align: left;
  }
  .play-header {
    flex: none;
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 10px;
  }
  .play-header h1 {
    margin: 0;
    font-size: 20px;
  }
  .play-nav {
    display: flex;
    gap: 6px;
  }
  .play-nav button {
    border: 1px solid #dcdfe6;
    background: #fff;
    border-radius: 4px;
    padding: 4px 12px;
    font-size: 13px;
    color: #606266;
    cursor: pointer;
  }
  .play-nav button.active {
    color: #409eff;
    border-color: #409eff;
    background: #ecf5ff;
  }
  .play-body {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }
</style>
