// getting-started-complete/javascript.astro.mdx:308-336 verbatim without the profiling option, plus the
// repro-only `debug` line. The DSN points at the local sink (the page shows the `dsn` option only).
import * as Sentry from "@sentry/astro";

Sentry.init({
  dsn: "http://public@127.0.0.1:4756/1",

  // Define how likely traces are sampled. Adjust this value in production,
  // or use tracesSampler for greater control.
  tracesSampleRate: 1.0,

  // repro-only
  debug: true,
});
