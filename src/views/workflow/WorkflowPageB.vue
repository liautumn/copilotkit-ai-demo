<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkflowStore } from '@/stores/workflow'

const router = useRouter()
const workflow = useWorkflowStore()
const validation = computed(() => workflow.validatePageB())

async function submit() {
  const result = workflow.submitPageB()
  if (result.ok) await router.push('/workflow/approval')
}
</script>

<template>
  <section class="workflow-page">
    <header class="workflow-page__header">
      <div>
        <p class="eyebrow">B 页面</p>
        <h1>方案配置</h1>
        <p>模拟用户在第二个页面配置解决方案、风险等级和负责人，并提交审批。</p>
      </div>
      <RouterLink class="docs-link" to="/workflow/a">返回 A 页面</RouterLink>
    </header>

    <div class="workflow-layout">
      <form class="workflow-form" @submit.prevent="submit">
        <label class="workflow-form__wide">
          <span>方案说明</span>
          <textarea
            v-model="workflow.request.solutionPlan"
            rows="6"
            placeholder="描述续约方案、服务范围、交付计划和商务策略"
          />
        </label>
        <label>
          <span>风险等级</span>
          <select v-model="workflow.request.riskLevel">
            <option>低</option>
            <option>中</option>
            <option>高</option>
          </select>
        </label>
        <label>
          <span>负责人</span>
          <input v-model="workflow.request.owner" placeholder="例如：林秋" />
        </label>

        <div class="button-row">
          <button type="submit">校验并提交审批</button>
          <RouterLink class="docs-link" to="/workflow/approval">查看审批页</RouterLink>
        </div>
      </form>

      <aside class="workflow-side">
        <h2>来自 A 页的数据</h2>
        <dl class="details-list">
          <div>
            <dt>客户</dt>
            <dd>{{ workflow.request.customerName || '未填写' }}</dd>
          </div>
          <div>
            <dt>金额</dt>
            <dd>{{ workflow.request.contractAmount || '未填写' }}</dd>
          </div>
          <div>
            <dt>续约日期</dt>
            <dd>{{ workflow.request.renewalDate || '未填写' }}</dd>
          </div>
        </dl>

        <h2>页面校验</h2>
        <p :class="validation.ok ? 'status-ok' : 'status-error'">
          {{ validation.ok ? 'B 页面校验通过' : 'B 页面还有未完成项' }}
        </p>
        <ul class="activity-list">
          <li v-for="error in validation.errors" :key="error">{{ error }}</li>
          <li v-if="validation.ok">方案配置已满足提交审批条件。</li>
        </ul>
      </aside>
    </div>
  </section>
</template>
