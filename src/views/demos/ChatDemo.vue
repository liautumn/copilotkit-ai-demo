<script setup lang="ts">
import { CopilotChat } from '@copilotkit/vue/v2'
import AgentStatePanel from '@/components/AgentStatePanel.vue'
import DemoShell from '@/components/DemoShell.vue'

const threadId = 'demo-chat'
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
