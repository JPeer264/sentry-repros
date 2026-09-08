import * as Sentry from "@sentry/bun";
import { App, staticFiles } from "fresh";
import { define, type State } from "./utils.ts";

const wiring = (globalThis as unknown as { __WIRING?: string }).__WIRING ?? "baseline";
console.log("[main.ts] wiring =", wiring);

export const app = new App<State>();

app.use(staticFiles());

if (wiring === "middleware") {
  app.use(define.middleware(async (ctx) => {
    try {
      return await ctx.next();
    } catch (err) {
      Sentry.captureException(err, { mechanism: { type: "fresh.middleware", handled: false } });
      throw err;
    }
  }));
}

if (wiring === "onerror") {
  app.onError("*", (ctx) => {
    Sentry.captureException(ctx.error, { mechanism: { type: "fresh.onError", handled: false } });
    return new Response("captured via app.onError", { status: 500 });
  });
}

app.use(async (ctx) => {
  ctx.state.shared = "hello";
  return await ctx.next();
});

app.fsRoutes();
