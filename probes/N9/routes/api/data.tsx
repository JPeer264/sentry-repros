import { define } from "../../utils.ts";

const ECHO = Deno.env.get("ECHO_PORT") ?? "47312";

export const handler = define.handlers({
  async GET(_ctx) {
    const res = await fetch(`http://127.0.0.1:${ECHO}/echo`);
    return new Response(await res.text(), {
      headers: { "content-type": "application/json" },
    });
  },
});
