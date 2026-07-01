<script setup lang="ts">
import './Card.css';

defineProps<{
  general: {
    image?: string;
    title: string;
    description: string;
  };
}>();
</script>

<template>
  <div class="card">
    <img :src="general.image" alt="Card image" class="card-image" />
    <div class="card-body">
      <h3 class="card-title">{{ general.title }}</h3>
      <p class="card-description">{{ general.description }}</p>
    </div>
  </div>
</template>
