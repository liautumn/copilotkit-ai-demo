<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  CopilotChat,
  useAgent,
  useConfigureSuggestions,
  useCopilotKit,
  useFrontendTool,
} from '@copilotkit/vue/v2'
import { z } from 'zod'
import AgentStatePanel from '@/components/AgentStatePanel.vue'
import DemoShell from '@/components/DemoShell.vue'
import ThemeToolRenderer from '@/components/ThemeToolRenderer.vue'

const threadId = 'demo-programmatic-control'
const { agent } = useAgent({ agentId: 'default', threadId })
const { copilotkit } = useCopilotKit()
const lastAction = ref('还没有触发编程式操作')

useConfigureSuggestions({
  available: 'always',
  suggestions: [
    { title: '解释状态', message: '请解释这个 Vue 演示状态' },
    { title: '推理路径', message: '请推理这个渲染路径' },
    { title: '调用工具', message: '调用 captureProgrammaticSignal 记录一次编程式信号' },
  ],
})

useFrontendTool({
  name: 'captureProgrammaticSignal',
  description: '记录 Vue UI 发出的编程式信号。',
  parameters: z.object({
    label: z.string(),
  }),
  handler: async ({ label }) => {
    lastAction.value = `工具已执行：${label}`
    return { label, captured: true }
  },
  render: ThemeToolRenderer as any,
})

const canRun = computed(() => Boolean(agent.value && !agent.value.isRunning))

async function sendPrompt(prompt: string) {
  if (!agent.value) return
  agent.value.addMessage({
    id: crypto.randomUUID(),
    role: 'user',
    content: prompt,
  })
  lastAction.value = `已发送提示词：${prompt}`
  await copilotkit.value.runAgent({
    agent: agent.value,
    forwardedProps: { source: 'programmatic-control' },
  })
}

async function runToolDirectly() {
  lastAction.value = '正在直接运行 captureProgrammaticSignal'
  await copilotkit.value.runTool({
    name: 'captureProgrammaticSignal',
    parameters: { label: '手动 Vue 按钮' },
    followUp: '请总结这次编程式工具调用结果。',
  })
}
</script>

<template>
  <DemoShell
    title="编程式控制"
    kicker="自定义体验"
    description="Vue 按钮可以添加消息、运行 agent，并直接执行工具。"
    docs-url="https://docs.copilotkit.ai/built-in-agent/programmatic-control"
  >
    <div class="demo-grid">
      <section class="panel">
        <h2>控制</h2>
        <div class="button-row">
          <button :disabled="!canRun" @click="sendPrompt('请解释这个 Vue 演示状态')">
            运行提示词
          </button>
          <button :disabled="!canRun" @click="sendPrompt('请推理这个渲染路径')">
            推理
          </button>
          <button :disabled="!canRun" @click="runToolDirectly">运行工具</button>
        </div>
        <p class="hint">{{ lastAction }}</p>
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
