import * as Sentry from "@sentry/cloudflare";
import { define } from "../utils.ts";

export const handler = define.handlers({
  GET(ctx) {
    const mode = ctx.req.headers.get("x-mode") ?? "baseline";
    if (mode !== "errorroute") {
      // Behave as if no _error route existed: let Fresh's DEFAULT_ERROR_HANDLER take over.
      throw ctx.error;
    }
    Sentry.captureException(ctx.error, {
      mechanism: { type: "fresh.error_route", handled: false },
    });
    return new Response("captured by _error.tsx", { status: 500 });
  },
});
