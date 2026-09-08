import * as Sentry from "@sentry/cloudflare";
import { define } from "../utils.ts";

export const handler = define.handlers({
  GET(ctx) {
    Sentry.captureMessage(
      "sentinel-" + new URL(ctx.req.url).searchParams.get("n"),
    );
    return new Response("ok");
  },
});
