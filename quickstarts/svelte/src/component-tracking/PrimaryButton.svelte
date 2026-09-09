<script>
  let { label } = $props();
  let clicks = $state(0);
</script>

<button type="button" onclick={() => (clicks += 1)}>{label} ({clicks})</button>
