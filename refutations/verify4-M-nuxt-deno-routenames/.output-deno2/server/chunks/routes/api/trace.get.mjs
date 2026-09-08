!function(){try{var e="undefined"!="undefined"?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{};var n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="d42ae393-b924-4ac5-92c2-e695b2f4e852",e._sentryDebugIdIdentifier="sentry-dbid-d42ae393-b924-4ac5-92c2-e695b2f4e852");}catch(e){}}();import { d as defineEventHandler } from '../../nitro/nitro.mjs';
import { getActiveSpan, getRootSpan, spanToJSON } from "npm:@sentry/node";

const trace_get = defineEventHandler(() => {
  var _a, _b;
  const active = getActiveSpan();
  const root = active ? getRootSpan(active) : void 0;
  return {
    name: root ? (_a = spanToJSON(root).description) != null ? _a : null : null,
    op: root ? (_b = spanToJSON(root).op) != null ? _b : null : null,
    hasActive: !!active
  };
});

export { trace_get as default };
//# sourceMappingURL=trace.get.mjs.map
