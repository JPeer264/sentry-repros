import "./instrument.ts";
import * as Sentry from "@sentry/deno";
import { App, staticFiles } from "fresh";
import { define, type State } from "./utils.ts";

export const app = new App<State>();

app.use(staticFiles());

const FRESH_ISO = Deno.env.get("FRESH_ISO") === "1";
const FRESH_RESET = Deno.env.get("FRESH_ISO") === "2";

// Workaround for the Deno AsyncLocalStorage leak: strip whatever a previous
// request left on the isolation scope this request inherited.
function resetIsolationScope() {
  const iso = Sentry.getIsolationScope();
  // deno-lint-ignore no-explicit-any
  const d = iso.getScopeData() as any;
  for (const k of Object.keys(d.tags ?? {})) iso.setTag(k, undefined);
  for (const k of Object.keys(d.contexts ?? {})) iso.setContext(k, null);
  for (const k of Object.keys(d.extra ?? {})) iso.setExtra(k, undefined);
  iso.setUser(null);
  iso.clearBreadcrumbs();
  iso.clearAttachments();
}

app.use(async (ctx) => {
  const run = async () => {
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
  };

  if (FRESH_RESET) {
    resetIsolationScope();
    return await run();
  }

  if (!FRESH_ISO) return await run();

  const stale = Sentry.getIsolationScope();
  const clean = new Sentry.Scope();
  clean.setClient(Sentry.getClient());
  clean.setPropagationContext(stale.getPropagationContext());
  clean.setSDKProcessingMetadata(stale.getScopeData().sdkProcessingMetadata);
  return await Sentry.withIsolationScope(clean, run);
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
