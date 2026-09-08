import * as Sentry from "@sentry/deno";
import { SINK } from "./config.ts";

Sentry.init({
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: SINK,
  debug: true,
  // Capture 100% of transactions. Lower this in production.
  tracesSampleRate: 1.0,
});
