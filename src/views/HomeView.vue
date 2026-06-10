<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { demoGroups } from '@/data/demoCatalog'
</script>

<template>
  <section class="home-page">
    <header class="home-hero">
      <p class="eyebrow">Vue 3 原生集成</p>
      <h1>CopilotKit 演示页面</h1>
      <p>
        这个工作台使用 <code>@copilotkit/vue</code> 和 TypeScript 后端 Runtime，
        用独立路由展示 CopilotKit 的聊天、工具、状态和调试能力。
      </p>
    </header>

    <section v-for="(demos, group) in demoGroups" :key="group" class="demo-group">
      <h2>{{ group }}</h2>
      <div class="card-grid">
        <RouterLink
          v-for="demo in demos"
          :key="demo.slug"
          class="demo-card"
          :to="`/demos/${demo.slug}`"
        >
          <span>{{ demo.category }}</span>
          <strong>{{ demo.title }}</strong>
          <p>{{ demo.summary }}</p>
        </RouterLink>
      </div>
    </section>
  </section>
</template>
