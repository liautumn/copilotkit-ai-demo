<script setup lang="ts">
import { CopilotChat, useConfigureSuggestions, useRenderTool } from '@copilotkit/vue/v2'
import { z } from 'zod'
import AgentStatePanel from '@/components/AgentStatePanel.vue'
import DemoShell from '@/components/DemoShell.vue'
import KnowledgeSearchTool from '@/components/KnowledgeSearchTool.vue'

const threadId = 'demo-tool-rendering'

useConfigureSuggestions({
  available: 'always',
  suggestions: [
    { title: '搜索知识库', message: '搜索 CopilotKit Vue 工具渲染的资料' },
    { title: '渲染工具', message: '调用 searchKnowledgeBase 并展示工具渲染结果' },
    { title: '解释插槽', message: '解释工具调用结果为什么可以用 Vue 组件渲染' },
  ],
})

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
