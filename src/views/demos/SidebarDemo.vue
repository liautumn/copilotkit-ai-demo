<script setup lang="ts">
import { CopilotSidebar, useConfigureSuggestions } from '@copilotkit/vue/v2'
import DemoShell from '@/components/DemoShell.vue'

const threadId = 'demo-sidebar'

useConfigureSuggestions({
  available: 'always',
  suggestions: [
    { title: '总结工单', message: '请总结当前工作区里的待处理工单' },
    { title: '评估风险', message: '根据页面指标评估当前发布风险' },
    { title: '安排评审', message: '帮我规划下一步评审动作' },
  ],
})
</script>

<template>
  <DemoShell
    title="CopilotSidebar"
    kicker="预置界面"
    description="挂载在业务工作区旁侧的侧边栏助手。"
    docs-url="https://docs.copilotkit.ai/built-in-agent/prebuilt-components"
  >
    <div class="workspace-surface workspace-surface--sidebar">
      <div class="workspace-main">
        <div class="metric-row">
          <div>
            <span>待处理工单</span>
            <strong>18</strong>
          </div>
          <div>
            <span>评审</span>
            <strong>7</strong>
          </div>
          <div>
            <span>发布风险</span>
            <strong>低</strong>
          </div>
        </div>
        <section class="work-list">
          <article>
            <h2>CK-2048</h2>
            <p>Vue 原生包能力对齐评审</p>
          </article>
          <article>
            <h2>CK-2051</h2>
            <p>工具渲染冒烟测试</p>
          </article>
          <article>
            <h2>CK-2054</h2>
            <p>LangGraph TypeScript runtime 适配器</p>
          </article>
        </section>
      </div>

      <CopilotSidebar
        agent-id="default"
        :thread-id="threadId"
        :default-open="true"
        :width="420"
      />
    </div>
  </DemoShell>
</template>
