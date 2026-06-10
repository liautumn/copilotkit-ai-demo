<script setup lang="ts">
import { computed, reactive } from 'vue'
import { CopilotChat, useAgentContext, useConfigureSuggestions, useFrontendTool } from '@copilotkit/vue/v2'
import { z } from 'zod'
import AgentStatePanel from '@/components/AgentStatePanel.vue'
import DemoShell from '@/components/DemoShell.vue'
import ThemeToolRenderer from '@/components/ThemeToolRenderer.vue'

type WorkflowStatus = '已完成' | '进行中' | '待处理' | '受阻'

type WorkflowStep = {
  id: 'discovery' | 'solution' | 'business_review' | 'legal_approval' | 'renewed'
  title: string
  owner: string
  dueDate: string
  status: WorkflowStatus
  result: string
}

type FollowUp = {
  title: string
  owner: string
  dueDate: string
  done: boolean
}

const threadId = 'demo-business'

const account = reactive({
  customerName: '华东智造集团',
  industry: '高端制造',
  owner: '林秋',
  contractValue: 1280000,
  forecastAmount: 960000,
  estimatedCloseRate: 75,
  renewalDate: '2026-07-15',
  riskLevel: '中' as '低' | '中' | '高',
  riskReason: '关键用户近 30 天活跃下降，且采购负责人变更。',
  healthScore: 72,
  nextBestAction: '安排一次价值复盘会，并同步新版报价方案。',
})

const workflow = reactive<WorkflowStep[]>([
  {
    id: 'discovery',
    title: '需求确认',
    owner: '客户成功',
    dueDate: '2026-06-11',
    status: '已完成',
    result: '已确认续约范围和关键使用场景。',
  },
  {
    id: 'solution',
    title: '方案沟通',
    owner: '解决方案',
    dueDate: '2026-06-14',
    status: '已完成',
    result: '已完成新版方案演示。',
  },
  {
    id: 'business_review',
    title: '商务评审',
    owner: '销售',
    dueDate: '2026-06-18',
    status: '进行中',
    result: '等待折扣审批和采购负责人确认。',
  },
  {
    id: 'legal_approval',
    title: '合同审批',
    owner: '法务',
    dueDate: '2026-06-24',
    status: '待处理',
    result: '待提交合同条款。',
  },
  {
    id: 'renewed',
    title: '完成续约',
    owner: '销售运营',
    dueDate: '2026-07-01',
    status: '待处理',
    result: '待归档合同和回款计划。',
  },
])

const followUps = reactive<FollowUp[]>([
  { title: '整理 Q2 使用数据', owner: '客户成功', dueDate: '2026-06-12', done: false },
  { title: '确认采购负责人', owner: '销售', dueDate: '2026-06-13', done: false },
  { title: '准备合同折扣审批材料', owner: '销售', dueDate: '2026-06-15', done: false },
])

const operationLog = reactive([
  '系统初始化：流程停留在商务评审。',
  '客户成功完成需求确认和方案沟通节点。',
])

const currencyFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  maximumFractionDigits: 0,
})

const today = new Date('2026-06-10T00:00:00')
const renewalDate = computed(() => new Date(`${account.renewalDate}T00:00:00`))
const daysToRenewal = computed(() =>
  Math.max(0, Math.ceil((renewalDate.value.getTime() - today.getTime()) / 86_400_000)),
)
const completedSteps = computed(() => workflow.filter((step) => step.status === '已完成').length)
const completionRate = computed(() => Math.round((completedSteps.value / workflow.length) * 100))
const currentStep = computed(() => workflow.find((step) => step.status === '进行中') ?? workflow.at(-1)!)
const openFollowUps = computed(() => followUps.filter((item) => !item.done).length)
const forecastWeightedAmount = computed(() =>
  Math.round(account.forecastAmount * (account.estimatedCloseRate / 100)),
)
const riskClass = computed(() => `business-risk business-risk--${account.riskLevel}`)
const formattedContractValue = computed(() => currencyFormatter.format(account.contractValue))
const formattedForecastAmount = computed(() => currencyFormatter.format(account.forecastAmount))
const formattedWeightedAmount = computed(() => currencyFormatter.format(forecastWeightedAmount.value))

const stepIds = ['discovery', 'solution', 'business_review', 'legal_approval', 'renewed'] as const
const stepIdSchema = z.enum(stepIds)

function stepIndex(stepId: WorkflowStep['id']) {
  return workflow.findIndex((step) => step.id === stepId)
}

function appendLog(message: string) {
  operationLog.unshift(`${new Date().toLocaleTimeString('zh-CN', { hour12: false })} ${message}`)
  if (operationLog.length > 8) operationLog.pop()
}

function activateStep(stepId: WorkflowStep['id']) {
  const targetIndex = stepIndex(stepId)
  if (targetIndex < 0) return

  workflow.forEach((step, index) => {
    if (index < targetIndex) step.status = '已完成'
    if (index === targetIndex) step.status = '进行中'
    if (index > targetIndex && step.status !== '受阻') step.status = '待处理'
  })
}

function completeStep(stepId: WorkflowStep['id'], result?: string) {
  const targetIndex = stepIndex(stepId)
  if (targetIndex < 0) return

  workflow.forEach((step, index) => {
    if (index <= targetIndex) step.status = '已完成'
    if (index > targetIndex && step.status !== '受阻') step.status = '待处理'
  })

  if (result) workflow[targetIndex]!.result = result
  const nextStep = workflow[targetIndex + 1]
  if (nextStep) {
    nextStep.status = '进行中'
    account.nextBestAction = `推进「${nextStep.title}」，负责人：${nextStep.owner}。`
  } else {
    account.nextBestAction = '续约流程已完成，等待合同归档和复盘。'
    account.riskLevel = '低'
    account.healthScore = Math.max(account.healthScore, 90)
    account.estimatedCloseRate = 100
    account.forecastAmount = account.contractValue
  }
}

useConfigureSuggestions({
  available: 'always',
  suggestions: [
    { title: '完成当前节点', message: '完成当前商务评审节点，并推进到合同审批' },
    { title: '完成整条流程', message: '按顺序完成剩余流程，最后把续约标记为已完成' },
    { title: '更新统计', message: '根据当前流程进展更新预测金额、赢单概率和风险等级' },
  ],
})

useAgentContext({
  description: '客户续约流程工作台，包含客户、流程节点、统计指标、待办和操作日志',
  value: computed(() => ({
    account: { ...account },
    workflow: workflow.map((step) => ({ ...step })),
    followUps: followUps.map((item) => ({ ...item })),
    statistics: {
      completedSteps: completedSteps.value,
      totalSteps: workflow.length,
      completionRate: completionRate.value,
      currentStep: currentStep.value.title,
      openFollowUps: openFollowUps.value,
      daysToRenewal: daysToRenewal.value,
      forecastWeightedAmount: forecastWeightedAmount.value,
    },
    operationLog: [...operationLog],
  })),
})

useFrontendTool({
  name: 'completeWorkflowStep',
  description: '完成一个客户续约流程节点，并自动推进到下一个节点。',
  parameters: z.object({
    stepId: stepIdSchema,
    result: z.string().optional(),
  }),
  handler: async ({ stepId, result }) => {
    completeStep(stepId, result)
    appendLog(`完成流程节点：${workflow[stepIndex(stepId)]?.title ?? stepId}`)
    return {
      completedStep: stepId,
      currentStep: currentStep.value.title,
      completionRate: completionRate.value,
    }
  },
  render: ThemeToolRenderer as any,
})

useFrontendTool({
  name: 'moveWorkflowToStep',
  description: '把客户续约流程移动到指定节点，可用于跳转、回退或重新处理。',
  parameters: z.object({
    stepId: stepIdSchema,
    reason: z.string().optional(),
  }),
  handler: async ({ stepId, reason }) => {
    activateStep(stepId)
    appendLog(`流程移动到：${currentStep.value.title}${reason ? `，原因：${reason}` : ''}`)
    return {
      currentStep: currentStep.value.title,
      completionRate: completionRate.value,
      reason,
    }
  },
  render: ThemeToolRenderer as any,
})

useFrontendTool({
  name: 'blockWorkflowStep',
  description: '标记某个流程节点受阻，并记录阻塞原因。',
  parameters: z.object({
    stepId: stepIdSchema,
    reason: z.string(),
  }),
  handler: async ({ stepId, reason }) => {
    const target = workflow[stepIndex(stepId)]
    if (target) {
      target.status = '受阻'
      target.result = reason
    }
    account.riskLevel = '高'
    account.riskReason = reason
    account.nextBestAction = `解除「${target?.title ?? stepId}」阻塞。`
    appendLog(`流程受阻：${target?.title ?? stepId}，${reason}`)
    return {
      blockedStep: target?.title ?? stepId,
      riskLevel: account.riskLevel,
      riskReason: account.riskReason,
    }
  },
  render: ThemeToolRenderer as any,
})

useFrontendTool({
  name: 'updateRenewalStats',
  description: '更新续约预测统计，包括预测金额、赢单概率、健康分和下一步行动。',
  parameters: z.object({
    forecastAmount: z.number().min(0).optional(),
    estimatedCloseRate: z.number().min(0).max(100).optional(),
    healthScore: z.number().min(0).max(100).optional(),
    nextBestAction: z.string().optional(),
  }),
  handler: async ({ forecastAmount, estimatedCloseRate, healthScore, nextBestAction }) => {
    if (typeof forecastAmount === 'number') account.forecastAmount = forecastAmount
    if (typeof estimatedCloseRate === 'number') account.estimatedCloseRate = estimatedCloseRate
    if (typeof healthScore === 'number') account.healthScore = healthScore
    if (nextBestAction) account.nextBestAction = nextBestAction
    appendLog('更新续约统计指标。')
    return {
      forecastAmount: account.forecastAmount,
      estimatedCloseRate: account.estimatedCloseRate,
      healthScore: account.healthScore,
      weightedAmount: forecastWeightedAmount.value,
    }
  },
  render: ThemeToolRenderer as any,
})

useFrontendTool({
  name: 'updateRenewalRisk',
  description: '更新客户续约风险等级和风险原因。',
  parameters: z.object({
    riskLevel: z.enum(['低', '中', '高']),
    riskReason: z.string(),
    healthScore: z.number().min(0).max(100).optional(),
  }),
  handler: async ({ riskLevel, riskReason, healthScore }) => {
    account.riskLevel = riskLevel
    account.riskReason = riskReason
    if (typeof healthScore === 'number') account.healthScore = healthScore
    appendLog(`更新风险等级为：${riskLevel}。`)
    return {
      riskLevel: account.riskLevel,
      riskReason: account.riskReason,
      healthScore: account.healthScore,
    }
  },
  render: ThemeToolRenderer as any,
})

useFrontendTool({
  name: 'addRenewalFollowUp',
  description: '为当前客户新增一条续约跟进事项。',
  parameters: z.object({
    title: z.string(),
    owner: z.string(),
    dueDate: z.string(),
  }),
  handler: async ({ title, owner, dueDate }) => {
    followUps.unshift({ title, owner, dueDate, done: false })
    appendLog(`新增跟进事项：${title}。`)
    return {
      title,
      owner,
      dueDate,
      openFollowUps: openFollowUps.value,
    }
  },
  render: ThemeToolRenderer as any,
})
</script>

<template>
  <DemoShell
    title="续约流程工作台"
    kicker="业务场景"
    description="测试 CopilotKit 是否能读取业务上下文、操作流程节点、完成流程动作，并实时更新统计指标。"
    docs-url="https://docs.copilotkit.ai/frontend-tools"
  >
    <div class="demo-grid demo-grid--business">
      <section class="business-panel">
        <div class="business-header">
          <div>
            <p class="eyebrow">重点客户续约</p>
            <h2>{{ account.customerName }}</h2>
            <p>{{ account.industry }} · 负责人：{{ account.owner }}</p>
          </div>
          <span :class="riskClass">风险：{{ account.riskLevel }}</span>
        </div>

        <div class="business-stats">
          <div>
            <span>流程完成率</span>
            <strong>{{ completionRate }}%</strong>
          </div>
          <div>
            <span>当前节点</span>
            <strong>{{ currentStep.title }}</strong>
          </div>
          <div>
            <span>未完成待办</span>
            <strong>{{ openFollowUps }}</strong>
          </div>
          <div>
            <span>距续约</span>
            <strong>{{ daysToRenewal }} 天</strong>
          </div>
        </div>

        <div class="business-stats business-stats--finance">
          <div>
            <span>合同金额</span>
            <strong>{{ formattedContractValue }}</strong>
          </div>
          <div>
            <span>预测金额</span>
            <strong>{{ formattedForecastAmount }}</strong>
          </div>
          <div>
            <span>加权预测</span>
            <strong>{{ formattedWeightedAmount }}</strong>
          </div>
          <div>
            <span>赢单概率</span>
            <strong>{{ account.estimatedCloseRate }}%</strong>
          </div>
        </div>

        <div class="workflow-track">
          <article
            v-for="step in workflow"
            :key="step.id"
            class="workflow-step"
            :data-status="step.status"
          >
            <div>
              <span>{{ step.status }}</span>
              <h3>{{ step.title }}</h3>
              <p>{{ step.result }}</p>
            </div>
            <small>{{ step.owner }} · {{ step.dueDate }}</small>
          </article>
        </div>

        <dl class="details-list">
          <div>
            <dt>健康分</dt>
            <dd>{{ account.healthScore }}</dd>
          </div>
          <div>
            <dt>风险原因</dt>
            <dd>{{ account.riskReason }}</dd>
          </div>
          <div>
            <dt>下一步行动</dt>
            <dd>{{ account.nextBestAction }}</dd>
          </div>
        </dl>

        <div class="business-columns">
          <section>
            <h2>跟进事项</h2>
            <ul class="check-list">
              <li v-for="item in followUps" :key="`${item.title}-${item.dueDate}`">
                <strong>{{ item.title }}</strong>
                <span>{{ item.owner }} · {{ item.dueDate }}</span>
              </li>
            </ul>
          </section>

          <section>
            <h2>操作日志</h2>
            <ul class="activity-list">
              <li v-for="log in operationLog" :key="log">{{ log }}</li>
            </ul>
          </section>
        </div>
      </section>

      <div class="chat-frame">
        <CopilotChat
          agent-id="default"
          :thread-id="threadId"
        />
      </div>

      <AgentStatePanel :thread-id="threadId" title="业务 Agent 状态" />
    </div>
  </DemoShell>
</template>
