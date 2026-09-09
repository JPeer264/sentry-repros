// index.mdx:146-151 (shouldHandleError) verbatim, applied to the Node.js app of index.mdx:124.
import * as Sentry from "@sentry/elysia";
import { Elysia } from "elysia";
import { node } from "@elysiajs/node";
import { registerRoutes } from "./routes.ts";

Sentry.init({
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: process.env.SENTRY_TUNNEL,
  debug: true,
  tracesSampleRate: 1.0,
});

const app = registerRoutes(Sentry.withElysia(new Elysia({ adapter: node() }), {
  shouldHandleError: (context) => {
    const status = context.set.status;
    return status === 500 || status === 503;
  },
}))
  .listen({ port: Number(process.env.APP_PORT), hostname: "127.0.0.1" }, () => console.log(`app listening ${process.env.APP_PORT}`));
