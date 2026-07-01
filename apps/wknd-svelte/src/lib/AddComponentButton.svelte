<script lang="ts">
  import { CSS, notifyAddComponent, toStyle } from './luma-preview';

  const { zoneId, afterIndex } = $props<{
    zoneId: string;
    afterIndex: number | null;
  }>();
</script>

<button style={toStyle(CSS.addButton)} onclick={() => notifyAddComponent(zoneId, afterIndex)}>
  + Add Component
</button>
