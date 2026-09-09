// index.mdx:82-103 (the Bun tab, the default expanded tab) run under Node: no @elysiajs/node adapter.
import * as Sentry from "@sentry/elysia";
import { Elysia } from "elysia";
import { registerRoutes } from "./routes.ts";

Sentry.init({
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: process.env.SENTRY_TUNNEL,
  debug: true,
  tracesSampleRate: 1.0,
});

// withElysia returns the app instance, so you can chain routes directly
const app = registerRoutes(Sentry.withElysia(new Elysia())
  .get("/", () => "Hello World"))
  .listen({ port: Number(process.env.APP_PORT), hostname: "127.0.0.1" }, () => console.log(`app listening ${process.env.APP_PORT}`));
