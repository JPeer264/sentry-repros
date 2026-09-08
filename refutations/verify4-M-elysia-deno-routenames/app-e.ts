import "@sentry/deno/import";
import * as Sentry from "@sentry/elysia";
Sentry.init({
  dsn: "https://public@example.invalid/1",
  tunnel: "http://127.0.0.1:47101/",
  tracesSampleRate: 1.0,
  traceLifecycle: "static",
  release: "v4-e@1",
});

import { Elysia } from "elysia";
import { node } from "@elysiajs/node";

const app = Sentry.withElysia(new Elysia({ adapter: node() }))
  .get("/users/:id", ({ params }) => ({ id: params.id }))
  .get("/boom", () => { throw new Error("v4-boom-e"); })
  .get("/sentinel", () => { Sentry.captureMessage("sentinel"); return "ok"; })
  .listen(Number(Deno.env.get("PORT")));
