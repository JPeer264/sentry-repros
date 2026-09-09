<!-- getting-started-complete/javascript.sveltekit.mdx:510-518 verbatim (the issues verify page) -->
<script>
  function throwTestError() {
    throw new Error("Sentry Example Frontend Error");
  }
</script>

<button type="button" onclick="{throwTestError}">Throw error</button>
