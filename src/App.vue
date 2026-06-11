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
