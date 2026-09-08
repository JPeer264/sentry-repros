import "@sentry/deno/import";
import * as Sentry from "@sentry/deno";

Sentry.init({
  dsn: "https://public@example.invalid/1",
  tunnel: "http://127.0.0.1:52987/",
  tracesSampleRate: 1.0,
  traceLifecycle: (Deno.env.get("LIFECYCLE") as "static" | "stream") || "static",
  release: "v4-elysia-deno-c@1",
});
