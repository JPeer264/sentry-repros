import Hapi from "@hapi/hapi";
import * as Sentry from "@sentry/deno";
import { attachHapiErrorHandler } from "@sentry/server-utils";
import mysql from "mysql";

const conn = mysql.createConnection({ host: "127.0.0.1", port: 3307, user: "root", database: "app" });

const server = Hapi.server({ port: Number(Deno.env.get("PORT") || "41777"), host: "127.0.0.1" });

server.route({
  method: "GET",
  path: "/users/{id}",
  handler: (req) => ({ id: req.params.id }),
});

server.route({
  method: "GET",
  path: "/error",
  handler: () => {
    throw new Error("hapi boom");
  },
});

server.route({
  method: "GET",
  path: "/db",
  handler: () =>
    new Promise((resolve, reject) => {
      conn.query("SELECT * FROM users", (err: unknown, rows: unknown) => (err ? reject(err) : resolve({ rows })));
    }),
});

server.route({
  method: "GET",
  path: "/sentinel",
  handler: () => {
    Sentry.captureMessage("sentinel");
    return "ok";
  },
});

if (Deno.env.get("MANUAL_ERR_HANDLER") === "1") {
  attachHapiErrorHandler(server);
}

await server.start();
console.log("PORT=" + server.info.port);
