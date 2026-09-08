import * as Sentry from "@sentry/cloudflare";
import { define } from "../../utils.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const tag = ctx.params.tag;
    Sentry.setTag("probe_tag", tag);
    await new Promise((r) => setTimeout(r, 60));
    Sentry.captureException(new Error(`iso-${tag}`));
    return new Response(JSON.stringify({ tag }), {
      headers: { "content-type": "application/json" },
    });
  },
});
