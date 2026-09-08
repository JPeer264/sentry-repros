import "./instrument-deno.ts";
import * as Sentry from "@sentry/deno";
import { withElysia } from "@sentry/elysia";
import { Elysia } from "elysia";

const app = withElysia(new Elysia())
  .get("/users/:id", ({ params }) => ({ id: params.id }))
  .get("/boom", () => {
    throw new Error("elysia-deno-boom");
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

Deno.serve({ port: 47312, hostname: "127.0.0.1" }, app.fetch);
