<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { CopilotChatConfigurationProvider, CopilotKitProvider } from '@copilotkit/vue/v2'
import SchoolAiChat from '@/components/SchoolAiChat.vue'

const runtimeUrl = import.meta.env.VITE_COPILOT_RUNTIME_URL ?? '/api/copilotkit'
const chatLabels = {
  chatInputPlaceholder: '输入指令，例如：新增学生张三，加入一年级一班',
  chatInputToolbarStartTranscribeButtonLabel: '语音转写',
  chatInputToolbarCancelTranscribeButtonLabel: '取消',
  chatInputToolbarFinishTranscribeButtonLabel: '完成',
  chatInputToolbarToolsButtonLabel: '工具',
  assistantMessageToolbarCopyCodeLabel: '复制',
  assistantMessageToolbarCopyCodeCopiedLabel: '已复制',
  assistantMessageToolbarCopyMessageLabel: '复制',
  assistantMessageToolbarThumbsUpLabel: '回复有帮助',
  assistantMessageToolbarThumbsDownLabel: '回复无帮助',
  assistantMessageToolbarReadAloudLabel: '朗读',
  assistantMessageToolbarRegenerateLabel: '重新生成',
  userMessageToolbarCopyMessageLabel: '复制',
  userMessageToolbarEditMessageLabel: '编辑',
  chatDisclaimerText: 'AI 操作前请核对关键数据。',
  chatToggleOpenLabel: '打开聊天',
  chatToggleCloseLabel: '关闭聊天',
  modalHeaderTitle: 'AI 助手',
  welcomeMessageText: '我可以帮你管理学生、班级和班级成员。',
} as Record<string, string>
</script>

<template>
  <CopilotKitProvider
    :runtime-url="runtimeUrl"
    :debug="{ events: false, lifecycle: false, verbose: false }"
    :show-dev-console="false"
  >
    <CopilotChatConfigurationProvider :labels="chatLabels">
      <div class="app-shell">
        <aside class="app-nav">
          <RouterLink class="brand" to="/students">
            <span class="brand-mark">教</span>
            <span>
              <strong>教务管理</strong>
              <small>学生与班级 CRUD</small>
            </span>
          </RouterLink>

          <nav>
            <RouterLink to="/students">
              <small>学生</small>
              <span>学生管理</span>
            </RouterLink>
            <RouterLink to="/classes">
              <small>班级</small>
              <span>班级管理</span>
            </RouterLink>
          </nav>
        </aside>

        <main class="app-content">
          <RouterView />
        </main>
      </div>

      <SchoolAiChat />
    </CopilotChatConfigurationProvider>
  </CopilotKitProvider>
</template>

<style>
:root {
  --app-bg: #f5f7fb;
  --surface: #ffffff;
  --border: #d8e0eb;
  --text: #1f2937;
  --text-muted: #64748b;
  --accent: #0f766e;
  --accent-strong: #0f5f59;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--app-bg);
  color: var(--text);
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

a {
  color: inherit;
  text-decoration: none;
}

.app-shell {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  min-height: 100vh;
}

.app-nav {
  border-right: 1px solid var(--border);
  background: #ffffff;
  padding: 1.25rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.brand-mark {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 8px;
  background: #0f766e;
  color: #ffffff;
  font-weight: 700;
}

.brand strong,
.brand small {
  display: block;
}

.brand small,
.eyebrow,
.page-header p {
  color: var(--text-muted);
}

.app-nav nav {
  display: grid;
  gap: 0.5rem;
}

.app-nav nav a {
  display: grid;
  gap: 0.15rem;
  border-radius: 8px;
  padding: 0.75rem;
}

.app-nav nav a.router-link-active {
  background: #ecfdf5;
  color: var(--accent-strong);
}

.app-nav nav small {
  color: var(--text-muted);
}

.app-content {
  min-width: 0;
  padding: 1.5rem;
}

.page {
  display: grid;
  gap: 1rem;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
}

.page-header h1 {
  margin: 0.1rem 0 0.35rem;
  font-size: 1.8rem;
}

.page-header p {
  margin: 0;
}

.eyebrow {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.stats-grid > div {
  display: grid;
  gap: 0.35rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #ffffff;
  padding: 1rem;
}

.stats-grid span {
  color: var(--text-muted);
  font-size: 0.86rem;
}

.stats-grid strong {
  font-size: 1.6rem;
}

.panel {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #ffffff;
  padding: 1rem;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.table-toolbar h2 {
  margin: 0;
  font-size: 1.1rem;
}

.table-toolbar p {
  margin: 0.2rem 0 0;
  color: var(--text-muted);
}

.row-actions,
.button-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.file-input {
  display: none;
}

@media (max-width: 860px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .app-nav {
    border-right: 0;
    border-bottom: 1px solid var(--border);
  }

  .page-header,
  .table-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
