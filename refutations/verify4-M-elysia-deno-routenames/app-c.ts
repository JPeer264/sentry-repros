import "@sentry/deno/import";
import * as Sentry from "@sentry/deno";
Sentry.init({
  dsn: "https://public@example.invalid/1",
  tunnel: "http://127.0.0.1:47101/",
  tracesSampleRate: 1.0,
  traceLifecycle: (Deno.env.get("LIFECYCLE") as "static" | "stream") || "static",
  release: "v4-c@1",
});

import { withElysia } from "@sentry/elysia";
import { addRoutes, Elysia } from "./routes.ts";

const app = addRoutes(withElysia(new Elysia()), Sentry);
Deno.serve({ port: Number(Deno.env.get("PORT")), hostname: "127.0.0.1" }, app.fetch);
