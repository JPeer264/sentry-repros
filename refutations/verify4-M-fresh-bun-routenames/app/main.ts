import * as Sentry from "@sentry/bun";
import { App, staticFiles } from "fresh";
import { define, type State } from "./utils.ts";
import "./dbpool.ts";

export const app = new App<State>();

app.use(staticFiles());

const VARIANT = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env
  ?.VARIANT ?? "B";

const sentryMiddleware = define.middleware(async (ctx) => {
  const route = (ctx as unknown as { route?: string | null }).route;
  const span = Sentry.getActiveSpan();
  const rootSpan = span ? Sentry.getRootSpan(span) : undefined;
  console.log("[mw] variant:", VARIANT, "route:", route, "hasSpan:", !!rootSpan);
  if (rootSpan && route) {
    const name = `${ctx.req.method} ${route}`;
    if (VARIANT === "A") {
      Sentry.updateSpanName(rootSpan, name);
      rootSpan.setAttribute("sentry.source", "route");
    } else if (VARIANT === "B") {
      rootSpan.updateName(name);
      rootSpan.setAttribute("http.route", route);
      rootSpan.setAttribute(Sentry.SENTRY_SEGMENT_NAME_SOURCE, "route");
    } else if (VARIANT === "C") {
      rootSpan.updateName(name);
      rootSpan.setAttributes({
        "http.route": route,
        "url.template": route,
        [Sentry.SENTRY_SEGMENT_NAME_SOURCE]: "route",
      });
    } else if (VARIANT === "D") {
      Sentry.updateSpanName(rootSpan, name);
      rootSpan.setAttribute(Sentry.SENTRY_SEGMENT_NAME_SOURCE, "route");
    }
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
