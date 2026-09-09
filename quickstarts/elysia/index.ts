// docs/platforms/javascript/guides/elysia/index.mdx:105-127 (Node.js tab, error-monitoring + performance), verbatim
// except: the DSN, the two repro-only options (tunnel, debug), the port from APP_PORT bound to 127.0.0.1,
// and the repro routes chained before .listen() ("withElysia returns the app instance, so you can chain routes directly").
import * as Sentry from "@sentry/elysia";
import { Elysia } from "elysia";
import { node } from "@elysiajs/node";
import { registerRoutes } from "./routes.ts";

Sentry.init({
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  // Repro-only additions: deliver envelopes to the local sink and print init debug output.
  tunnel: process.env.SENTRY_TUNNEL,
  debug: true,

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/guides/elysia/configuration/options/#tracesSampleRate
  tracesSampleRate: 1.0,
});

// withElysia returns the app instance, so you can chain routes directly
const app = registerRoutes(Sentry.withElysia(new Elysia({ adapter: node() }))
  .get("/", () => "Hello World"))
  .listen({ port: Number(process.env.APP_PORT), hostname: "127.0.0.1" }, () => console.log(`app listening ${process.env.APP_PORT}`));
