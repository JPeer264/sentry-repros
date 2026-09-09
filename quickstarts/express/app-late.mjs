// docs/platforms/javascript/common/install/late-initialization.mdx:64-91:
// started with `node --import @sentry/node/preload app-late.mjs`, Sentry.init() runs after the app.
import express from "express";
import * as Sentry from "@sentry/node";
import { registerRoutes } from "./routes.mjs";

const app = express();
registerRoutes(app);
app.listen(Number(process.env.APP_PORT), "127.0.0.1", () => console.log(`app listening ${process.env.APP_PORT}`));

Sentry.init({
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: process.env.SENTRY_TUNNEL,
  debug: true,

  // Add Tracing by setting tracesSampleRate
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

// From now on, Sentry is initialized,
// but the app is still auto-instrumented
