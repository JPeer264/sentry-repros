import * as Sentry from "@sentry/deno";

Sentry.init({
  dsn: "https://abc@o1.ingest.sentry.io/1",
  tunnel: Deno.env.get("SINK")!,
  tracesSampleRate: 1.0,
  traceLifecycle: (Deno.env.get("LIFECYCLE") ?? "static") as "static" | "stream",
  debug: Deno.env.get("SDK_DEBUG") === "1",
});
