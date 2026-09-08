import "@sentry/deno/import";
import * as Sentry from "@sentry/deno";

Sentry.init({
  dsn: "https://public@example.invalid/1",
  tunnel: "http://127.0.0.1:52107/",
  tracesSampleRate: 1.0,
  traceLifecycle: (Deno.env.get("LIFECYCLE") as "static" | "stream") || "static",
  release: "v4-b@1",
});

import { withElysia } from "@sentry/elysia";
import { Elysia } from "elysia";

const app = withElysia(new Elysia())
  .get("/users/:id", ({ params }) => ({ id: params.id }))
  .get("/boom", () => {
    throw new Error("B-boom");
  })
  .get("/tag/:t", ({ params }) => {
    Sentry.setTag("reqtag", params.t);
    Sentry.captureException(new Error(`tagged-${params.t}`));
    return { ok: params.t };
  })
  .get("/sentinel", () => {
    Sentry.captureMessage("sentinel");
    return "ok";
  });

Deno.serve({ port: Number(Deno.env.get("PORT")), hostname: "127.0.0.1" }, app.fetch);
