<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  name?: string
  status?: string
  result?: string
  args?: { query?: string }
  parameters?: { query?: string }
}>()

const query = computed(() => props.parameters?.query ?? props.args?.query ?? '知识库')
const toolName = computed(() => props.name ?? '知识库搜索')
const matches = computed(() => {
  if (!props.result) return []
  try {
    const parsed = JSON.parse(props.result) as { matches?: string[] }
    return parsed.matches ?? []
  } catch {
    return [props.result]
  }
})
</script>

<template>
  <div class="tool-card">
    <div class="tool-card__header">
      <span>{{ toolName }}</span>
      <strong>{{ status ?? '完成' }}</strong>
    </div>
    <p>查询：{{ query }}</p>
    <ul v-if="matches.length">
      <li v-for="match in matches" :key="match">{{ match }}</li>
    </ul>
  </div>
</template>
