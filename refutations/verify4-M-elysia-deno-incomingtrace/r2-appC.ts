import "@sentry/deno/import";
import * as Sentry from "@sentry/elysia";
import { denoServeIntegration } from "@sentry/deno";

Sentry.init({
  dsn: "https://public@example.invalid/1",
  tunnel: `http://127.0.0.1:${Deno.env.get("SINK")}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: (Deno.env.get("LIFECYCLE") as "static" | "stream") || "static",
  release: "r2c@1",
  integrations: [denoServeIntegration()],
});

import { Elysia } from "elysia";

const app = Sentry.withElysia(new Elysia())
  .get("/users/:id", ({ params }) => ({ id: params.id }))
  .get("/boom", () => {
    throw new Error("C-boom");
  })
  .get("/sentinel", () => {
    Sentry.captureMessage("sentinel");
    return "ok";
  });

Deno.serve({ port: Number(Deno.env.get("PORT")), hostname: "127.0.0.1" }, app.fetch);
