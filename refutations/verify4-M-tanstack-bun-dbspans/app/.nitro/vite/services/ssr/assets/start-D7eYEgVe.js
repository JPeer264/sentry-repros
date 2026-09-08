import { h as getActiveSpan, s as spanToJSON, bz as Id, d2 as updateSpanName, k as jd, T as captureException, al as addNonEnumerableProperty, d3 as SENTRY_INTERNAL, d4 as createMiddleware, d1 as wrapMiddlewaresWithSentry } from "../server.js";
import { g as globalFunctionMiddleware, a as globalRequestMiddleware } from "./middleware-DPvMzr-A.js";
import "node:async_hooks";
import "node:stream";
import "node:stream/web";
import "util";
import "crypto";
import "async_hooks";
import "stream";
function createSentryMiddlewareHandler(mechanismType) {
  return async function sentryMiddlewareHandler({ next }) {
    try {
      return await next();
    } catch (e) {
      captureException(e, {
        mechanism: { type: mechanismType, handled: false }
      });
      throw e;
    }
  };
}
function createSentryFunctionMiddlewareHandler(mechanismType) {
  return async function sentryFunctionMiddlewareHandler({
    next,
    serverFnMeta
  }) {
    const activeSpan = getActiveSpan();
    const spanData = activeSpan ? spanToJSON(activeSpan) : void 0;
    if (activeSpan && spanData?.attributes[Id] === "auto.function.tanstackstart.server") {
      if (serverFnMeta?.name) {
        const method = spanData.name.split(" ")[0] || "GET";
        updateSpanName(activeSpan, `${method} /_serverFn/${serverFnMeta.name}`);
        activeSpan.setAttribute(jd, "route");
      }
      if (serverFnMeta?.id) {
        activeSpan.setAttribute("tanstackstart.function.id", serverFnMeta.id);
      }
      if (serverFnMeta?.filename) {
        activeSpan.setAttribute("tanstackstart.function.filename", serverFnMeta.filename);
      }
    }
    try {
      return await next();
    } catch (e) {
      captureException(e, {
        mechanism: { type: mechanismType, handled: false }
      });
      throw e;
    }
  };
}
const sentryGlobalRequestMiddleware = {
  // `~types`/`_types` only exist on the type level in TanStack Start middlewares and hold no runtime value
  "~types": void 0,
  _types: void 0,
  options: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    server: createSentryMiddlewareHandler("auto.middleware.tanstackstart.request")
  }
};
const sentryGlobalFunctionMiddleware = {
  // `~types`/`_types` only exist on the type level in TanStack Start middlewares and hold no runtime value
  "~types": void 0,
  _types: void 0,
  options: {
    server: createSentryFunctionMiddlewareHandler("auto.middleware.tanstackstart.server_function")
    // eslint-disable-line @typescript-eslint/no-explicit-any
  }
};
addNonEnumerableProperty(sentryGlobalRequestMiddleware, SENTRY_INTERNAL, true);
addNonEnumerableProperty(sentryGlobalFunctionMiddleware, SENTRY_INTERNAL, true);
function dedupeSerializationAdapters(deduped, serializationAdapters) {
  for (let i = 0, len = serializationAdapters.length; i < len; i++) {
    const current = serializationAdapters[i];
    if (!deduped.has(current)) {
      deduped.add(current);
      if (current.extends) dedupeSerializationAdapters(deduped, current.extends);
    }
  }
}
var createStart = (getOptions) => {
  return {
    getOptions: async () => {
      const options = await getOptions();
      if (options.serializationAdapters) {
        const deduped = /* @__PURE__ */ new Set();
        dedupeSerializationAdapters(deduped, options.serializationAdapters);
        options.serializationAdapters = Array.from(deduped);
      }
      return options;
    },
    createMiddleware
  };
};
const startInstance = createStart(() => {
  return {
    requestMiddleware: wrapMiddlewaresWithSentry({ sentryGlobalRequestMiddleware, globalRequestMiddleware }),
    functionMiddleware: wrapMiddlewaresWithSentry({ sentryGlobalFunctionMiddleware, globalFunctionMiddleware })
  };
});
export {
  startInstance
};
