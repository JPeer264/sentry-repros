import { queryUsers2 } from "../../db2.ts";

export const handler = {
  async GET() {
    const rows = await queryUsers2();
    return new Response(JSON.stringify({ rows }), {
      headers: { "content-type": "application/json" },
    });
  },
};
