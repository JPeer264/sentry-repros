import { define } from "../../utils.ts";

export const handler = define.handlers({
  GET(ctx) {
    return new Response(JSON.stringify({ id: ctx.params.id }), {
      headers: { "content-type": "application/json" },
    });
  },
});
