import "./instrument.mjs";
import * as Sentry from "@sentry/bun";
import Fastify from "fastify";
import mysql2 from "mysql2";

const conn = mysql2.createConnection({ host: "127.0.0.1", port: 3307, user: "root", database: "app" });

const app = Fastify();

app.get("/db", async () => {
  const [rows] = await conn.promise().query("SELECT id, name FROM users");
  return { rows };
});

app.get("/db-execute", async () => {
  const [rows] = await conn.promise().execute("SELECT id, name FROM users WHERE id = ?", [1]);
  return { rows };
});

// K11 counter-check: driver module first loaded + connection created inside the request
app.get("/db-lazy", async () => {
  const lazy = (await import("mysql2/promise")).default;
  const c = await lazy.createConnection({ host: "127.0.0.1", port: 3307, user: "root", database: "app" });
  const [rows] = await c.query("SELECT id, name FROM users WHERE id = 2");
  await c.end();
  return { rows };
});

app.get("/sentinel", async () => { Sentry.captureMessage("sentinel"); return { ok: true }; });

await app.listen({ port: Number(process.env.APP_PORT), host: "127.0.0.1" });
console.log("LISTENING", process.env.APP_PORT);
