<script setup lang="ts">
import './lib/import-components';
import { LumaProvider, Page } from './lib/luma-preview';
</script>

<template>
  <LumaProvider>
    <Page />
  </LumaProvider>
</template>
