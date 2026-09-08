!function(){try{var e="undefined"!="undefined"?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{};var n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="2696b7db-32d2-4f6f-a8a6-bdf1a972986a",e._sentryDebugIdIdentifier="sentry-dbid-2696b7db-32d2-4f6f-a8a6-bdf1a972986a");}catch(e){}}();import { d as defineEventHandler } from '../../nitro/nitro.mjs';
import { getActiveSpan, getRootSpan, spanToJSON } from "npm:@sentry/node";

const trace_get = defineEventHandler(() => {
  var _a, _b, _c, _d, _e;
  const active = getActiveSpan();
  const root = active ? getRootSpan(active) : void 0;
  const json = root ? spanToJSON(root) : void 0;
  return {
    name: (_a = json == null ? void 0 : json.description) != null ? _a : null,
    op: (_b = json == null ? void 0 : json.op) != null ? _b : null,
    source: (_d = (_c = json == null ? void 0 : json.data) == null ? void 0 : _c["sentry.source"]) != null ? _d : null,
    attrs: (_e = json == null ? void 0 : json.data) != null ? _e : null
  };
});

export { trace_get as default };
//# sourceMappingURL=trace.get.mjs.map
