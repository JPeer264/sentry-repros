// No Sentry at all: a pass-through Module.registerHooks({resolve, load}) is enough to
// break require('*.json') on Deno 2.9.0. This mirrors what the SDK's
// registerDiagnosticsChannelInjection() does.
import { registerHooks, createRequire } from "node:module";

registerHooks({
  resolve: (specifier, context, next) => next(specifier, context),
  load: (url, context, next) => next(url, context),
});

const require = createRequire(import.meta.url);
try {
  const statuses = require("statuses");
  console.log("STATUSES_OK", typeof statuses);
} catch (e) {
  console.log("STATUSES_FAIL", (e as Error).message);
}
