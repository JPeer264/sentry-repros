import "@sentry/deno/import";
import * as Sentry from "@sentry/deno";

Sentry.init({
  dsn: "https://public@127.0.0.1/1",
  tunnel: `http://127.0.0.1:${Deno.env.get("SINK_PORT")}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: (Deno.env.get("LIFECYCLE") || "stream") as "stream" | "static",
  debug: !!Deno.env.get("DEBUG"),
});
