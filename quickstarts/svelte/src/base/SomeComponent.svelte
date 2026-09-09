<script>
  import * as Sentry from "@sentry/svelte";
</script>

<!-- index.mdx:215-222 (Issues verify button, Svelte v5+ tab), only the id is added -->
<button
  id="btn-throw"
  type="button"
  onclick={() => {
    throw new Error("Sentry Frontend Error");
  }}
>
  Throw error
</button>

<!-- index.mdx:255-266 (Tracing verify button, Svelte v5+ tab) verbatim: note `onClick` -->
<button
  id="btn-span"
  type="button"
  onClick={() => {
    Sentry.startSpan({ op: "test", name: "Example Frontend Span" }, () => {
      setTimeout(() => {
        throw new Error("Sentry Frontend Error");
      }, 99);
    });
  }}
>
  Throw error
</button>

<!-- the same snippet with Svelte 5's lowercase event attribute `onclick` -->
<button
  id="btn-span-fixed"
  type="button"
  onclick={() => {
    Sentry.startSpan({ op: "test", name: "Example Frontend Span" }, () => {
      setTimeout(() => {
        throw new Error("Sentry Frontend Error");
      }, 99);
    });
  }}
>
  Throw error
</button>

<!-- includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:12-24 -->
<button
  id="btn-log"
  type="button"
  onclick={() => {
    Sentry.logger.info("User example action completed");

    Sentry.logger.warn("Slow operation detected", {
      operation: "data_fetch",
      duration: 3500,
    });

    Sentry.logger.error("Validation failed", {
      field: "email",
      reason: "Invalid email",
    });
  }}
>
  logs
</button>

<!-- Propagation probe for tracePropagationTargets: ["localhost", ...] (index.mdx:104) -->
<button
  id="btn-fetch"
  type="button"
  onclick={() => {
    fetch("/recorder?from=relative");
    fetch(window.location.origin + "/recorder?from=absolute");
  }}
>
  fetch
</button>
