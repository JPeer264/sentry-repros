import * as Sentry from "@sentry/cloudflare";
import { App } from "fresh";
import type { State } from "./utils.ts";

export const app = new App<State>();

app.use(async (ctx) => {
  ctx.state.shared = "hello";
  const mode = ctx.req.headers.get("x-mode") ?? "baseline";
  if (mode !== "middleware") {
    return await ctx.next();
  }
  try {
    return await ctx.next();
  } catch (error) {
    Sentry.captureException(error, {
      mechanism: { type: "fresh.middleware", handled: false },
    });
    throw error;
  }
});

app.onError("/boom2", (ctx) => {
  Sentry.captureException(ctx.error, {
    mechanism: { type: "fresh.app_on_error", handled: false },
  });
  return new Response("captured by app.onError", { status: 500 });
});

app.fsRoutes();
