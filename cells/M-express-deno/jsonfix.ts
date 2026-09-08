// Workaround for denoland/deno#36240: with the @sentry/deno import hook active,
// require('*.json') is loaded as JS and throws `SyntaxError: Unexpected token ':'`.
// Registering a second load hook that forces format "json" restores CJS json requires.
import * as Module from "node:module";

Module.registerHooks({
  load(url: string, context: unknown, nextLoad: (u: string, c: unknown) => { format?: string }) {
    const result = nextLoad(url, context);
    if (url.endsWith(".json") && result.format !== "json") {
      result.format = "json";
    }
    return result;
  },
});
