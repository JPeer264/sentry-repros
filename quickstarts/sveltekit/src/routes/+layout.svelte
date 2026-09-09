<script>
  let { children } = $props();
</script>

<nav>
  <a href="/" id="nav-home">home</a>
  <a href="/sentry-example" id="nav-example">sentry-example</a>
  <a href="/sentry-example-plain" id="nav-example-plain">sentry-example-plain</a>
  <a href="/users/42" id="nav-user">user 42</a>
  <a href="/load-throws" id="nav-load-throws">load throws</a>
</nav>

{@render children()}
