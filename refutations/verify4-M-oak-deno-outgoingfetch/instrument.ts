import "@sentry/deno/import";
import * as Sentry from "@sentry/deno";
import { denoFetchIntegration } from "./fetch-integration.ts";

const extra = Deno.env.get("FETCHFIX") === "on" ? [denoFetchIntegration()] : [];

Sentry.init({
  dsn: "https://public@example.com/1",
  tunnel: `http://127.0.0.1:${Deno.env.get("SINK_PORT")}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: (Deno.env.get("LIFECYCLE") ?? "static") as "static" | "stream",
  integrations: extra,
  tracePropagationTargets: [/.*/],
});
