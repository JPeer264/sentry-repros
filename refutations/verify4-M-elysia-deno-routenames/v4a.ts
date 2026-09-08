import "@sentry/deno/import";
import * as Sentry from "@sentry/elysia";
Sentry.init({
  dsn: "https://public@example.invalid/1",
  tunnel: "http://127.0.0.1:52117/",
  tracesSampleRate: 1.0,
  traceLifecycle: (Deno.env.get("LIFECYCLE") as any) || "static",
  release: "v4a@1",
});
import { Elysia } from "elysia";
import { addRoutes } from "./v4routes.ts";
const app = addRoutes(Sentry.withElysia(new Elysia()), Sentry);
Deno.serve({ port: Number(Deno.env.get("PORT")), hostname: "127.0.0.1" }, app.fetch);
