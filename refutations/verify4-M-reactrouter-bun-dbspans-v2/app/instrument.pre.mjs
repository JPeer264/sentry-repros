import "mysql2/promise";
import { bunHttpServerIntegration } from "@sentry/bun";
import * as Sentry from "@sentry/react-router";

Sentry.init({
  dsn: "https://public@127.0.0.1/1",
  tunnel: process.env.SENTRY_TUNNEL,
  tracesSampleRate: 1.0,
  traceLifecycle: "static",
  integrations: [bunHttpServerIntegration()],
});
