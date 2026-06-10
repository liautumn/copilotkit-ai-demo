<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { CopilotChatConfigurationProvider, CopilotKitProvider } from '@copilotkit/vue/v2'
import { demoLinks } from '@/data/demoCatalog'

const runtimeUrl = import.meta.env.VITE_COPILOT_RUNTIME_URL ?? '/api/copilotkit'
const chatLabels = {
  chatInputPlaceholder: '输入消息...',
  chatInputToolbarStartTranscribeButtonLabel: '语音转写',
  chatInputToolbarCancelTranscribeButtonLabel: '取消',
  chatInputToolbarFinishTranscribeButtonLabel: '完成',
  chatInputToolbarAddButtonLabel: '添加图片或文件',
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
  chatDisclaimerText: 'AI 可能出错，请核对重要信息。',
  chatToggleOpenLabel: '打开聊天',
  chatToggleCloseLabel: '关闭聊天',
  modalHeaderTitle: 'CopilotKit 聊天',
  welcomeMessageText: '今天需要我帮你做什么？',
} as Record<string, string>
</script>

<template>
  <CopilotKitProvider
    :runtime-url="runtimeUrl"
    :debug="{ events: false, lifecycle: false, verbose: false }"
    :show-dev-console="false"
  >
    <div class="app-shell">
      <aside class="app-nav">
        <RouterLink class="brand" to="/">
          <span class="brand-mark">CK</span>
          <span>
            <strong>CopilotKit Vue</strong>
            <small>演示工作台</small>
          </span>
        </RouterLink>

        <nav>
          <RouterLink
            v-for="demo in demoLinks"
            :key="demo.slug"
            :to="`/demos/${demo.slug}`"
          >
            <small>{{ demo.category }}</small>
            <span>{{ demo.title }}</span>
          </RouterLink>
        </nav>
      </aside>

      <main class="app-content">
        <CopilotChatConfigurationProvider :labels="chatLabels">
          <RouterView />
        </CopilotChatConfigurationProvider>
      </main>
    </div>
  </CopilotKitProvider>
</template>
