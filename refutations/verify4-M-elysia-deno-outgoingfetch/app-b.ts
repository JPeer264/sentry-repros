import "@sentry/deno/import";
import * as Sentry from "@sentry/deno";

Sentry.init({
  dsn: "https://public@example.invalid/1",
  tunnel: "http://127.0.0.1:51817/",
  tracesSampleRate: 1.0,
  traceLifecycle: (Deno.env.get("LIFECYCLE") as "static" | "stream") || "stream",
  release: "v4-b@1",
});

import { withElysia } from "./node_modules/@sentry/elysia/build/esm/withElysia.js";
import { Elysia } from "elysia";

const app = withElysia(new Elysia())
  .get("/fetchout", async () => {
    const res = await fetch("http://127.0.0.1:47103/rec-b");
    return { rec: await res.text() };
  })
  .get("/fetchout-span", async () =>
    Sentry.startSpan({ name: "manual-wrap" }, async () => {
      const res = await fetch("http://127.0.0.1:47103/rec-b-wrapped");
      return { rec: await res.text() };
    }),
  )
  .get("/sentinel", () => {
    Sentry.captureMessage("sentinel");
    return "ok";
  });

Deno.serve({ port: Number(Deno.env.get("APP_PORT") || 47104), hostname: "127.0.0.1" }, app.fetch);
