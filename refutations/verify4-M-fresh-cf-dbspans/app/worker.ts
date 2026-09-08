// @ts-nocheck
import * as Sentry from "@sentry/cloudflare";
import server from "./_fresh/server.js";
import mysql from "mysql";

export default Sentry.withSentry(
  () => ({
    dsn: "http://publickey@127.0.0.1:52117/1",
    tunnel: "http://127.0.0.1:52117/",
    tracesSampleRate: 1.0,
    traceLifecycle: "stream",
    debug: true,
    sendDefaultPii: true,
  }),
  {
    fetch(request: Request) {
      const url = new URL(request.url);
      // Query issued from the wrangler entry itself, outside the Fresh bundle.
      if (url.pathname === "/wdb") {
        const connection = mysql.createConnection({
          host: "127.0.0.1",
          port: 3307,
          user: "root",
          database: "app",
        });
        connection.on("error", () => {});
        return new Promise((resolve, reject) => {
          connection.query("SELECT id, name FROM users", (err, rows) => {
            connection.end();
            if (err) return reject(err);
            resolve(Response.json(rows));
          });
        });
      }
      return server.fetch(request, {
        remoteAddr: { transport: "tcp", hostname: "127.0.0.1", port: 0 },
      });
    },
  },
);
