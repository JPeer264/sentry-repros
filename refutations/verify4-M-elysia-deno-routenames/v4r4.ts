import "@sentry/deno/import";
import * as Sentry from "@sentry/elysia";
Sentry.init({
  dsn: "https://public@example.invalid/1",
  tunnel: "http://127.0.0.1:52117/",
  tracesSampleRate: 1.0,
  traceLifecycle: "static",
  release: "v4r4@1",
});
import { Elysia } from "elysia";
import { node } from "@elysiajs/node";
import { addRoutes } from "./v4routes.ts";
const app = addRoutes(Sentry.withElysia(new Elysia({ adapter: node() })), Sentry);
app.listen(Number(Deno.env.get("PORT")));
