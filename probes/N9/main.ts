import "@sentry/deno/import";
import * as Sentry from "@sentry/deno";

const SINK = Deno.env.get("SINK_PORT") ?? "41339";

Sentry.init({
  dsn: `http://publickey@127.0.0.1:${SINK}/1`,
  tunnel: `http://127.0.0.1:${SINK}/`,
  tracesSampleRate: 1.0,
});

import { App, staticFiles } from "fresh";
import { define, type State } from "./utils.ts";

export const app = new App<State>();

app.use(staticFiles());

// N9_WORKAROUND=1 enables the 4-line try/catch middleware the guide would have to document.
if (Deno.env.get("N9_WORKAROUND") === "1") {
  app.use(async (ctx) => {
    try {
      return await ctx.next();
    } catch (e) {
      Sentry.captureException(e);
      throw e;
    }
  });
}

// Pass a shared value from a middleware
app.use(async (ctx) => {
  ctx.state.shared = "hello";
  return await ctx.next();
});

// this is the same as the /api/:name route defined via a file. feel free to delete this!
app.get("/api2/:name", (ctx) => {
  const name = ctx.params.name;
  return new Response(
    `Hello, ${name.charAt(0).toUpperCase() + name.slice(1)}!`,
  );
});

// this can also be defined via a file. feel free to delete this!
const exampleLoggerMiddleware = define.middleware((ctx) => {
  console.log(`${ctx.req.method} ${ctx.req.url}`);
  return ctx.next();
});
app.use(exampleLoggerMiddleware);

// Include file-system based routes here
app.fsRoutes();
