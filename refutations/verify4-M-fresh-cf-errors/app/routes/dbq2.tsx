import { conn } from "../db2.ts";
import { define } from "../utils.ts";

export const handler = define.handlers({
  async GET() {
    const rows = await new Promise((resolve, reject) => {
      conn.query("SELECT id, name FROM users", (err: unknown, r: unknown) =>
        err ? reject(err) : resolve(r));
    });
    return new Response(JSON.stringify(rows), {
      headers: { "content-type": "application/json" },
    });
  },
});
