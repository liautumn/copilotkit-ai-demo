<script setup lang="ts">
import { computed } from 'vue'
import { useWorkflowStore } from '@/stores/workflow'

const workflow = useWorkflowStore()
const formattedAmount = computed(() =>
  new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 0,
  }).format(workflow.request.contractAmount),
)
const formattedWeighted = computed(() =>
  new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 0,
  }).format(workflow.weightedAmount),
)
</script>

<template>
  <section class="workflow-page">
    <header class="workflow-page__header">
      <div>
        <p class="eyebrow">统计复盘</p>
        <h1>流程统计</h1>
        <p>展示跨页面流程完成后的业务统计、流程状态和操作日志。</p>
      </div>
      <RouterLink class="docs-link" to="/workflow/a">回到 A 页面</RouterLink>
    </header>

    <div class="business-stats">
      <div>
        <span>流程完成率</span>
        <strong>{{ workflow.completionRate }}%</strong>
      </div>
      <div>
        <span>合同金额</span>
        <strong>{{ formattedAmount }}</strong>
      </div>
      <div>
        <span>加权预测</span>
        <strong>{{ formattedWeighted }}</strong>
      </div>
      <div>
        <span>审批状态</span>
        <strong>{{ workflow.approval.status }}</strong>
      </div>
    </div>

    <div class="workflow-layout workflow-layout--stats">
      <section class="workflow-side">
        <h2>流程节点</h2>
        <div class="workflow-track">
          <article
            v-for="step in workflow.steps"
            :key="step.id"
            class="workflow-step"
            :data-status="step.status"
          >
            <div>
              <span>{{ step.status }}</span>
              <h3>{{ step.title }}</h3>
            </div>
            <small>{{ step.route }}</small>
          </article>
        </div>
      </section>

      <section class="workflow-side">
        <h2>操作日志</h2>
        <ul class="activity-list">
          <li v-for="log in workflow.operationLog" :key="log">{{ log }}</li>
        </ul>
      </section>
    </div>
  </section>
</template>
