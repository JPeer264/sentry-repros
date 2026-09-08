import "@sentry/deno/import";
import * as Sentry from "@sentry/deno";
Sentry.init({
  dsn: "https://public@example.invalid/1",
  tunnel: "http://127.0.0.1:52117/",
  tracesSampleRate: 1.0,
  traceLifecycle: (Deno.env.get("LIFECYCLE") as any) || "static",
  release: "v4r2@1",
});
import { withElysia } from "@sentry/elysia";
import { Elysia } from "elysia";
import { node } from "@elysiajs/node";
import { addRoutes } from "./v4routes.ts";
const app = addRoutes(withElysia(new Elysia({ adapter: node() })), Sentry);
app.listen(Number(Deno.env.get("PORT")));
