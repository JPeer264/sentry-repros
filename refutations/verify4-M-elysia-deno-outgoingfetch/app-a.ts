import "./instrument-a.ts";
import * as Sentry from "@sentry/elysia";
import { Elysia } from "elysia";

const app = Sentry.withElysia(new Elysia())
  .get("/fetchout", async () => {
    const res = await fetch("http://127.0.0.1:51703/rec-a");
    return { rec: await res.text() };
  })
  .get("/sentinel", () => { Sentry.captureMessage("sentinel"); return "ok"; });

Deno.serve({ port: Number(Deno.env.get("PORT")), hostname: "127.0.0.1" }, app.fetch);
