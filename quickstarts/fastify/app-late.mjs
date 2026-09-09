// docs/platforms/javascript/common/install/late-initialization.mdx:68: started with
// `node --import @sentry/node/preload app-late.mjs`, Sentry.init() is called after the imports.
import Fastify from "fastify";
import * as Sentry from "@sentry/node";
import { registerRoutes } from "./routes.mjs";

Sentry.init({
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: process.env.SENTRY_TUNNEL,
  debug: true,
  tracesSampleRate: 1.0,
});

const app = Fastify();

registerRoutes(app);

app.listen({ port: Number(process.env.APP_PORT), host: "127.0.0.1" }).then(() => console.log(`app listening ${process.env.APP_PORT}`));
