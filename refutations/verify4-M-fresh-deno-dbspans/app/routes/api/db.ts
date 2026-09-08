import { queryUsers } from "../../db.ts";

export const handler = {
  async GET() {
    const rows = await queryUsers();
    return new Response(JSON.stringify({ rows }), {
      headers: { "content-type": "application/json" },
    });
  },
};
