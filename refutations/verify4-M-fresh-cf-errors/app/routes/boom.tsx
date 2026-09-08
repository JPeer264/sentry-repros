import { define } from "../utils.ts";

export const handler = define.handlers({
  GET(ctx) {
    const n = new URL(ctx.req.url).searchParams.get("n") ?? "0";
    throw new Error(`fresh-cf-route-error-${n}`);
  },
});
