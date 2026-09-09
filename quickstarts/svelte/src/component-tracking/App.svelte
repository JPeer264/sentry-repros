<script>
  import { onMount } from "svelte";
  import Navbar from "./Navbar.svelte";
  import PrimaryButton from "./PrimaryButton.svelte";
  import LoginForm from "./LoginForm.svelte";
  import { markWired } from "../shared/harness";

  let renders = $state(0);
  onMount(markWired);
</script>

<Navbar />
<h1>QS-svelte component tracking, render {renders}</h1>
<PrimaryButton label="Primary" />
<LoginForm />
<button id="btn-update" type="button" onclick={() => (renders += 1)}>re-render</button>
<span id="renders">{renders}</span>
