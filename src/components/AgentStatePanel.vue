<script setup lang="ts">
import { computed } from 'vue'
import { useAgent } from '@copilotkit/vue/v2'

const props = defineProps<{
  threadId: string
  title?: string
}>()

const { agent } = useAgent({
  agentId: 'default',
  threadId: () => props.threadId,
})

const stateJson = computed(() => JSON.stringify(agent.value?.state ?? {}, null, 2))
const messageCount = computed(() => agent.value?.messages.length ?? 0)
const latestMessage = computed(() => {
  const message = agent.value?.messages.at(-1)
  if (!message) return '暂无消息'
  if ('content' in message && typeof message.content === 'string') return message.content || message.role
  return message.role
})
</script>

<template>
  <aside class="state-panel">
    <h2>{{ title ?? 'Agent 状态' }}</h2>
    <dl>
      <div>
        <dt>运行中</dt>
        <dd>{{ agent?.isRunning ? '是' : '否' }}</dd>
      </div>
      <div>
        <dt>消息数</dt>
        <dd>{{ messageCount }}</dd>
      </div>
    </dl>
    <p class="state-panel__latest">{{ latestMessage }}</p>
    <pre>{{ stateJson }}</pre>
  </aside>
</template>
