<script setup lang="ts">
import { CopilotChat, useConfigureSuggestions, useSuggestions } from '@copilotkit/vue/v2'
import AgentStatePanel from '@/components/AgentStatePanel.vue'
import DemoShell from '@/components/DemoShell.vue'

const threadId = 'demo-suggestions'

useConfigureSuggestions({
  available: 'always',
  suggestions: [
    { title: '切换主题', message: '把主题切换为 Mint' },
    { title: '搜索文档', message: '搜索 CopilotKit Vue 工具渲染' },
    { title: '请求审批', message: '发布前先请求审批' },
  ],
})

const { suggestions, isLoading, reloadSuggestions, clearSuggestions } = useSuggestions({
  agentId: 'default',
})
</script>

<template>
  <DemoShell
    title="建议问题"
    kicker="聊天体验"
    description="由 Vue 聊天基础组件渲染的静态建议配置。"
    docs-url="https://github.com/CopilotKit/CopilotKit/tree/main/packages/vue"
  >
    <div class="demo-grid">
      <section class="panel">
        <h2>建议状态</h2>
        <p class="hint">加载中：{{ isLoading ? '是' : '否' }}</p>
        <ul class="check-list">
          <li v-for="suggestion in suggestions" :key="suggestion.message">
            {{ suggestion.title }}
          </li>
        </ul>
        <div class="button-row">
          <button @click="reloadSuggestions">重新加载</button>
          <button @click="clearSuggestions">清空</button>
        </div>
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
