!function(){try{var e="undefined"!="undefined"?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{};var n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="7d8d553c-6342-4f7d-ac80-d35f72b63236",e._sentryDebugIdIdentifier="sentry-dbid-7d8d553c-6342-4f7d-ac80-d35f72b63236");}catch(e){}}();import { d as defineEventHandler } from '../../nitro/nitro.mjs';
import { getActiveSpan, getRootSpan, getIsolationScope, spanToJSON } from "npm:@sentry/node";

const trace_get = defineEventHandler(() => {
  const span = getActiveSpan();
  const root = span ? getRootSpan(span) : void 0;
  return {
    hasActiveSpan: !!span,
    rootName: root ? spanToJSON(root).description : null,
    isolationTags: getIsolationScope().getScopeData().tags
  };
});

export { trace_get as default };
//# sourceMappingURL=trace.get.mjs.map
