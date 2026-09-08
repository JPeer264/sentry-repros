import "./instrument.ts";
import * as Sentry from "@sentry/deno";
import Fastify from "fastify";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "127.0.0.1",
  port: 3307,
  user: "root",
  database: "app",
  connectionLimit: 4,
});

const RECORDER_PORT = Deno.env.get("RECORDER_PORT") || "41339";

const app = Fastify();

app.get("/users/:id", (req) => ({ id: (req.params as { id: string }).id }));

app.get("/error", () => {
  throw new Error("fastify route boom");
});

app.get("/db", async () => {
  const [rows] = await pool.query("SELECT id, name FROM users");
  return { rows };
});

app.get("/downstream", async () => {
  const res = await fetch(`http://127.0.0.1:${RECORDER_PORT}/from-fetch`);
  return { downstream: await res.text() };
});

app.get("/iso/:tag", async (req) => {
  const tag = (req.params as { tag: string }).tag;
  Sentry.setTag("probe_tag", tag);
  await new Promise((r) => setTimeout(r, 40 + Math.floor(Math.random() * 60)));
  Sentry.captureException(new Error(`iso error ${tag}`));
  return { tag };
});

app.get("/log", () => {
  Sentry.logger.info("hello from fastify on deno", { route: "/log" });
  return { logged: true };
});

app.get("/sentinel", () => {
  Sentry.captureMessage("sentinel");
  return { ok: true };
});

const port = Number(Deno.env.get("APP_PORT") || 47022);
await app.listen({ port, host: "127.0.0.1" });
console.log(`READY http://127.0.0.1:${port}`);
