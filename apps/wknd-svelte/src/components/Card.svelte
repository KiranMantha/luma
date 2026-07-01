<script lang="ts">
  import './Card.css';

  const { general } = $props<{
    general: {
      image?: string;
      title: string;
      description: string;
    };
  }>();
</script>

<div class="card">
  <img src={general.image} alt="Card image" class="card-image" />
  <div class="card-body">
    <h3 class="card-title">{general.title}</h3>
    <p class="card-description">{general.description}</p>
  </div>
</div>
