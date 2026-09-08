!function(){try{var e="undefined"!="undefined"?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{};var n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="ae5ddd43-4139-417c-9904-f6199a9e106e",e._sentryDebugIdIdentifier="sentry-dbid-ae5ddd43-4139-417c-9904-f6199a9e106e");}catch(e){}}();import { setTimeout } from "node:timers";
import { d as defineEventHandler, g as getQuery } from '../../nitro/nitro.mjs';
import { setTag, setUser, captureException, getIsolationScope } from "npm:@sentry/node";

const tag_get = defineEventHandler(async (event) => {
  var _a, _b;
  const tag = String((_a = getQuery(event).tag) != null ? _a : "none");
  setTag("probe_tag", tag);
  setUser({ id: `user-${tag}` });
  await new Promise((r) => setTimeout(r, 50 + Math.floor(Math.random() * 150)));
  captureException(new Error(`boom-${tag}`));
  return { tag, isolationTag: (_b = getIsolationScope().getScopeData().tags.probe_tag) != null ? _b : null };
});

export { tag_get as default };
//# sourceMappingURL=tag.get.mjs.map
