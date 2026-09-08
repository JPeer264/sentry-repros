import * as Sentry from "@sentry/bun";
import Fastify from "fastify";
import mysql from "mysql";

const connection = mysql.createConnection({ host: "127.0.0.1", port: 3307, user: "root", database: "app" });
connection.on("error", e => console.error("mysql err", e.message));
connection.connect(e => e && console.error("mysql connect err", e.message));

const app = Fastify();
app.get("/db", async () => new Promise((res, rej) =>
  connection.query("SELECT id, name FROM users", (err, r) => (err ? rej(err) : res({ rows: r })))));
app.get("/sentinel", async () => { Sentry.captureMessage("sentinel"); return { ok: true }; });
await app.listen({ port: Number(process.env.APP_PORT), host: "127.0.0.1" });
console.log("LISTENING", process.env.APP_PORT);
