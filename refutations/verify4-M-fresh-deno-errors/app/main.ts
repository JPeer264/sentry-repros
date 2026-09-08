import { earlyTracer } from "./early.ts";
import "./instrument.ts";
import * as Sentry from "@sentry/deno";
import { App, staticFiles } from "fresh";
import { setErrorInterceptor } from "fresh/internal";
import { type State } from "./utils.ts";
import { trace as jsrTrace } from "npm:@opentelemetry/api@^1.9.0";

const mode = Deno.env.get("SENTRY_MODE") ?? "baseline";

export const app = new App<State>();

app.use(staticFiles());

if (mode === "middleware") {
  app.use(async (ctx) => {
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

if (mode === "interceptor") {
  setErrorInterceptor(app, (err) => {
    Sentry.captureException(err, {
      mechanism: { type: "fresh.errorInterceptor", handled: false },
    });
  });
}


if (mode.endsWith("errorpage")) {
  app.onError("*", () => new Response("custom error page", { status: 500 }));
}


if (mode === "onerrorcapture") {
  app.onError("*", (ctx) => {
    Sentry.captureException(ctx.error, {
      mechanism: { type: "fresh.onError", handled: false },
    });
    return new Response("custom error page", { status: 500 });
  });
}

app.get("/api/boom", () => {
  throw new Error("fresh-deno-boom");
});

app.get("/api/users/:id", (ctx) => new Response(`user ${ctx.params.id}`));

app.get("/api/sentinel", () => {
  Sentry.captureMessage("sentinel");
  return new Response("ok");
});

app.get("/api/otel", () => {
  const t = jsrTrace.getTracer("probe");
  let early = "none";
  earlyTracer.startActiveSpan("early-span", (span: any) => {
    early = span?.constructor?.name ?? String(span);
    span.end();
  });
  let inner = "none";
  t.startActiveSpan("probe-span", (span: any) => {
    inner = span?.constructor?.name ?? String(span);
    span.end();
  });
  const g = (globalThis as any)[Symbol.for("opentelemetry.js.api.1")];
  return new Response(JSON.stringify({
    tracer: t.constructor.name,
    earlyTracer: earlyTracer.constructor.name,
    earlySpan: early,
    span: inner,
    globalKeys: g ? Object.keys(g) : null,
    globalVersion: g?.version,
  }));
});

app.get("/api/mode", () => new Response(mode));

app.fsRoutes();
