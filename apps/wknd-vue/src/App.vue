<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { fetchPageBySlug, type PageModel } from './lib/api';
import { MapTo, PageRenderer, useLumaReceiver } from './lib/luma-preview';

// Register components — must import before PageRenderer renders
import Card from './components/Card.vue';
import Header from './components/Header.vue';
import HeroWrapper from './components/HeroWrapper.vue';
import RichTextWrapper from './components/RichTextWrapper.vue';

MapTo('wkndvue/components/header', Header);
MapTo('wkndvue/components/card', Card);
MapTo('wkndvue/components/hero', HeroWrapper);
MapTo('wkndvue/components/richText', RichTextWrapper);

useLumaReceiver();

const page = ref<PageModel | null>(null);
const error = ref<string | null>(null);

onMounted(async () => {
  const slug = window.location.pathname.split('/').filter(Boolean).at(-1);
  if (!slug) { error.value = 'No page slug in URL path'; return; }
  try {
    page.value = await fetchPageBySlug(slug);
  } catch (err) {
    error.value = String(err);
  }
});
</script>

<template>
  <div style="font-family: system-ui, sans-serif; min-height: 100vh;">
    <div v-if="error" style="padding: 2rem; color: #dc2626;">Error: {{ error }}</div>
    <div v-else-if="!page" style="padding: 2rem; color: #94a3b8;">Loading…</div>
    <PageRenderer v-else :components="page.components" />
  </div>
</template>
