!function(){try{var e="undefined"!="undefined"?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{};var n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="a289a1fd-291e-4309-8a53-88388283490a",e._sentryDebugIdIdentifier="sentry-dbid-a289a1fd-291e-4309-8a53-88388283490a");}catch(e){}}();import { d as defineEventHandler, g as getRouterParam } from '../../../nitro/nitro.mjs';
import { getActiveSpan, getRootSpan, spanToJSON } from "npm:@sentry/node";

const _id__get = defineEventHandler((event) => {
  var _a, _b, _c;
  const id = getRouterParam(event, "id");
  const active = getActiveSpan();
  const root = active ? getRootSpan(active) : void 0;
  const json = root ? spanToJSON(root) : void 0;
  if (id === "boom") {
    throw new Error("users-route-boom");
  }
  return { id, name: (_a = json == null ? void 0 : json.description) != null ? _a : null, source: (_c = (_b = json == null ? void 0 : json.data) == null ? void 0 : _b["sentry.source"]) != null ? _c : null };
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
