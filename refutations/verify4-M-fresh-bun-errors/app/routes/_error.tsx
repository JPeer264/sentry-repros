import * as Sentry from "@sentry/bun";
import { define } from "../utils.ts";

export const handler = define.handlers({
  GET(ctx) {
    if ((globalThis as unknown as { __WIRING?: string }).__WIRING === "errorroute") {
      Sentry.captureException(ctx.error, {
        mechanism: { type: "fresh._error", handled: false },
      });
    }
    return new Response("custom error page", { status: 500 });
  },
});
