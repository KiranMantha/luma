<script lang="ts">
  import { setupLumaBridge } from './luma-preview';

  const { children } = $props<{ children?: any }>();

  setupLumaBridge();
</script>

{@render children?.()}
