import "./instrument.ts";
import * as Sentry from "@sentry/deno";
import { App, staticFiles } from "fresh";
import { define, type State } from "./utils.ts";

export const app = new App<State>();

app.use(staticFiles());

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

app.use(async (ctx) => {
  ctx.state.shared = "hello";
  return await ctx.next();
});

const exampleLoggerMiddleware = define.middleware((ctx) => {
  console.log(`${ctx.req.method} ${ctx.req.url}`);
  return ctx.next();
});
app.use(exampleLoggerMiddleware);

app.fsRoutes();
