<!-- getting-started-complete/javascript.sveltekit.mdx:561-582 verbatim (the tracing verify page) -->
<script>
  import * as Sentry from "@sentry/sveltekit";

  function throwTestError() {
    Sentry.startSpan(
      {
        name: "Example Frontend Span",
        op: "test",
      },
      async () => {
        const res = await fetch("/sentry-example");
        if (!res.ok) {
          throw new Error("Sentry Example Frontend Error");
        }
      }
    );
  }
</script>

<button type="button" onclick="{throwTestError}">Throw error with trace</button>
