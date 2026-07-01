<script lang="ts">
  const { general } = $props<{
    id: string;
    general?: { body?: string };
    [key: string]: unknown;
  }>();
</script>

<section style="padding: 2rem; max-width: 760px; margin: 0 auto;">
  {@html general?.body ?? '<p>Rich text content</p>'}
</section>
