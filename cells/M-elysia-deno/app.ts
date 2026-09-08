import "./instrument.ts";
import * as Sentry from "@sentry/elysia";
import { Elysia } from "elysia";
import mysql from "mysql";

const conn = mysql.createConnection({ host: "127.0.0.1", port: 3307, user: "root", database: "app" });

const app = Sentry.withElysia(new Elysia())
  .get("/users/:id", ({ params }) => ({ id: params.id }))
  .get("/boom", () => {
    throw new Error("elysia-deno-boom");
  })
  .get("/tag/:t", ({ params }) => {
    Sentry.setTag("reqtag", params.t);
    Sentry.captureException(new Error(`tagged-${params.t}`));
    return { ok: params.t };
  })
  .get("/fetchout", async () => {
    const res = await fetch("http://127.0.0.1:43713/rec");
    return { rec: await res.text() };
  })
  .get("/db", async () => {
    const rows = await new Promise((resolve, reject) =>
      conn.query("SELECT id, name FROM users", (e: unknown, r: unknown) => (e ? reject(e) : resolve(r))),
    );
    return { rows };
  })
  .get("/log", () => {
    Sentry.logger.info("elysia-deno-log-line", { where: "handler" });
    return "logged";
  })
  .get("/sentinel", () => {
    Sentry.captureMessage("sentinel");
    return "ok";
  });

Deno.serve({ port: 43712, hostname: "127.0.0.1" }, app.fetch);
