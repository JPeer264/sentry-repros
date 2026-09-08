import "@sentry/deno/import";
import * as Sentry from "@sentry/deno";

const sinkPort = Deno.env.get("SINK_PORT") ?? "41317";

Sentry.init({
  dsn: "https://public@127.0.0.1/1",
  tunnel: `http://127.0.0.1:${sinkPort}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: (Deno.env.get("SENTRY_LIFECYCLE") ?? "stream") as
    | "static"
    | "stream",
});
