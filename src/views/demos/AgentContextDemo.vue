<script setup lang="ts">
import { computed, reactive } from 'vue'
import { CopilotChat, useAgentContext, useConfigureSuggestions } from '@copilotkit/vue/v2'
import AgentStatePanel from '@/components/AgentStatePanel.vue'
import DemoShell from '@/components/DemoShell.vue'

const threadId = 'demo-agent-context'
const customer = reactive({
  account: 'Northwind 实验室',
  plan: '企业版',
  renewalRisk: '中',
  openItems: 4,
})

useConfigureSuggestions({
  available: 'always',
  suggestions: [
    { title: '查看上下文', message: '你现在能读取到哪些客户上下文？' },
    { title: '评估风险', message: '根据当前客户上下文评估续约风险' },
    { title: '建议动作', message: '基于当前上下文给出三个下一步动作' },
  ],
})

useAgentContext({
  description: '当前客户工作区',
  value: computed(() => ({ ...customer })),
})
</script>

<template>
  <DemoShell
    title="Agent 上下文"
    kicker="应用控制"
    description="每次 agent 运行都会携带响应式 Vue 上下文。"
    docs-url="https://docs.copilotkit.ai/built-in-agent/agent-app-context"
  >
    <div class="demo-grid">
      <section class="panel">
        <h2>{{ customer.account }}</h2>
        <dl class="details-list">
          <div>
            <dt>方案</dt>
            <dd>{{ customer.plan }}</dd>
          </div>
          <div>
            <dt>风险</dt>
            <dd>{{ customer.renewalRisk }}</dd>
          </div>
          <div>
            <dt>未完成事项</dt>
            <dd>{{ customer.openItems }}</dd>
          </div>
        </dl>
        <p class="hint">试试：“你现在有哪些上下文（context）？”</p>
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
