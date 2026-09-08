import "./instrument.mjs";
import * as Sentry from "@sentry/bun";
import Fastify from "fastify";
import mysql from "mysql";
import mysql2 from "mysql2";

// module-scope connections for BOTH drivers, same process
const c1 = mysql.createConnection({ host: "127.0.0.1", port: 3307, user: "root", database: "app" });
c1.on("error", e => console.error("mysql err", e.message));
c1.connect(e => e && console.error("mysql connect err", e.message));

const c2 = mysql2.createConnection({ host: "127.0.0.1", port: 3307, user: "root", database: "app" });
const pool2 = mysql2.createPool({ host: "127.0.0.1", port: 3307, user: "root", database: "app", connectionLimit: 2 });

const app = Fastify();

app.get("/db-mysql1", async () => {
  const rows = await new Promise((res, rej) =>
    c1.query("SELECT id, name FROM users", (err, r) => (err ? rej(err) : res(r))));
  return { rows };
});

app.get("/db-mysql2-query", async () => {
  const [rows] = await c2.promise().query("SELECT id, name FROM users");
  return { rows };
});

app.get("/db-mysql2-execute", async () => {
  const [rows] = await c2.promise().execute("SELECT id, name FROM users WHERE id = ?", [1]);
  return { rows };
});

app.get("/db-mysql2-pool", async () => {
  const [rows] = await pool2.promise().query("SELECT name FROM users WHERE id = 2");
  return { rows };
});

app.get("/sentinel", async () => { Sentry.captureMessage("sentinel"); return { ok: true }; });

await app.listen({ port: Number(process.env.APP_PORT), host: "127.0.0.1" });
console.log("LISTENING", process.env.APP_PORT);
