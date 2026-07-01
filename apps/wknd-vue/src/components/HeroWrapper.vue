<script setup lang="ts">
defineProps<{
  id: string;
  general?: { title?: string; subtitle?: string };
  [key: string]: unknown;
}>();
</script>

<template>
  <section style="padding: 3rem 2rem; background: #1e3a5f; color: white; text-align: center;">
    <h1 style="font-size: 2.5rem; font-weight: 700; margin: 0;">{{ general?.title ?? 'Hero Title' }}</h1>
    <p v-if="general?.subtitle" style="font-size: 1.25rem; margin-top: 0.75rem; opacity: 0.85;">
      {{ general.subtitle }}
    </p>
  </section>
</template>
