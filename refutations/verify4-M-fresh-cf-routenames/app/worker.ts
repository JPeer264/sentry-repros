// @ts-nocheck
import { context, ROOT_CONTEXT, trace } from "@opentelemetry/api";
import * as Sentry from "@sentry/cloudflare";
import server from "./_fresh/server.js";

// Bridges OpenTelemetry's `trace.getActiveSpan()` to the Sentry active span, so
// framework code that instruments via `@opentelemetry/api` (Fresh renames the
// server span itself) sees the span the Cloudflare SDK started.
class SentryBridgeContextManager {
  active() {
    const span = Sentry.getActiveSpan();
    return span ? trace.setSpan(ROOT_CONTEXT, span) : ROOT_CONTEXT;
  }
  with(_ctx, fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  bind(_ctx, target) {
    return target;
  }
  enable() {
    return this;
  }
  disable() {
    return this;
  }
}

let bridgeInstalled = false;

export default Sentry.withSentry(
  (env) => {
    globalThis.__ROUTEMODE = env.ROUTEMODE || "route";
    if (env.OTELBRIDGE === "on" && !bridgeInstalled) {
      bridgeInstalled = true;
      context.setGlobalContextManager(new SentryBridgeContextManager());
    }
    return {
      dsn: `http://publickey@127.0.0.1:${env.SINKPORT}/1`,
      tunnel: `http://127.0.0.1:${env.SINKPORT}/`,
      tracesSampleRate: 1.0,
      traceLifecycle: env.LIFECYCLE || "stream",
      enableOpenTelemetrySetup: env.OTELSETUP === "on",
      debug: true,
      sendDefaultPii: true,
    };
  },
  {
    fetch: (request, env) => {
      globalThis.__ROUTEMODE = env.ROUTEMODE || "route";
      if (env.OTELBRIDGE === "on" && !bridgeInstalled) {
        bridgeInstalled = true;
        context.setGlobalContextManager(new SentryBridgeContextManager());
      }
      return server.fetch(request, {
        remoteAddr: { transport: "tcp", hostname: "127.0.0.1", port: 0 },
      });
    },
  },
);
