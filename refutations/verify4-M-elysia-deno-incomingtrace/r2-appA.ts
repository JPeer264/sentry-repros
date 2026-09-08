import "./r2-instrumentA.ts";
import * as Sentry from "@sentry/elysia";
import { Elysia } from "elysia";

const app = Sentry.withElysia(new Elysia())
  .get("/users/:id", ({ params }) => ({ id: params.id }))
  .get("/boom", () => {
    throw new Error("A-boom");
  })
  .get("/sentinel", () => {
    Sentry.captureMessage("sentinel");
    return "ok";
  });

Deno.serve({ port: Number(Deno.env.get("PORT")), hostname: "127.0.0.1" }, app.fetch);
