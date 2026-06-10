<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  name?: string
  status?: string
  result?: string
  args?: { theme?: string; title?: string; ticketId?: string; status?: string }
}>()

const payload = computed(() => JSON.stringify(props.args ?? {}, null, 2))
const toolName = computed(() => props.name ?? '前端工具')
</script>

<template>
  <div class="tool-card tool-card--compact">
    <div class="tool-card__header">
      <span>{{ toolName }}</span>
      <strong>{{ status ?? '处理中' }}</strong>
    </div>
    <pre>{{ payload }}</pre>
    <p v-if="result">{{ result }}</p>
  </div>
</template>
