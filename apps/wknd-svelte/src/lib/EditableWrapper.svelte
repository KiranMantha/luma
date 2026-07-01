<script lang="ts">
  import {
    CSS,
    endInstanceDrag,
    getRegistry,
    hasContent,
    notifyInstanceClick,
    offDragChange,
    onDragChange,
    startInstanceDrag,
    toStyle,
    type ComponentData,
    type ComponentPayload,
  } from './luma-preview';
  import AddComponentButton from './AddComponentButton.svelte';
  import DropBar from './DropBar.svelte';

  const { instance, componentType, index, zoneId, zoneMaxComponents, zoneComponentCount } = $props<{
    instance: ComponentData;
    componentType: string;
    index: number;
    zoneId: string;
    zoneMaxComponents: number | null;
    zoneComponentCount: number;
  }>();

  let hovered = $state(false);
  let anyDragging = $state(false);
  let liveConfig = $state<Record<string, unknown> | null>(null);
  let isDraggingThis = false;

  function onDragChangeHandler(d: boolean) { anyDragging = d; }
  $effect(() => {
    onDragChange(onDragChangeHandler);
    return () => offDragChange(onDragChangeHandler);
  });

  $effect(() => {
    const handler = (e: Event) => {
      liveConfig = (e as CustomEvent<ComponentPayload>).detail.config;
    };
    window.addEventListener(`luma:component:${instance.id}`, handler);
    return () => window.removeEventListener(`luma:component:${instance.id}`, handler);
  });

  const registry = getRegistry();
  const entry = $derived(registry[componentType]);
  const displayName = $derived(entry?.displayName ?? '');
  const config = $derived(liveConfig !== null ? liveConfig : (instance.config as Record<string, unknown>));
  const showDropBars = $derived(anyDragging && !isDraggingThis);
</script>

{#if showDropBars}
  <DropBar afterIndex={index - 1} {zoneId} {zoneMaxComponents} {zoneComponentCount} />
{/if}

<div
  role="presentation"
  style="position:relative"
  onmouseenter={() => { hovered = true; }}
  onmouseleave={() => { hovered = false; }}
>
  {#if !hasContent(config)}
    <div style={toStyle(CSS.placeholderCard)}>
      {entry?.placeholder ?? `${displayName} — click Edit to add content`}
    </div>
  {:else if entry}
    <svelte:component this={entry.component as any} id={instance.id} {...config} />
  {:else}
    <div style="padding:1rem;color:#dc2626;font-size:13px">
      [Luma] No component registered for "{componentType}"
    </div>
  {/if}

  <!-- Drag + click overlay -->
  <div
    role="button"
    tabindex="0"
    style={toStyle({ ...CSS.overlay, ...(hovered ? CSS.overlayHover : {}) })}
    draggable="true"
    ondragstart={(e) => {
      isDraggingThis = true;
      startInstanceDrag(instance.id, index, zoneId, e.dataTransfer!);
      setTimeout(() => { hovered = false; }, 0);
    }}
    ondragend={() => {
      isDraggingThis = false;
      endInstanceDrag();
    }}
    onclick={(e) => { e.stopPropagation(); notifyInstanceClick(instance.id, instance.componentId); }}
    onkeydown={(e) => { if (e.key === 'Enter') notifyInstanceClick(instance.id, instance.componentId); }}
  />

  {#if hovered}
    <button
      style={toStyle(CSS.editBadge)}
      onclick={(e) => { e.stopPropagation(); notifyInstanceClick(instance.id, instance.componentId); }}
    >
      Edit · {displayName}
    </button>
  {/if}
</div>
