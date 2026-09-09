<!-- trackUpdates: true in a Svelte 5 runes-mode component ($props) -->
<script>
  import * as Sentry from "@sentry/svelte";
  Sentry.trackComponent({ trackInit: true, trackUpdates: true, componentName: "RunesCounter" });
  let { value } = $props();
</script>

<p id="runes">runes {value}</p>
