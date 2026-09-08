import "./instrument.ts";
import { App, staticFiles } from "fresh";
import * as Sentry from "@sentry/deno";
import { type State } from "./utils.ts";

export const app = new App<State>();

app.use(staticFiles());

if (!Deno.env.get("NO_SENTRY_MW")) {
  app.use(async (ctx) => {
    const span = Sentry.getActiveSpan();
    if (span && ctx.route) {
      const root = Sentry.getRootSpan(span);
      Sentry.updateSpanName(root, `${ctx.req.method} ${ctx.route}`);
      root.setAttribute("http.route", ctx.route);
      root.setAttribute("sentry.segment.name.source", "route");
    }
    try {
      return await ctx.next();
    } catch (e) {
      Sentry.captureException(e, {
        mechanism: { type: "fresh.middleware", handled: false },
      });
      throw e;
    }
  });
}

app.use(async (ctx) => {
  ctx.state.shared = "hello";
  return await ctx.next();
});

app.fsRoutes();
