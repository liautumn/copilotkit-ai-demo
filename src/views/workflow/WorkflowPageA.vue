<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkflowStore } from '@/stores/workflow'

const router = useRouter()
const workflow = useWorkflowStore()
const validation = computed(() => workflow.validatePageA())

async function submit() {
  const result = workflow.submitPageA()
  if (result.ok) await router.push('/workflow/b')
}
</script>

<template>
  <section class="workflow-page">
    <header class="workflow-page__header">
      <div>
        <p class="eyebrow">A 页面</p>
        <h1>需求录入</h1>
        <p>模拟用户在第一个页面填写客户、金额、续约日期和需求摘要。</p>
      </div>
      <button class="button-secondary" @click="workflow.resetWorkflow">重置流程</button>
    </header>

    <div class="workflow-layout">
      <form class="workflow-form" @submit.prevent="submit">
        <label>
          <span>客户名称</span>
          <input v-model="workflow.request.customerName" placeholder="例如：华东智造集团" />
        </label>
        <label>
          <span>联系人</span>
          <input v-model="workflow.request.contactName" placeholder="例如：王经理" />
        </label>
        <label>
          <span>合同金额</span>
          <input v-model.number="workflow.request.contractAmount" type="number" min="0" />
        </label>
        <label>
          <span>续约日期</span>
          <input v-model="workflow.request.renewalDate" type="date" />
        </label>
        <label class="workflow-form__wide">
          <span>需求摘要</span>
          <textarea
            v-model="workflow.request.requirementSummary"
            rows="5"
            placeholder="描述客户续约目标、业务痛点和关键要求"
          />
        </label>

        <div class="button-row">
          <button type="submit">校验并进入 B 页面</button>
          <RouterLink class="docs-link" to="/workflow/b">直接查看 B 页面</RouterLink>
        </div>
      </form>

      <aside class="workflow-side">
        <h2>页面校验</h2>
        <p :class="validation.ok ? 'status-ok' : 'status-error'">
          {{ validation.ok ? 'A 页面校验通过' : 'A 页面还有未完成项' }}
        </p>
        <ul class="activity-list">
          <li v-for="error in validation.errors" :key="error">{{ error }}</li>
          <li v-if="validation.ok">所有必填项已满足，可以进入下一页。</li>
        </ul>
      </aside>
    </div>
  </section>
</template>
