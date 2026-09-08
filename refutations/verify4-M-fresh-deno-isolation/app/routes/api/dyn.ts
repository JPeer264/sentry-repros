import * as Sentry from "@sentry/deno";
import { define } from "../../utils.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const t = new URL(ctx.req.url).searchParams.get("t") ?? "none";
    Sentry.setTag("probe", t);
    await import(`data:text/javascript,export const x=${Math.random()};`);
    return new Response(`dyn:${t}`);
  },
});
