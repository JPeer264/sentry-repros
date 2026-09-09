// install/late-initialization.mdx:68: `node --import @sentry/node/preload app.mjs`, with Sentry.init() called
// after the framework import (the page's late-init pattern), plus the repro-only options.
import Hapi from "@hapi/hapi";
import * as Sentry from "@sentry/node";
import { registerRoutes } from "./routes.mjs";

Sentry.init({
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: process.env.SENTRY_TUNNEL,
  debug: true,
  tracesSampleRate: 1.0,
});

const init = async () => {
  const server = Hapi.server({
    port: Number(process.env.APP_PORT),
    host: "127.0.0.1",
  });

  // All your routes etc.
  await registerRoutes(server);

  await server.start();
};

init();
