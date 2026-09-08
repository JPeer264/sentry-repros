!function(){try{var e="undefined"!="undefined"?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{};var n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="92dd91a4-17c4-40aa-8223-576c315968a7",e._sentryDebugIdIdentifier="sentry-dbid-92dd91a4-17c4-40aa-8223-576c315968a7");}catch(e){}}();import { d as defineEventHandler } from '../../nitro/nitro.mjs';
import { captureMessage } from "npm:@sentry/node";

const sentinel_get = defineEventHandler(() => {
  captureMessage("sentinel");
  return { ok: true };
});

export { sentinel_get as default };
//# sourceMappingURL=sentinel.get.mjs.map
