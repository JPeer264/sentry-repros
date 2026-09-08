import * as Sentry from "@sentry/deno";
import { define } from "../../utils.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const t = new URL(ctx.req.url).searchParams.get("t") ?? "x";
    Sentry.setTag("probe", t);
    await new Promise((r) => setTimeout(r, 120));
    Sentry.captureMessage(`iso-${t}`);
    return Response.json({ t });
  },
});
