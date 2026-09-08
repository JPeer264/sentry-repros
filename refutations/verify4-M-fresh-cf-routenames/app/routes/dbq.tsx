import { pool } from "../db.ts";
import { define } from "../utils.ts";

export const handler = define.handlers({
  async GET() {
    const [rows] = await pool.query("SELECT id, name FROM users");
    return new Response(JSON.stringify(rows), {
      headers: { "content-type": "application/json" },
    });
  },
});
