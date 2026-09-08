import "@sentry/deno/import";
import * as Sentry from "@sentry/elysia";

Sentry.init({
  dsn: "https://public@example.invalid/1",
  tunnel: "http://127.0.0.1:51701/",
  tracesSampleRate: 1.0,
  traceLifecycle: (Deno.env.get("LIFECYCLE") as "static" | "stream") || "stream",
  tracePropagationTargets: [/.*/],
  release: "v4-a@1",
  debug: !!Deno.env.get("SDEBUG"),
});
