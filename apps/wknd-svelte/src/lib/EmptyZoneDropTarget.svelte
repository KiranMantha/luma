<script lang="ts">
  import { CSS, offDragChange, onDragChange, setCurrentDrag, toStyle } from './luma-preview';

  const { zoneName, locked } = $props<{ zoneName: string; locked: boolean }>();

  let over = $state(false);
  let anyDragging = $state(false);

  function onDragChangeHandler(d: boolean) { anyDragging = d; }
  $effect(() => {
    onDragChange(onDragChangeHandler);
    return () => offDragChange(onDragChangeHandler);
  });
</script>

{#if !anyDragging || locked}
  <div style={toStyle(CSS.emptyZone)}>
    {locked ? `${zoneName} — locked` : `Drop components here into ${zoneName}`}
  </div>
{:else}
  <div
    style={toStyle(over ? { ...CSS.emptyZone, ...CSS.emptyZoneActive } : { ...CSS.emptyZone, borderColor: '#6366f1' })}
    ondragover={(e) => { e.preventDefault(); e.stopPropagation(); over = true; }}
    ondragleave={() => { over = false; }}
    ondrop={(e) => { e.preventDefault(); e.stopPropagation(); over = false; setCurrentDrag(null); }}
  >
    Drop here → {zoneName}
  </div>
{/if}
