<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { CopilotChat, useAgent, useConfigureSuggestions, useCopilotKit } from '@copilotkit/vue/v2'
import type { InterruptEvent, InterruptRenderProps } from '@copilotkit/vue/v2'
import AgentStatePanel from '@/components/AgentStatePanel.vue'
import DemoShell from '@/components/DemoShell.vue'

const threadId = 'demo-interrupt'
const { agent } = useAgent({ agentId: 'default', threadId })
const { copilotkit } = useCopilotKit()
const interrupt = shallowRef<InterruptEvent | null>(null)

useConfigureSuggestions({
  available: 'always',
  suggestions: [
    { title: '请求审批', message: '发布前请请求人工审批' },
    { title: '触发中断', message: '请触发一次 interrupt，让页面显示人工确认卡片' },
    { title: '说明流程', message: '解释人工介入流程如何继续当前 thread' },
  ],
})

const interruptResult = computed(() => {
  const event = interrupt.value
  if (!event) return null

  return {
    title: String((event.value as { title?: string })?.title ?? '人工审核'),
    description: String((event.value as { description?: string })?.description ?? '需要审核'),
  }
})

async function resolveForThread(response: unknown) {
  const currentAgent = agent.value
  if (!currentAgent) return

  const interruptEventValue = interrupt.value?.value
  interrupt.value = null

  await copilotkit.value.runAgent({
    agent: currentAgent,
    forwardedProps: {
      command: {
        resume: response,
        interruptEvent: interruptEventValue,
      },
    },
  })
}

watch(
  agent,
  (currentAgent, _previousAgent, onCleanup) => {
    if (!currentAgent) {
      interrupt.value = null
      return
    }

    let localInterrupt: InterruptEvent | null = null
    const subscription = currentAgent.subscribe({
      onCustomEvent: ({ event }) => {
        if (event.name === 'on_interrupt') {
          localInterrupt = {
            name: event.name,
            value: event.value,
          }
        }
      },
      onRunStartedEvent: () => {
        localInterrupt = null
        interrupt.value = null
      },
      onRunFinalized: () => {
        if (localInterrupt) {
          interrupt.value = localInterrupt
          localInterrupt = null
        }
      },
      onRunFailed: () => {
        localInterrupt = null
      },
    })

    onCleanup(() => subscription.unsubscribe())
  },
  { immediate: true },
)

watch(
  [() => copilotkit.value, interrupt, interruptResult],
  ([core, pendingInterrupt, result], _previousValue, onCleanup) => {
    const interruptState: InterruptRenderProps | null = pendingInterrupt
      ? {
          event: pendingInterrupt,
          result,
          resolve: resolveForThread,
        }
      : null

    core.setInterruptState(interruptState)

    onCleanup(() => {
      if (core.interruptState === interruptState) {
        core.setInterruptState(null)
      }
    })
  },
  { immediate: true },
)
</script>

<template>
  <DemoShell
    title="人工介入"
    kicker="应用控制"
    description="Agent 发出 interrupt 事件，Vue 聊天组件渲染对应的处理插槽。"
    docs-url="https://docs.copilotkit.ai/human-in-the-loop"
  >
    <div class="demo-grid demo-grid--chat">
      <div class="chat-frame">
        <CopilotChat
          agent-id="default"
          :thread-id="threadId"
        >
          <template #interrupt="{ result, resolve }">
            <div class="approval-card">
              <h2>{{ (result as any)?.title ?? '需要审批' }}</h2>
              <p>{{ (result as any)?.description ?? 'Agent 正在等待你的决定。' }}</p>
              <div class="button-row">
                <button @click="resolve({ approved: true, note: '已从 Vue 页面批准' })">
                  批准
                </button>
                <button class="button-secondary" @click="resolve({ approved: false })">
                  拒绝
                </button>
              </div>
            </div>
          </template>
        </CopilotChat>
      </div>
      <AgentStatePanel :thread-id="threadId" />
    </div>
  </DemoShell>
</template>
