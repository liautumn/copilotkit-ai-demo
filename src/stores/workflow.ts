import { computed, reactive } from 'vue'
import { defineStore } from 'pinia'

type WorkflowStepStatus = '待处理' | '进行中' | '已完成' | '受阻'
type ApprovalStatus = '未提交' | '待审批' | '已通过' | '已驳回'

type WorkflowStep = {
  id: 'page-a' | 'page-b' | 'approval' | 'stats'
  title: string
  route: string
  status: WorkflowStepStatus
}

export const useWorkflowStore = defineStore('workflow', () => {
  const request = reactive({
    customerName: '',
    contactName: '',
    contractAmount: 0,
    renewalDate: '',
    requirementSummary: '',
    solutionPlan: '',
    riskLevel: '中' as '低' | '中' | '高',
    owner: '林秋',
  })

  const approval = reactive({
    status: '未提交' as ApprovalStatus,
    approver: '销售总监',
    note: '',
    submittedAt: '',
    resolvedAt: '',
  })

  const steps = reactive<WorkflowStep[]>([
    { id: 'page-a', title: 'A 页面：需求录入', route: '/workflow/a', status: '进行中' },
    { id: 'page-b', title: 'B 页面：方案配置', route: '/workflow/b', status: '待处理' },
    { id: 'approval', title: '流程审批', route: '/workflow/approval', status: '待处理' },
    { id: 'stats', title: '统计复盘', route: '/workflow/stats', status: '待处理' },
  ])

  const operationLog = reactive<string[]>(['流程已初始化，等待录入客户续约需求。'])

  const completedSteps = computed(() => steps.filter((step) => step.status === '已完成').length)
  const completionRate = computed(() => Math.round((completedSteps.value / steps.length) * 100))
  const weightedAmount = computed(() => {
    const rate = request.riskLevel === '低' ? 0.9 : request.riskLevel === '中' ? 0.68 : 0.38
    return Math.round(request.contractAmount * rate)
  })
  const validationSummary = computed(() => ({
    pageA: validatePageA(),
    pageB: validatePageB(),
    approval: validateApproval(),
  }))

  function appendLog(message: string) {
    operationLog.unshift(`${new Date().toLocaleTimeString('zh-CN', { hour12: false })} ${message}`)
    if (operationLog.length > 12) operationLog.pop()
  }

  function setActiveStep(stepId: WorkflowStep['id']) {
    const targetIndex = steps.findIndex((step) => step.id === stepId)
    if (targetIndex < 0) return
    steps.forEach((step, index) => {
      if (step.status === '已完成') return
      step.status = index === targetIndex ? '进行中' : '待处理'
    })
  }

  function completeStep(stepId: WorkflowStep['id']) {
    const targetIndex = steps.findIndex((step) => step.id === stepId)
    if (targetIndex < 0) return
    steps[targetIndex]!.status = '已完成'
    const next = steps[targetIndex + 1]
    if (next && next.status !== '已完成') next.status = '进行中'
  }

  function blockStep(stepId: WorkflowStep['id'], reason: string) {
    const target = steps.find((step) => step.id === stepId)
    if (target) target.status = '受阻'
    appendLog(`节点受阻：${target?.title ?? stepId}，${reason}`)
  }

  function updatePageA(input: Partial<typeof request>) {
    Object.assign(request, input)
    appendLog('已填写 A 页面需求信息。')
  }

  function updatePageB(input: Partial<typeof request>) {
    Object.assign(request, input)
    appendLog('已填写 B 页面方案信息。')
  }

  function validatePageA() {
    const errors: string[] = []
    if (!request.customerName.trim()) errors.push('客户名称不能为空')
    if (!request.contactName.trim()) errors.push('联系人不能为空')
    if (!request.requirementSummary.trim()) errors.push('需求摘要不能为空')
    if (!request.renewalDate.trim()) errors.push('续约日期不能为空')
    if (request.contractAmount <= 0) errors.push('合同金额必须大于 0')
    return { ok: errors.length === 0, errors }
  }

  function validatePageB() {
    const errors: string[] = []
    if (!request.solutionPlan.trim()) errors.push('方案说明不能为空')
    if (!['低', '中', '高'].includes(request.riskLevel)) errors.push('风险等级无效')
    if (!request.owner.trim()) errors.push('负责人不能为空')
    return { ok: errors.length === 0, errors }
  }

  function validateApproval() {
    const errors: string[] = []
    if (approval.status !== '待审批') errors.push('流程尚未提交审批')
    if (!approval.approver.trim()) errors.push('审批人不能为空')
    return { ok: errors.length === 0, errors }
  }

  function submitPageA() {
    const validation = validatePageA()
    if (!validation.ok) {
      blockStep('page-a', validation.errors.join('；'))
      return validation
    }
    completeStep('page-a')
    appendLog('A 页面校验通过，已进入 B 页面方案配置。')
    return validation
  }

  function submitPageB() {
    const validation = validatePageB()
    if (!validation.ok) {
      blockStep('page-b', validation.errors.join('；'))
      return validation
    }
    completeStep('page-b')
    approval.status = '待审批'
    approval.submittedAt = new Date().toISOString()
    appendLog('B 页面校验通过，流程已提交审批。')
    return validation
  }

  function resolveApproval(approved: boolean, note: string) {
    const validation = validateApproval()
    if (!validation.ok) {
      blockStep('approval', validation.errors.join('；'))
      return validation
    }
    approval.status = approved ? '已通过' : '已驳回'
    approval.note = note
    approval.resolvedAt = new Date().toISOString()
    if (approved) {
      completeStep('approval')
      completeStep('stats')
      appendLog('审批已通过，流程完成并生成统计。')
    } else {
      steps.find((step) => step.id === 'approval')!.status = '受阻'
      appendLog(`审批已驳回：${note}`)
    }
    return { ok: true, errors: [] as string[] }
  }

  function resetWorkflow() {
    Object.assign(request, {
      customerName: '',
      contactName: '',
      contractAmount: 0,
      renewalDate: '',
      requirementSummary: '',
      solutionPlan: '',
      riskLevel: '中',
      owner: '林秋',
    })
    Object.assign(approval, {
      status: '未提交',
      approver: '销售总监',
      note: '',
      submittedAt: '',
      resolvedAt: '',
    })
    steps[0]!.status = '进行中'
    steps[1]!.status = '待处理'
    steps[2]!.status = '待处理'
    steps[3]!.status = '待处理'
    operationLog.splice(0, operationLog.length, '流程已重置，等待录入客户续约需求。')
  }

  return {
    request,
    approval,
    steps,
    operationLog,
    completedSteps,
    completionRate,
    weightedAmount,
    validationSummary,
    appendLog,
    setActiveStep,
    completeStep,
    updatePageA,
    updatePageB,
    validatePageA,
    validatePageB,
    validateApproval,
    submitPageA,
    submitPageB,
    resolveApproval,
    resetWorkflow,
  }
})
