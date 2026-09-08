import "@sentry/deno/import";
import * as Sentry from "@sentry/elysia";

Sentry.init({
  dsn: "https://public@example.invalid/1",
  tunnel: "http://127.0.0.1:43711/",
  tracesSampleRate: 1.0,
  traceLifecycle: (Deno.env.get("LIFECYCLE") as "static" | "stream") || "static",
  release: "m-elysia-deno@1",
  debug: false,
});
