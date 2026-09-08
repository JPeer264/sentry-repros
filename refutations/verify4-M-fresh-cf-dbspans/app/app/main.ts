import * as Sentry from "@sentry/cloudflare";
import { App } from "fresh";
import type { State } from "./utils.ts";

export const app = new App<State>();

// Out-of-the-box the request span is named "GET /users/42" (source: url).
// Remove this middleware to reproduce that; keep it for parameterized names.
app.use(async (ctx) => {
  ctx.state.shared = "hello";
  const res = await ctx.next();
  const span = Sentry.getActiveSpan();
  // deno-lint-ignore no-explicit-any
  const pattern = (ctx as any).route as string | undefined;
  if (span && typeof pattern === "string") {
    Sentry.updateSpanName(
      Sentry.getRootSpan(span),
      `${ctx.req.method} ${pattern}`,
    );
  }
  return res;
});

app.fsRoutes();
