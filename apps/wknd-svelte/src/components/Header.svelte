<script lang="ts">
  import './Header.css';

  type MainMenuNav = {
    menuName: string;
    subMenu: Array<{ menuName: string; url: string; iconName: string }>;
  };

  const { general, menu1, menu2 } = $props<{
    general: { brandName: string };
    menu1?: MainMenuNav;
    menu2?: MainMenuNav;
  }>();

  const menus = [menu1, menu2].filter(Boolean) as MainMenuNav[];
</script>

<header>
  <p class="brandName">{general.brandName}</p>
  <ul>
    {#each menus as menu (menu.menuName)}
      <li>{menu.menuName}</li>
    {/each}
  </ul>
</header>
