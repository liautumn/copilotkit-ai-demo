<script setup lang="ts">
import { CopilotChat, CopilotKitInspector, useConfigureSuggestions } from '@copilotkit/vue/v2'
import AgentStatePanel from '@/components/AgentStatePanel.vue'
import DemoShell from '@/components/DemoShell.vue'

const threadId = 'demo-inspector'

useConfigureSuggestions({
  available: 'always',
  suggestions: [
    { title: '发送测试消息', message: '发送一条用于 Inspector 检查的测试消息' },
    { title: '调用工具', message: '请调用一个可在 Inspector 中查看的工具' },
    { title: '解释调试', message: '告诉我如何在 Inspector 里查看消息、工具和状态' },
  ],
})
</script>

<template>
  <DemoShell
    title="Inspector"
    kicker="观察调试"
    description="在 Vue 页面中挂载 CopilotKit inspector Web Component。"
    docs-url="https://docs.copilotkit.ai/inspector"
  >
    <div class="demo-grid">
      <section class="panel">
        <h2>Inspector 挂载</h2>
        <p class="hint">
          下方已挂载 inspector 按钮和窗口。先使用聊天，再检查消息、工具、状态和上下文。
        </p>
        <CopilotKitInspector />
      </section>

      <div class="chat-frame">
        <CopilotChat
          agent-id="default"
          :thread-id="threadId"
        />
      </div>

      <AgentStatePanel :thread-id="threadId" />
    </div>
  </DemoShell>
</template>
