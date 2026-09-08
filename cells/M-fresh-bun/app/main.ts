import * as Sentry from "@sentry/bun";
import { App, staticFiles } from "fresh";
import { define, type State } from "./utils.ts";
import "./dbpool.ts";

export const app = new App<State>();

app.use(staticFiles());

const sentryMiddleware = define.middleware(async (ctx) => {
  const route = (ctx as unknown as { route?: string | null }).route;
  console.log("ctx keys:", Object.keys(ctx).join(","), "route:", route);
  const span = Sentry.getActiveSpan();
  if (span && route) {
    Sentry.updateSpanName(Sentry.getRootSpan(span), `${ctx.req.method} ${route}`);
    Sentry.getRootSpan(span).setAttribute("sentry.source", "route");
  }
  try {
    return await ctx.next();
  } catch (err) {
    Sentry.captureException(err, { mechanism: { type: "fresh.middleware", handled: false } });
    throw err;
  }
});
app.use(sentryMiddleware);

app.use(async (ctx) => {
  ctx.state.shared = "hello";
  return await ctx.next();
});

app.fsRoutes();
