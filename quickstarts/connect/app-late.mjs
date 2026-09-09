// install/late-initialization.mdx:68: `node --import @sentry/node/preload app.mjs`, with Sentry.init() called
// after the framework import (the page's late-init pattern), plus the repro-only options.
import connect from "connect";
import * as Sentry from "@sentry/node";
import { registerRoutes } from "./routes.mjs";

Sentry.init({
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: process.env.SENTRY_TUNNEL,
  debug: true,
  tracesSampleRate: 1.0,
});

const app = connect();

// Add your routes, etc.
registerRoutes(app);

app.listen(Number(process.env.APP_PORT), "127.0.0.1", () => console.log(`app listening ${process.env.APP_PORT}`));
