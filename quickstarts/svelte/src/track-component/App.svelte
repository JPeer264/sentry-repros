<script>
  import { onMount, flushSync } from "svelte";
  import * as Sentry from "@sentry/svelte";
  import MyComponent from "./MyComponent.svelte";
  import RunesCounter from "./RunesCounter.svelte";
  import LegacyCounter from "./LegacyCounter.svelte";
  import { markWired } from "../shared/harness";

  let value = $state(0);
  onMount(markWired);

  // Update spans use onlyIfParent, so the prop change is flushed inside an active span.
  function update() {
    Sentry.startSpan({ name: "update-click", op: "ui.action.click" }, () => {
      value += 1;
      flushSync();
    });
  }
</script>

<h1>QS-svelte trackComponent</h1>
<MyComponent />
<RunesCounter {value} />
<LegacyCounter {value} />
<button id="btn-update" type="button" onclick={update}>update</button>
<span id="value">{value}</span>
