<script>
  import { onMount } from "svelte";
  import SomeComponent from "./SomeComponent.svelte";
  import { markWired } from "../shared/harness";

  onMount(markWired);
</script>

<h1>QS-svelte base</h1>
<SomeComponent />
