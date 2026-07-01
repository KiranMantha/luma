<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import {
    MODE,
    extractSectionData,
    getRegistry,
    getZoneComponents,
    sortByOrder,
    type ComponentData,
    type PageModelPayload,
    type ZoneInfo,
  } from './luma-preview';
  import AddComponentButton from './AddComponentButton.svelte';
  import DropBar from './DropBar.svelte';
  import EditableWrapper from './EditableWrapper.svelte';
  import EmptyZoneDropTarget from './EmptyZoneDropTarget.svelte';

  const { components: initialComponents } = $props<{ components: ComponentData[] }>();

  let zones = $state<ZoneInfo[]>([]);
  let allComponents = $state<ComponentData[]>(initialComponents);

  const registry = getRegistry();

  function pageModelHandler(e: Event) {
    const payload = (e as CustomEvent<PageModelPayload>).detail;
    zones = payload.zones;
    allComponents = payload.components;
  }

  onMount(() => {
    if (MODE === 'edit') window.addEventListener('luma:pageModel', pageModelHandler);
  });
  onDestroy(() => {
    window.removeEventListener('luma:pageModel', pageModelHandler);
  });
</script>

{#if MODE !== 'edit'}
  <!-- Preview mode: flat render, section data spread directly from component object -->
  <main>
    {#each sortByOrder(initialComponents) as comp (comp.id)}
      {#if registry[comp.type]}
        <svelte:component this={registry[comp.type].component as any} id={comp.id} {...extractSectionData(comp)} />
      {/if}
    {/each}
  </main>
{:else}
  <!-- Edit mode: zone-aware render driven by CMS postMessage -->
  <div>
    {#each sortByOrder(zones) as zone (zone.id)}
      {@const zoneComponents = getZoneComponents(allComponents, zone.id)}
      <div>
        {#if zoneComponents.length === 0}
          <EmptyZoneDropTarget zoneName={zone.name} locked={zone.locked} />
          {#if !zone.locked}
            <AddComponentButton zoneId={zone.id} afterIndex={null} />
          {/if}
        {:else}
          {#each zoneComponents as comp, i (comp.id)}
            <EditableWrapper
              instance={comp}
              componentType={comp.type}
              index={i}
              zoneId={zone.id}
              zoneMaxComponents={zone.maxComponents}
              zoneComponentCount={zoneComponents.length}
            />
          {/each}
          <DropBar
            afterIndex={zoneComponents.length - 1}
            zoneId={zone.id}
            zoneMaxComponents={zone.maxComponents}
            zoneComponentCount={zoneComponents.length}
          />
          {#if !zone.locked}
            <AddComponentButton zoneId={zone.id} afterIndex={zoneComponents.length - 1} />
          {/if}
        {/if}
      </div>
    {/each}
  </div>
{/if}
