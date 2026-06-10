<script setup lang="ts">
import { computed, ref } from 'vue'
import { CopilotChat, useConfigureSuggestions, useFrontendTool } from '@copilotkit/vue/v2'
import { z } from 'zod'
import AgentStatePanel from '@/components/AgentStatePanel.vue'
import DemoShell from '@/components/DemoShell.vue'
import ThemeToolRenderer from '@/components/ThemeToolRenderer.vue'

const threadId = 'demo-frontend-tools'
const currentTheme = ref('Graphite')
const todos = ref(['检查 Vue Provider', '测试前端工具执行'])

const themeClass = computed(() => `theme-preview theme-preview--${currentTheme.value.toLowerCase()}`)

useConfigureSuggestions({
  available: 'always',
  suggestions: [
    { title: '切换主题', message: '把工作区主题切换为 Mint' },
    { title: '添加待办', message: '添加一条“检查工具调用结果”的待办' },
    { title: '解释工具', message: '解释你会如何调用前端工具更新页面' },
  ],
})

useFrontendTool({
  name: 'setWorkspaceTheme',
  description: '修改 Vue 界面中的当前工作区主题。',
  parameters: z.object({
    theme: z.enum(['Graphite', 'Mint', 'Rose']),
  }),
  handler: async ({ theme }) => {
    currentTheme.value = theme
    return { theme, applied: true }
  },
  render: ThemeToolRenderer as any,
})

useFrontendTool({
  name: 'addTodo',
  description: '向 Vue 页面添加一个待办事项。',
  parameters: z.object({
    title: z.string(),
  }),
  handler: async ({ title }) => {
    todos.value = [title, ...todos.value]
    return { title, total: todos.value.length }
  },
  render: ThemeToolRenderer as any,
})
</script>

<template>
  <DemoShell
    title="前端工具"
    kicker="应用控制"
    description="Agent 调用 Vue 注册的工具，并更新响应式页面状态。"
    docs-url="https://docs.copilotkit.ai/frontend-tools"
  >
    <div class="demo-grid">
      <section class="panel">
        <div :class="themeClass">
          <span>主题</span>
          <strong>{{ currentTheme }}</strong>
        </div>
        <h2>本地待办</h2>
        <ul class="check-list">
          <li v-for="todo in todos" :key="todo">{{ todo }}</li>
        </ul>
        <p class="hint">试试：“切换主题（theme）”或“添加待办（todo）”。</p>
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
