import mysql from "mysql";
import { define } from "../../utils.ts";

const connection = mysql.createConnection({
  host: "127.0.0.1",
  port: 3307,
  user: "root",
  database: "app",
});

export const handler = define.handlers({
  GET() {
    return new Promise<Response>((resolve) => {
      connection.query("SELECT * FROM users", (err, rows) => {
        resolve(Response.json({ err: err ? String(err) : null, rows: rows ?? null }));
      });
    });
  },
});
