!function(){try{var e="undefined"!="undefined"?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{};var n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="4047b03c-d1a5-4668-859e-29a6f135ec63",e._sentryDebugIdIdentifier="sentry-dbid-4047b03c-d1a5-4668-859e-29a6f135ec63");}catch(e){}}();import { d as defineEventHandler, g as getRouterParam } from '../../../nitro/nitro.mjs';
import { getActiveSpan, getRootSpan, spanToJSON } from "npm:@sentry/node";

const _id__get = defineEventHandler((event) => {
  var _a;
  const id = getRouterParam(event, "id");
  const active = getActiveSpan();
  const root = active ? getRootSpan(active) : void 0;
  if (id === "boom") {
    throw new Error("users-route-boom");
  }
  return { id, name: root ? (_a = spanToJSON(root).description) != null ? _a : null : null };
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
