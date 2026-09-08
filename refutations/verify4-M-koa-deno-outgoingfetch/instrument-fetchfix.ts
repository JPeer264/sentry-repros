import * as Sentry from "@sentry/deno";
import { manualFetchIntegration } from "./fetch-integration.ts";

Sentry.init({
  dsn: "https://public@example.invalid/1",
  tunnel: Deno.env.get("TUNNEL"),
  tracesSampleRate: 1.0,
  traceLifecycle: (Deno.env.get("LIFECYCLE") ?? "static") as "static" | "stream",
  integrations: [manualFetchIntegration()],
});
