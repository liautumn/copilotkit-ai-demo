<script setup lang="ts">
defineProps<{
  title: string
  kicker: string
  description: string
  docsUrl: string
}>()
</script>

<template>
  <section class="demo-shell">
    <header class="demo-shell__header">
      <div>
        <p class="eyebrow">{{ kicker }}</p>
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
      </div>
      <a class="docs-link" :href="docsUrl" target="_blank" rel="noreferrer">文档</a>
    </header>

    <div class="demo-shell__body">
      <slot />
    </div>
  </section>
</template>
