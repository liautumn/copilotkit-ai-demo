<script setup lang="ts">
import { computed, reactive } from 'vue'
import { CopilotChat, useAgentContext, useFrontendTool } from '@copilotkit/vue/v2'
import { z } from 'zod'
import AgentStatePanel from '@/components/AgentStatePanel.vue'
import DemoShell from '@/components/DemoShell.vue'
import ThemeToolRenderer from '@/components/ThemeToolRenderer.vue'

const threadId = 'demo-shared-state'
const board = reactive({
  selectedTicket: 'CK-2048',
  status: '等待评审',
  owner: 'Vue 平台',
})

useAgentContext({
  description: '当前 Vue 工单看板',
  value: computed(() => ({ ...board })),
})

useFrontendTool({
  name: 'setTicketStatus',
  description: '更新 Vue 看板中的工单状态。',
  parameters: z.object({
    ticketId: z.string(),
    status: z.string(),
  }),
  handler: async ({ ticketId, status }) => {
    board.selectedTicket = ticketId
    board.status = status
    return { ticketId, status }
  },
  render: ThemeToolRenderer as any,
})
</script>

<template>
  <DemoShell
    title="共享状态"
    kicker="应用控制"
    description="Vue 状态会注册为 agent 上下文，并可通过前端工具更新。"
    docs-url="https://docs.copilotkit.ai/shared-state"
  >
    <div class="demo-grid">
      <section class="panel">
        <h2>{{ board.selectedTicket }}</h2>
        <dl class="details-list">
          <div>
            <dt>状态</dt>
            <dd>{{ board.status }}</dd>
          </div>
          <div>
            <dt>负责人</dt>
            <dd>{{ board.owner }}</dd>
          </div>
        </dl>
        <p class="hint">试试：“设置工单状态（status）”或“同步状态（state）”。</p>
      </section>

      <div class="chat-frame">
        <CopilotChat
          agent-id="default"
          :thread-id="threadId"
        />
      </div>

      <AgentStatePanel :thread-id="threadId" title="AG-UI 状态快照" />
    </div>
  </DemoShell>
</template>
