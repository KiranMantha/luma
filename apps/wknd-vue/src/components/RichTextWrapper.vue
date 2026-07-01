<script setup lang="ts">
defineProps<{
  id: string;
  general?: { body?: string };
  [key: string]: unknown;
}>();
</script>

<template>
  <section style="padding: 2rem; max-width: 760px; margin: 0 auto;">
    <div v-html="general?.body ?? '<p>Rich text content</p>'" />
  </section>
</template>
