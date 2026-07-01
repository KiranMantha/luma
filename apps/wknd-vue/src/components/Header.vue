<script setup lang="ts">
import './Header.css';

type MainMenuNav = {
  menuName: string;
  subMenu: Array<{ menuName: string; url: string; iconName: string }>;
};

const props = defineProps<{
  general: { brandName: string };
  menu1?: MainMenuNav;
  menu2?: MainMenuNav;
}>();

const menus = [props.menu1, props.menu2].filter(Boolean) as MainMenuNav[];
</script>

<template>
  <header>
    <p class="brandName">{{ general.brandName }}</p>
    <ul>
      <li v-for="menu in menus" :key="menu.menuName">{{ menu.menuName }}</li>
    </ul>
  </header>
</template>
