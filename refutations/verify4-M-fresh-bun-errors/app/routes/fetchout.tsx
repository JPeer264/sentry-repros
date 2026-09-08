import { define } from "../utils.ts";

export const handler = define.handlers({
  async GET() {
    const port = Number(Bun.env.RECORDER_PORT);
    const res = await fetch(`http://127.0.0.1:${port}/rec`);
    return new Response(await res.text(), {
      headers: { "content-type": "application/json" },
    });
  },
});
