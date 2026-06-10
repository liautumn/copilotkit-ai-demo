<script setup lang="ts">
import { CopilotPopup, useConfigureSuggestions } from '@copilotkit/vue/v2'
import DemoShell from '@/components/DemoShell.vue'

const threadId = 'demo-popup'

useConfigureSuggestions({
  available: 'always',
  suggestions: [
    { title: '解释流程', message: '请解释这个收入流程的三个时间节点' },
    { title: '生成待办', message: '根据当前流程生成一条待办事项' },
    { title: '请求审批', message: '发布前请先请求人工审批' },
  ],
})
</script>

<template>
  <DemoShell
    title="CopilotPopup"
    kicker="预置界面"
    description="由 Vue 包渲染的悬浮聊天入口。"
    docs-url="https://docs.copilotkit.ai/built-in-agent/prebuilt-components"
  >
    <div class="workspace-surface workspace-surface--popup">
      <section>
        <p class="eyebrow">运营控制台</p>
        <h2>收入流程</h2>
        <p>
          用户处理页面任务时，悬浮助手会一直可用。打开它，试试主题、待办、状态、搜索或审批演示。
        </p>
      </section>
      <div class="timeline">
        <span>09:00 接收</span>
        <span>11:30 评审</span>
        <span>15:00 发布</span>
      </div>

      <CopilotPopup
        agent-id="default"
        :thread-id="threadId"
        :default-open="true"
        :width="420"
        :height="560"
      />
    </div>
  </DemoShell>
</template>
