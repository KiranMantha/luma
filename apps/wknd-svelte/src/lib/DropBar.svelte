<script lang="ts">
  import { CSS, canZoneAccept, getCurrentDrag, handleDropOnBar, toStyle } from './luma-preview';

  const { afterIndex, zoneId, zoneMaxComponents, zoneComponentCount } = $props<{
    afterIndex: number | null;
    zoneId: string;
    zoneMaxComponents: number | null;
    zoneComponentCount: number;
  }>();

  let over = $state(false);

  function handleDragOver(e: DragEvent) {
    if (!getCurrentDrag() || !canZoneAccept(zoneMaxComponents, zoneComponentCount)) return;
    e.preventDefault();
    e.stopPropagation();
    over = true;
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    over = false;
    handleDropOnBar(afterIndex, zoneId, zoneMaxComponents, zoneComponentCount);
  }
</script>

<div
  style={toStyle(over ? { ...CSS.dropBar, ...CSS.dropBarActive } : CSS.dropBar)}
  ondragover={handleDragOver}
  ondragleave={() => { over = false; }}
  ondrop={handleDrop}
/>
