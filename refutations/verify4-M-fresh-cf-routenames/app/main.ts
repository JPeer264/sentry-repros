import * as Sentry from "@sentry/cloudflare";
import { App } from "fresh";
import type { State } from "./utils.ts";

export const app = new App<State>();

// ROUTEMODE: "off" (out of the box), "custom" (Sentry.updateSpanName),
// "route" (updateName + http.route + sentry.segment.name.source = "route").
app.use(async (ctx) => {
  ctx.state.shared = "hello";
  try {
    return await ctx.next();
  } finally {
    // deno-lint-ignore no-explicit-any
    const mode = ((globalThis as any).__ROUTEMODE as string) ?? "route";
    // deno-lint-ignore no-explicit-any
    const pattern = (ctx as any).route as string | undefined;
    const span = Sentry.getActiveSpan();
    const rootSpan = span && Sentry.getRootSpan(span);
    if (mode !== "off" && rootSpan && typeof pattern === "string") {
      const name = `${ctx.req.method} ${pattern}`;
      if (mode === "custom") {
        Sentry.updateSpanName(rootSpan, name);
      } else {
        // `updateName` sets the source to "custom", so set the source afterwards.
        rootSpan.updateName(name);
        rootSpan.setAttribute("http.route", pattern);
        rootSpan.setAttribute(Sentry.SENTRY_SEGMENT_NAME_SOURCE, "route");
      }
    }
  }
});

app.fsRoutes();
