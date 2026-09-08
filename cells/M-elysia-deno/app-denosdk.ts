import "@sentry/deno/import";
import * as Sentry from "@sentry/deno";
Sentry.init({
  dsn: "https://public@example.invalid/1",
  tunnel: "http://127.0.0.1:43711/",
  tracesSampleRate: 1.0,
  traceLifecycle: "static",
  release: "m-elysia-deno-b@1",
});

// @sentry/elysia's public entry pulls in @sentry/bun; import the helper module directly.
import { withElysia } from "./node_modules/@sentry/elysia/build/esm/withElysia.js";
import { Elysia } from "elysia";
import mysql from "mysql";
const conn = mysql.createConnection({ host: "127.0.0.1", port: 3307, user: "root", database: "app" });

const app = withElysia(new Elysia())
  .get("/users/:id", ({ params }) => ({ id: params.id }))
  .get("/tag/:t", ({ params }) => {
    Sentry.setTag("reqtag", params.t);
    Sentry.captureException(new Error(`tagged-${params.t}`));
    return { ok: params.t };
  })
  .get("/fetchout", async () => { const r = await fetch("http://127.0.0.1:43713/rec2"); return await r.text(); })
  .get("/db", async () => { const rows = await new Promise((res, rej) => conn.query("SELECT id, name FROM users", (e,r)=> e?rej(e):res(r))); return { rows }; })
  .get("/log", () => { Sentry.logger.info("denosdk-log-line"); return "logged"; })
  .get("/boom", () => { throw new Error("denosdk-boom"); });

Deno.serve({ port: 43714, hostname: "127.0.0.1" }, app.fetch);
