import "@sentry/deno/import";
import * as Sentry from "@sentry/deno";

Sentry.init({
  dsn: "https://public@localhost/1",
  tunnel: "http://127.0.0.1:38417/",
  tracesSampleRate: 1.0,
  traceLifecycle: (Deno.env.get("LIFECYCLE") ?? "static") as "static" | "stream",
  debug: Deno.env.get("SENTRY_DEBUG") === "1",
});
