if (Deno.env.get("NO_INJECT") === "1") {
  (globalThis as Record<string, unknown>).__SENTRY_ORCHESTRION__ = { runtimeUnavailable: true };
}
import * as Sentry from "@sentry/nestjs";

Sentry.init({
  dsn: "https://public@localhost/1",
  tunnel: `http://127.0.0.1:${Deno.env.get("SINK_PORT")}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: (Deno.env.get("LIFECYCLE") || "static") as "static" | "stream",
  debug: Deno.env.get("SENTRY_DEBUG") === "1",
});
