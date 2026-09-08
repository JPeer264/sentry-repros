import "./instrument-d.ts";
import * as Sentry from "@sentry/deno";
import { withElysia } from "@sentry/elysia";
import { Elysia } from "elysia";

const app = withElysia(new Elysia())
  .get("/fetchout", async () => {
    const res = await fetch("http://127.0.0.1:47103/rec-d");
    return { rec: await res.text() };
  })
  .get("/sentinel", () => {
    Sentry.captureMessage("sentinel");
    return "ok";
  });

Deno.serve({ port: Number(Deno.env.get("APP_PORT") || 47107), hostname: "127.0.0.1" }, app.fetch);
