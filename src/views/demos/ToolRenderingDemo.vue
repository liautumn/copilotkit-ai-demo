<script setup lang="ts">
import { CopilotChat, useRenderTool } from '@copilotkit/vue/v2'
import { z } from 'zod'
import AgentStatePanel from '@/components/AgentStatePanel.vue'
import DemoShell from '@/components/DemoShell.vue'
import KnowledgeSearchTool from '@/components/KnowledgeSearchTool.vue'

const threadId = 'demo-tool-rendering'

useRenderTool({
  name: 'searchKnowledgeBase',
  parameters: z.object({
    query: z.string(),
  }),
  render: KnowledgeSearchTool as any,
})
</script>

<template>
  <DemoShell
    title="工具渲染"
    kicker="生成式界面"
    description="为指定 agent 工具调用提供自定义 Vue 渲染器。"
    docs-url="https://docs.copilotkit.ai/generative-ui/tool-rendering"
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
