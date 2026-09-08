import "./instrument";
import * as Sentry from "@sentry/bun";
import Hapi from "@hapi/hapi";
import mysql from "mysql";

const PORT = Number(process.env.APP_PORT);
const SINK_PORT = Number(process.env.SINK_PORT);

// module scope connection (K11)
const db = mysql.createConnection({ host: "127.0.0.1", port: 3307, user: "root", database: "app" });
db.connect();

const server = Hapi.server({ port: PORT, host: "127.0.0.1" });

server.route({
  method: "GET",
  path: "/users/{id}",
  handler: request => ({ id: request.params.id }),
});

server.route({
  method: "GET",
  path: "/error",
  handler: () => {
    throw new Error("hapi-handler-boom");
  },
});

server.route({
  method: "GET",
  path: "/iso/{tag}",
  handler: async request => {
    const tag = String(request.params.tag);
    Sentry.setTag("who", tag);
    await new Promise(r => setTimeout(r, 60 + Math.random() * 60));
    Sentry.captureException(new Error(`iso-${tag}`));
    return tag;
  },
});

server.route({
  method: "GET",
  path: "/downstream",
  handler: async () => {
    const r = await fetch(`http://127.0.0.1:${SINK_PORT}/rec/from-hapi`);
    return r.text();
  },
});

server.route({
  method: "GET",
  path: "/db",
  handler: async () => {
    const rows: any = await new Promise((res, rej) =>
      db.query("SELECT id, name FROM users", (e: any, r: any) => (e ? rej(e) : res(r))),
    );
    return { rows: rows.length };
  },
});

server.route({
  method: "GET",
  path: "/log",
  handler: () => {
    Sentry.logger.info("hapi-log-line", { route: "/log" });
    return "logged";
  },
});

server.route({
  method: "GET",
  path: "/sentinel",
  handler: () => {
    Sentry.captureMessage("sentinel");
    return "s";
  },
});

await server.start();
console.log(`hapi ready ${PORT}`);
