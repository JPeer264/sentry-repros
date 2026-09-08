import * as Module from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as Sentry from "@sentry/nestjs";

Sentry.init({
  dsn: "https://public@example.invalid/1",
  tunnel: `http://127.0.0.1:${Deno.env.get("SINK_PORT")}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: "static",
});

(Module as unknown as { registerHooks: Function }).registerHooks({
  load(url: string, context: unknown, nextLoad: Function) {
    if (url.endsWith(".json")) {
      const src = readFileSync(fileURLToPath(url), "utf8");
      return { format: "commonjs", source: `module.exports = ${src}`, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});
console.log("JSON_FIX registered AFTER init");
