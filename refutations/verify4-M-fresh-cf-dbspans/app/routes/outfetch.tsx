import { define } from "../utils.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const rec = new URL(ctx.req.url).searchParams.get("rec")!;
    const res = await fetch(rec);
    return new Response(await res.text(), {
      headers: { "content-type": "application/json" },
    });
  },
});
