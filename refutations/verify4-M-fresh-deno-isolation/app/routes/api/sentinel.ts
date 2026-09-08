import * as Sentry from "@sentry/deno";
import { define } from "../../utils.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const n = new URL(ctx.req.url).searchParams.get("n") ?? "0";
    Sentry.captureMessage(`sentinel-${n}`);
    await Sentry.flush(2000);
    return new Response("sentinel");
  },
});
