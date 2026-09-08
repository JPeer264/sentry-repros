import __process__ from 'node:process';globalThis.process=globalThis.process||__process__;import process from 'node:process';globalThis._importMeta_={url:import.meta.url,env:process.env};!function(){try{var e="undefined"!="undefined"?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{};var n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="fe8b46e1-54ab-4477-9668-7767572df5c6",e._sentryDebugIdIdentifier="sentry-dbid-fe8b46e1-54ab-4477-9668-7767572df5c6");}catch(e){}}();;(function(){var g=globalThis.__SENTRY_ORCHESTRION__=globalThis.__SENTRY_ORCHESTRION__||{};g.bundler=g.bundler||new Set();})();import * as path from "node:path";
import { GLOBAL_OBJ, DEV_ENVIRONMENT, DEFAULT_ENVIRONMENT, applySdkMetadata, getGlobalScope, debug } from "npm:@sentry/core";
import { init as init$1 } from "npm:@sentry/node";

const DEBUG_BUILD = (typeof __SENTRY_DEBUG__ === 'undefined' || __SENTRY_DEBUG__);

const NUXT_DEV_MODE_FLAG = "__SENTRY_NUXT_DEV_MODE__";
function isNuxtDevRuntime() {
  return NUXT_DEV_MODE_FLAG in GLOBAL_OBJ && GLOBAL_OBJ[NUXT_DEV_MODE_FLAG] === true;
}

function init(options) {
  let isDevBuild = false;
  isDevBuild = false;
  const envFallback = isDevBuild || isNuxtDevRuntime() ? DEV_ENVIRONMENT : DEFAULT_ENVIRONMENT;
  const sentryOptions = {
    environment: options.environment ?? process.env.SENTRY_ENVIRONMENT ?? envFallback,
    ...options
  };
  applySdkMetadata(sentryOptions, "nuxt", ["nuxt", "node"]);
  const client = init$1(sentryOptions);
  getGlobalScope().addEventProcessor(lowQualityTransactionsFilter(options));
  getGlobalScope().addEventProcessor(clientSourceMapErrorFilter(options));
  return client;
}
function lowQualityTransactionsFilter(options) {
  return Object.assign(
    ((event) => {
      if (event.type !== "transaction" || !event.transaction || isCacheEvent(event)) {
        return event;
      }
      const hasRouteParameters = /\/:[^(/\s]*(\([^)]*\))?[^/\s]*/.test(event.transaction);
      if (hasRouteParameters) {
        return event;
      }
      if (path.extname(event.transaction)) {
        options.debug && DEBUG_BUILD && debug.log("NuxtLowQualityTransactionsFilter filtered transaction: ", event.transaction);
        return null;
      }
      return event;
    }),
    { id: "NuxtLowQualityTransactionsFilter" }
  );
}
function clientSourceMapErrorFilter(options) {
  return Object.assign(
    ((event) => {
      const errorMsg = event.exception?.values?.[0]?.value;
      if (errorMsg?.match(/^ENOENT: no such file or directory, open '.*\/_nuxt\/.*\.js\.map'/)) {
        options.debug && DEBUG_BUILD && debug.log("NuxtClientSourceMapErrorFilter filtered error: ", errorMsg);
        return null;
      }
      return event;
    }),
    { id: "NuxtClientSourceMapErrorFilter" }
  );
}
function isCacheEvent(e) {
  return e.contexts?.trace?.origin === "auto.cache.nuxt";
}

init({
  dsn: "https://public@dsn.ingest.sentry.io/1337",
  tunnel: "http://127.0.0.1:34771/",
  tracesSampleRate: 1,
  traceLifecycle: process.env.TRACE_LIFECYCLE || "static",
  debug: true
});
//# sourceMappingURL=sentry.server.config.mjs.map
