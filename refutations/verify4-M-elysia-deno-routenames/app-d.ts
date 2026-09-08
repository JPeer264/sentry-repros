import "@sentry/deno/import";
import * as Sentry from "@sentry/deno";
Sentry.init({
  dsn: "https://public@example.invalid/1",
  tunnel: "http://127.0.0.1:47101/",
  tracesSampleRate: 1.0,
  traceLifecycle: "static",
  release: "v4-d@1",
});

import * as SentryElysia from "@sentry/elysia";
import { Elysia } from "elysia";

const app = SentryElysia.withElysia(new Elysia())
  .get("/users/:id", ({ params }) => ({ id: params.id }))
  .get("/tag/:t", async ({ params }) => {
    SentryElysia.setTag("reqtag", params.t);
    await new Promise(r => setTimeout(r, 120));
    SentryElysia.captureException(new Error(`tagged-${params.t}`));
    return { ok: params.t };
  })
  .get("/sentinel", () => { SentryElysia.captureMessage("sentinel"); return "ok"; });

Deno.serve({ port: Number(Deno.env.get("PORT")), hostname: "127.0.0.1" }, app.fetch);
