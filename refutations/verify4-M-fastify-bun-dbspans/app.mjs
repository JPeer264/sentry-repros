import "./instrument.mjs";
import * as Sentry from "@sentry/bun";
import Fastify from "fastify";
import mysql from "mysql";

const DRIVER = process.env.DRIVER || "mysql";

let connection;
if (DRIVER === "mysql") {
  connection = mysql.createConnection({ host: "127.0.0.1", port: 3307, user: "root", database: "app" });
  connection.on("error", e => console.error("mysql err", e.message));
  connection.connect(e => e && console.error("mysql connect err", e.message));
}
let m2conn;
if (DRIVER === "mysql2") {
  const mysql2 = (await import("mysql2")).default;
  m2conn = mysql2.createConnection({ host: "127.0.0.1", port: 3307, user: "root", database: "app" });
}

const app = Fastify();

app.get("/db", async () => {
  if (DRIVER === "mysql2") {
    const [rows] = await m2conn.promise().query("SELECT id, name FROM users");
    return { rows };
  }
  const rows = await new Promise((res, rej) =>
    connection.query("SELECT id, name FROM users", (err, r) => (err ? rej(err) : res(r)))
  );
  return { rows };
});

app.get("/sentinel", async () => {
  Sentry.captureMessage("sentinel");
  return { ok: true };
});

await app.listen({ port: Number(process.env.APP_PORT), host: "127.0.0.1" });
console.log("LISTENING", process.env.APP_PORT);
