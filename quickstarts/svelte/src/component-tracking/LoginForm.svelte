<script>
  let email = "";
</script>

<form onsubmit={(e) => e.preventDefault()}>
  <input id="email" bind:value={email} placeholder="email" />
  <span id="email-echo">{email}</span>
</form>
