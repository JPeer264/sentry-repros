import * as Sentry from "@sentry/cloudflare";
import { define } from "../utils.ts";

export const handler = define.handlers({
  GET(ctx) {
    Sentry.captureException(ctx.error);
    const e = ctx.error as Error;
    return new Response(`${e?.name}: ${e?.message}\n${e?.stack}`, {
      status: 500,
      headers: { "content-type": "text/plain" },
    });
  },
});
