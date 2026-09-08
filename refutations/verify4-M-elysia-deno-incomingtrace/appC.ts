import "@sentry/deno/import";
import * as Sentry from "@sentry/elysia";
import { denoServeIntegration } from "@sentry/deno";

Sentry.init({
  dsn: "https://public@example.invalid/1",
  tunnel: "http://127.0.0.1:52107/",
  tracesSampleRate: 1.0,
  traceLifecycle: "static",
  release: "v4-c@1",
  integrations: [denoServeIntegration()],
});

import { Elysia } from "elysia";

const app = Sentry.withElysia(new Elysia())
  .get("/users/:id", ({ params }) => ({ id: params.id }))
  .get("/sentinel", () => {
    Sentry.captureMessage("sentinel");
    return "ok";
  });

Deno.serve({ port: Number(Deno.env.get("PORT")), hostname: "127.0.0.1" }, app.fetch);
