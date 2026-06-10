<script setup lang="ts">
import { CopilotChat, useConfigureSuggestions } from '@copilotkit/vue/v2'
import AgentStatePanel from '@/components/AgentStatePanel.vue'
import DemoShell from '@/components/DemoShell.vue'

const threadId = 'demo-chat'

useConfigureSuggestions({
  available: 'always',
  suggestions: [
    { title: '介绍能力', message: '请用中文介绍这个 CopilotKit Vue 演示可以做什么' },
    { title: '测试工具', message: '请说明哪些页面可以测试前端工具调用' },
    { title: '查看状态', message: '解释当前聊天线程会记录哪些状态' },
  ],
})
</script>

<template>
  <DemoShell
    title="CopilotChat"
    kicker="预置界面"
    description="嵌入页面的 Vue 聊天组件，连接到后端 CopilotKit runtime。"
    docs-url="https://docs.copilotkit.ai/built-in-agent/prebuilt-components"
  >
    <div class="demo-grid demo-grid--chat">
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
