<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAgent, useAgentContext, useCopilotKit, useFrontendTool } from '@copilotkit/vue/v2'
import { z } from 'zod'
import { useWorkflowStore } from '@/stores/workflow'
import ThemeToolRenderer from '@/components/ThemeToolRenderer.vue'

const router = useRouter()
const workflow = useWorkflowStore()
const threadId = 'global-workflow'
const prompt = ref('')
const lastAction = ref('等待全局指令')
const { agent } = useAgent({ agentId: 'default', threadId })
const { copilotkit } = useCopilotKit()

const canRun = computed(() => Boolean(agent.value && !agent.value.isRunning && prompt.value.trim()))
const currentStep = computed(() => workflow.steps.find((step) => step.status === '进行中') ?? workflow.steps.at(-1)!)

useAgentContext({
  description: '全局跨页面流程状态。Agent 可以根据这些状态模拟用户操作多个页面，进行页面校验、提交审批和更新统计。',
  value: computed(() => ({
    route: router.currentRoute.value.fullPath,
    request: { ...workflow.request },
    approval: { ...workflow.approval },
    steps: workflow.steps.map((step) => ({ ...step })),
    statistics: {
      completionRate: workflow.completionRate,
      weightedAmount: workflow.weightedAmount,
      currentStep: currentStep.value.title,
    },
    validation: workflow.validationSummary,
    operationLog: [...workflow.operationLog],
  })),
})

useFrontendTool({
  name: 'navigateWorkflowPage',
  description: '导航到跨页面业务流程中的指定页面。',
  parameters: z.object({
    page: z.enum(['A', 'B', 'approval', 'stats']),
  }),
  handler: async ({ page }) => {
    const routeMap = {
      A: '/workflow/a',
      B: '/workflow/b',
      approval: '/workflow/approval',
      stats: '/workflow/stats',
    }
    await router.push(routeMap[page])
    workflow.setActiveStep(page === 'A' ? 'page-a' : page === 'B' ? 'page-b' : page)
    lastAction.value = `已导航到 ${page} 页面`
    workflow.appendLog(lastAction.value)
    return { page, route: routeMap[page] }
  },
  render: ThemeToolRenderer as any,
})

useFrontendTool({
  name: 'fillWorkflowPageA',
  description: '填写 A 页面需求录入表单。',
  parameters: z.object({
    customerName: z.string(),
    contactName: z.string(),
    contractAmount: z.number().min(0),
    renewalDate: z.string(),
    requirementSummary: z.string(),
  }),
  handler: async (input) => {
    workflow.updatePageA(input)
    lastAction.value = '已填写 A 页面需求录入表单'
    return { request: { ...workflow.request }, validation: workflow.validatePageA() }
  },
  render: ThemeToolRenderer as any,
})

useFrontendTool({
  name: 'fillWorkflowPageB',
  description: '填写 B 页面方案配置表单。',
  parameters: z.object({
    solutionPlan: z.string(),
    riskLevel: z.enum(['低', '中', '高']),
    owner: z.string(),
  }),
  handler: async (input) => {
    workflow.updatePageB(input)
    lastAction.value = '已填写 B 页面方案配置表单'
    return { request: { ...workflow.request }, validation: workflow.validatePageB() }
  },
  render: ThemeToolRenderer as any,
})

useFrontendTool({
  name: 'validateWorkflowPage',
  description: '校验当前流程页面，也可以指定校验 A 页面、B 页面或审批页。',
  parameters: z.object({
    page: z.enum(['A', 'B', 'approval']).optional(),
  }),
  handler: async ({ page }) => {
    const route = router.currentRoute.value.fullPath
    const target =
      page ?? (route.includes('/workflow/b') ? 'B' : route.includes('/workflow/approval') ? 'approval' : 'A')
    const validation =
      target === 'A' ? workflow.validatePageA() : target === 'B' ? workflow.validatePageB() : workflow.validateApproval()
    lastAction.value = `${target} 页面校验${validation.ok ? '通过' : '失败'}`
    workflow.appendLog(lastAction.value)
    return { page: target, ...validation }
  },
  render: ThemeToolRenderer as any,
})

useFrontendTool({
  name: 'submitWorkflowPage',
  description: '提交 A 页面或 B 页面。提交 A 后进入 B，提交 B 后进入审批。',
  parameters: z.object({
    page: z.enum(['A', 'B']),
  }),
  handler: async ({ page }) => {
    const validation = page === 'A' ? workflow.submitPageA() : workflow.submitPageB()
    if (validation.ok) {
      await router.push(page === 'A' ? '/workflow/b' : '/workflow/approval')
    }
    lastAction.value = `${page} 页面提交${validation.ok ? '成功' : '失败'}`
    return { page, validation, nextRoute: router.currentRoute.value.fullPath }
  },
  render: ThemeToolRenderer as any,
})

useFrontendTool({
  name: 'resolveWorkflowApproval',
  description: '处理流程审批，通过或驳回审批。',
  parameters: z.object({
    approved: z.boolean(),
    note: z.string(),
  }),
  handler: async ({ approved, note }) => {
    const validation = workflow.resolveApproval(approved, note)
    if (validation.ok && approved) await router.push('/workflow/stats')
    lastAction.value = approved ? '审批已通过，流程已完成' : '审批已驳回'
    return {
      approval: { ...workflow.approval },
      completionRate: workflow.completionRate,
      weightedAmount: workflow.weightedAmount,
      validation,
    }
  },
  render: ThemeToolRenderer as any,
})

useFrontendTool({
  name: 'resetWorkflowDemo',
  description: '重置跨页面业务流程演示数据。',
  parameters: z.object({}),
  handler: async () => {
    workflow.resetWorkflow()
    await router.push('/workflow/a')
    lastAction.value = '流程已重置'
    return { ok: true, route: '/workflow/a' }
  },
  render: ThemeToolRenderer as any,
})

async function runGlobalPrompt(text = prompt.value) {
  const value = text.trim()
  if (!value || !agent.value || agent.value.isRunning) return
  prompt.value = ''
  agent.value.addMessage({
    id: crypto.randomUUID(),
    role: 'user',
    content: value,
  })
  lastAction.value = `已发送全局指令：${value}`
  await copilotkit.value.runAgent({
    agent: agent.value,
    forwardedProps: { source: 'global-workflow-assistant' },
  })
}
</script>

<template>
  <section class="global-assistant">
    <div class="global-assistant__status">
      <strong>全局流程助手</strong>
      <span>{{ currentStep.title }} · 完成率 {{ workflow.completionRate }}%</span>
    </div>

    <div class="global-assistant__input">
      <input
        v-model="prompt"
        :disabled="agent?.isRunning"
        placeholder="输入跨页面需求，例如：录入客户续约需求，完成 A 页面和 B 页面校验，提交审批并通过"
        @keydown.enter.prevent="runGlobalPrompt()"
      />
      <button :disabled="!canRun" @click="runGlobalPrompt()">执行</button>
    </div>

    <div class="global-assistant__quick">
      <button
        class="button-secondary"
        :disabled="agent?.isRunning"
        @click="runGlobalPrompt('帮我模拟用户完成 A 页面需求录入，提交后进入 B 页面')"
      >
        完成 A 页
      </button>
      <button
        class="button-secondary"
        :disabled="agent?.isRunning"
        @click="runGlobalPrompt('继续完成 B 页面方案配置，校验通过后提交审批')"
      >
        完成 B 页
      </button>
      <button
        class="button-secondary"
        :disabled="agent?.isRunning"
        @click="runGlobalPrompt('审批通过当前流程，并跳转到统计页面查看结果')"
      >
        审批并统计
      </button>
    </div>

    <p>{{ agent?.isRunning ? 'Agent 正在执行跨页面操作...' : lastAction }}</p>
  </section>
</template>
