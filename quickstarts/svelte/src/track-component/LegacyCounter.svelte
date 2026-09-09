<!-- trackUpdates: true in a legacy-mode component (export let, no runes) -->
<script>
  import * as Sentry from "@sentry/svelte";
  Sentry.trackComponent({ trackInit: true, trackUpdates: true, componentName: "LegacyCounter" });
  export let value;
</script>

<p id="legacy">legacy {value}</p>
