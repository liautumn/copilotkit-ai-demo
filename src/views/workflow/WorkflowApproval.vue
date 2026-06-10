<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkflowStore } from '@/stores/workflow'

const router = useRouter()
const workflow = useWorkflowStore()
const note = ref('同意续约方案，按当前商务条件推进合同。')
const validation = computed(() => workflow.validateApproval())

async function resolve(approved: boolean) {
  const result = workflow.resolveApproval(approved, note.value)
  if (result.ok && approved) await router.push('/workflow/stats')
}
</script>

<template>
  <section class="workflow-page">
    <header class="workflow-page__header">
      <div>
        <p class="eyebrow">流程审批</p>
        <h1>审批处理</h1>
        <p>模拟审批人查看 A/B 页面提交的数据，并决定通过或驳回。</p>
      </div>
      <RouterLink class="docs-link" to="/workflow/stats">查看统计</RouterLink>
    </header>

    <div class="workflow-layout">
      <section class="workflow-form">
        <dl class="details-list">
          <div>
            <dt>审批状态</dt>
            <dd>{{ workflow.approval.status }}</dd>
          </div>
          <div>
            <dt>审批人</dt>
            <dd>{{ workflow.approval.approver }}</dd>
          </div>
          <div>
            <dt>客户</dt>
            <dd>{{ workflow.request.customerName || '未填写' }}</dd>
          </div>
          <div>
            <dt>方案</dt>
            <dd>{{ workflow.request.solutionPlan || '未填写' }}</dd>
          </div>
        </dl>

        <label>
          <span>审批意见</span>
          <textarea v-model="note" rows="5" />
        </label>

        <div class="button-row">
          <button :disabled="!validation.ok" @click="resolve(true)">通过审批</button>
          <button class="button-secondary" :disabled="!validation.ok" @click="resolve(false)">
            驳回
          </button>
        </div>
      </section>

      <aside class="workflow-side">
        <h2>审批校验</h2>
        <p :class="validation.ok ? 'status-ok' : 'status-error'">
          {{ validation.ok ? '可以审批' : '暂不能审批' }}
        </p>
        <ul class="activity-list">
          <li v-for="error in validation.errors" :key="error">{{ error }}</li>
          <li v-if="validation.ok">流程已提交，可以处理审批。</li>
        </ul>
      </aside>
    </div>
  </section>
</template>
