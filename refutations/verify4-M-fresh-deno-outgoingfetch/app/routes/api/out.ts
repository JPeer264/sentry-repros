import { define } from "../../utils.ts";

export const handler = define.handlers({
  async GET(_ctx) {
    const rec = Deno.env.get("REC_URL")!;
    const res = await fetch(`${rec}/__rec?via=fetch`);
    return new Response(`fetch ${res.status}`);
  },
});
