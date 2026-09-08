import "@sentry/deno/import";
import * as Sentry from "@sentry/deno";
import { context as otelContext } from "@opentelemetry/api";

const MODE = Deno.env.get("PROBE_MODE") ?? "baseline";
const LIFECYCLE = (Deno.env.get("PROBE_LIFECYCLE") ?? "stream") as
  | "stream"
  | "static";
const SINK = Deno.env.get("PROBE_SINK") ?? "http://127.0.0.1:41337/";

Sentry.init({
  dsn: "https://abc@o1.ingest.sentry.io/1",
  tunnel: SINK,
  tracesSampleRate: 1.0,
  traceLifecycle: LIFECYCLE,
  debug: Deno.env.get("PROBE_DEBUG") === "1",
});

console.log(`[probe] mode=${MODE} lifecycle=${LIFECYCLE}`);

if (MODE === "ctxmgr" || MODE === "ctxmgr-source" || MODE === "ctxmgr-active") {
  const SPAN_KEY = Symbol.for("OpenTelemetry Context Key SPAN");

  class BridgeContext {
    #map: Map<symbol, unknown>;
    constructor(map = new Map<symbol, unknown>()) {
      this.#map = map;
    }
    getValue(key: symbol): unknown {
      if (key === SPAN_KEY) {
        const active = Sentry.getActiveSpan();
        if (!active) return undefined;
        return MODE === "ctxmgr-active" ? active : Sentry.getRootSpan(active);
      }
      return this.#map.get(key);
    }
    setValue(key: symbol, value: unknown) {
      const m = new Map(this.#map);
      m.set(key, value);
      return new BridgeContext(m);
    }
    deleteValue(key: symbol) {
      const m = new Map(this.#map);
      m.delete(key);
      return new BridgeContext(m);
    }
  }

  const ok = otelContext.setGlobalContextManager({
    // deno-lint-ignore no-explicit-any
    active: () => new BridgeContext() as any,
    // deno-lint-ignore no-explicit-any
    with: (_ctx: any, fn: any, thisArg: any, ...args: any[]) =>
      fn.call(thisArg, ...args),
    // deno-lint-ignore no-explicit-any
    bind: (_ctx: any, target: any) => target,
    enable() {
      return this;
    },
    disable() {
      return this;
    },
    // deno-lint-ignore no-explicit-any
  } as any);
  console.log(`[probe] setGlobalContextManager -> ${ok}`);
}

if (MODE === "denootel") {
  // deno-lint-ignore no-explicit-any
  const tel = (Deno as any).telemetry;
  const ok = otelContext.setGlobalContextManager(tel.contextManager);
  console.log(`[probe] deno contextManager -> ${ok}`);
}

if (MODE === "ctxmgr-route") {
  const SPAN_KEY = Symbol.for("OpenTelemetry Context Key SPAN");

  // Bridges @opentelemetry/api's active span onto the active Sentry span so that
  // framework code calling trace.getActiveSpan() renames the Sentry segment.
  function bridgeSpan() {
    const active = Sentry.getActiveSpan();
    if (!active) return undefined;
    const root = Sentry.getRootSpan(active);
    return {
      updateName(name: string) {
        Sentry.updateSpanName(root, name);
        return this;
      },
      setAttribute(key: string, value: unknown) {
        root.setAttribute(key, value as never);
        if (key === "http.route") {
          root.setAttribute("sentry.segment.name.source", "route");
          root.setAttribute("sentry.source", "route");
        }
        return this;
      },
      setAttributes(attrs: Record<string, unknown>) {
        for (const [k, v] of Object.entries(attrs)) this.setAttribute(k, v);
        return this;
      },
      spanContext: () => (root as unknown as { spanContext(): unknown }).spanContext(),
      isRecording: () => true,
      setStatus() { return this; },
      recordException(e: unknown) { Sentry.captureException(e); return this; },
      addEvent() { return this; },
      end() {},
    };
  }

  class RouteContext {
    #map: Map<symbol, unknown>;
    constructor(map = new Map<symbol, unknown>()) { this.#map = map; }
    getValue(key: symbol): unknown {
      if (key === SPAN_KEY) return bridgeSpan();
      return this.#map.get(key);
    }
    setValue(key: symbol, value: unknown) {
      const m = new Map(this.#map); m.set(key, value); return new RouteContext(m);
    }
    deleteValue(key: symbol) {
      const m = new Map(this.#map); m.delete(key); return new RouteContext(m);
    }
  }

  const ok = otelContext.setGlobalContextManager({
    // deno-lint-ignore no-explicit-any
    active: () => new RouteContext() as any,
    // deno-lint-ignore no-explicit-any
    with: (_ctx: any, fn: any, thisArg: any, ...args: any[]) => fn.call(thisArg, ...args),
    // deno-lint-ignore no-explicit-any
    bind: (_ctx: any, target: any) => target,
    enable() { return this; },
    disable() { return this; },
    // deno-lint-ignore no-explicit-any
  } as any);
  console.log(`[probe] ctxmgr-route setGlobalContextManager -> ${ok}`);
}
