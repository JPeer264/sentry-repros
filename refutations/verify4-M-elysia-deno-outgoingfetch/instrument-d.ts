import "@sentry/deno/import";
import * as Sentry from "@sentry/deno";
import { fetchIntegration } from "@sentry/elysia";

Sentry.init({
  dsn: "https://public@example.invalid/1",
  tunnel: "http://127.0.0.1:51817/",
  tracesSampleRate: 1.0,
  traceLifecycle: (Deno.env.get("LIFECYCLE") as "static" | "stream") || "static",
  release: "v4-d@1",
  integrations: [fetchIntegration()],
});
