<script setup lang="ts">
import { computed } from 'vue';
import { useLumaComponent } from '../lib/luma-preview';

const props = defineProps<{
  id: string;
  general?: { body?: string };
  [key: string]: unknown;
}>();

const live = useLumaComponent<typeof props>(props.id);
const data = computed(() => live.value ?? props);
const body = computed(() => data.value.general?.body ?? '<p>Rich text content</p>');
</script>

<template>
  <section style="padding: 2rem; max-width: 760px; margin: 0 auto;">
    <div v-html="body" />
  </section>
</template>
