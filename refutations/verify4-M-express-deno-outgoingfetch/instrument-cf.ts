import "@sentry/deno/import";
import "./jsonfix.ts";
import * as Sentry from "@sentry/deno";
import { fetchIntegration } from "@sentry/cloudflare";

Sentry.init({
  dsn: "https://public@example.com/1",
  tunnel: `http://127.0.0.1:${Deno.env.get("SINK_PORT")}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: (Deno.env.get("TRACE_LIFECYCLE") ?? "stream") as "stream" | "static",
  integrations: [fetchIntegration()],
});
console.log("sentry init cfFetchIntegration");
