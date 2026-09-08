import * as Sentry from "@sentry/deno";
import { define } from "../../utils.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const t = new URL(ctx.req.url).searchParams.get("t") ?? "none";
    Sentry.setTag("probe", t);
    await new Promise((r) => setTimeout(r, 300));
    return new Response(`iso:${t}`);
  },
});
