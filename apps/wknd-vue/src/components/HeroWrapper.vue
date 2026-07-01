<script setup lang="ts">
import { computed } from 'vue';
import { useLumaComponent } from '../lib/luma-preview';

const props = defineProps<{
  id: string;
  general?: { title?: string; subtitle?: string };
  [key: string]: unknown;
}>();

const live = useLumaComponent<typeof props>(props.id);
const data = computed(() => live.value ?? props);
</script>

<template>
  <section style="padding: 3rem 2rem; background: #1e3a5f; color: white; text-align: center;">
    <h1 style="font-size: 2.5rem; font-weight: 700; margin: 0;">{{ data.general?.title ?? 'Hero Title' }}</h1>
    <p v-if="data.general?.subtitle" style="font-size: 1.25rem; margin-top: 0.75rem; opacity: 0.85;">
      {{ data.general.subtitle }}
    </p>
  </section>
</template>
