import * as Sentry from "@sentry/deno";
import { denoFetchIntegration } from "./sentry-fetch-integration.ts";

const useFetchIntegration = Deno.env.get("FETCH_INTEGRATION") === "1";

Sentry.init({
  dsn: "https://public@example.invalid/1",
  tunnel: `http://127.0.0.1:${Deno.env.get("SINK_PORT")}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: (Deno.env.get("LIFECYCLE") as "static" | "stream") ?? "stream",
  tracePropagationTargets: [/.*/],
  integrations: useFetchIntegration ? [denoFetchIntegration()] : [],
});
