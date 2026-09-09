// index.mdx:105-127 verbatim (DSN, tunnel, debug, port aside), then the verify snippet index.mdx:182-184
// pasted after the chain exactly where "Add the following route to your app" puts it, plus a sentinel route.
import * as Sentry from "@sentry/elysia";
import { Elysia } from "elysia";
import { node } from "@elysiajs/node";

Sentry.init({
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: process.env.SENTRY_TUNNEL,
  debug: true,
  tracesSampleRate: 1.0,
});

// withElysia returns the app instance, so you can chain routes directly
const app = Sentry.withElysia(new Elysia({ adapter: node() }))
  .get("/", () => "Hello World")
  .listen({ port: Number(process.env.APP_PORT), hostname: "127.0.0.1" }, () => console.log(`app listening ${process.env.APP_PORT}`));

app.get("/debug-sentry", () => {
  throw new Error("My first Sentry error!");
});

app.get("/sentinel", () => {
  Sentry.captureMessage("sentinel");
  return "sentinel\n";
});
