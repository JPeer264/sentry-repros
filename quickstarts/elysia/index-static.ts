// index.ts plus traceLifecycle: "static", the option platform-includes/performance/enable-stream-mode/javascript.elysia.mdx:17,25
// calls "transaction mode" and "the default".
import * as Sentry from "@sentry/elysia";
import { Elysia } from "elysia";
import { node } from "@elysiajs/node";
import { registerRoutes } from "./routes.ts";

Sentry.init({
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: process.env.SENTRY_TUNNEL,
  debug: true,
  tracesSampleRate: 1.0,
  traceLifecycle: "static",
});

const app = registerRoutes(Sentry.withElysia(new Elysia({ adapter: node() })))
  .listen({ port: Number(process.env.APP_PORT), hostname: "127.0.0.1" }, () => console.log(`app listening ${process.env.APP_PORT}`));
