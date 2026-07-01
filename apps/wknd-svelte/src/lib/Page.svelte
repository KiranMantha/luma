<script lang="ts">
  import { onMount } from 'svelte';
  import { MODE, fetchPageBySlug, getPageSlugFromUrl, type PageModel } from './luma-preview';
  import PageRenderer from './PageRenderer.svelte';

  let page = $state<PageModel | null>(null);
  let error = $state<string | null>(null);

  onMount(async () => {
    if (MODE === 'edit') return;
    const slug = getPageSlugFromUrl();
    if (!slug) { error = 'No page slug in URL path'; return; }
    try {
      page = await fetchPageBySlug(slug);
    } catch (err) {
      error = (err as Error).message;
    }
  });
</script>

{#if MODE === 'edit'}
  <PageRenderer components={[]} />
{:else if error}
  <div style="padding:2rem;color:#dc2626">Error: {error}</div>
{:else if !page}
  <div style="padding:2rem;color:#94a3b8">Loading…</div>
{:else}
  <PageRenderer components={page.components} />
{/if}
