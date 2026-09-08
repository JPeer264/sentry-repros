import * as Module from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Experiment switch A: turn the diagnostics-channel injection off entirely (the
// workaround the original probe reported as mandatory).
if (Deno.env.get("NO_INJECT") === "1") {
  (globalThis as Record<string, unknown>).__SENTRY_ORCHESTRION__ = { runtimeUnavailable: true };
}

// Experiment switch B: teach Deno's module hooks how to load `*.json` through CJS
// `require`, which Deno 2.9 otherwise compiles as JavaScript once ANY
// Module.registerHooks() load hook exists.
if (Deno.env.get("JSON_FIX") === "1") {
  (Module as unknown as { registerHooks: Function }).registerHooks({
    load(url: string, context: unknown, nextLoad: Function) {
      if (url.endsWith(".json")) {
        const src = readFileSync(fileURLToPath(url), "utf8");
        return { format: "commonjs", source: `module.exports = ${src}`, shortCircuit: true };
      }
      return nextLoad(url, context);
    },
  });
  console.log("JSON_FIX hook registered");
}

import * as Sentry from "@sentry/nestjs";

Sentry.init({
  dsn: "https://public@example.invalid/1",
  tunnel: `http://127.0.0.1:${Deno.env.get("SINK_PORT")}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: (Deno.env.get("LIFECYCLE") || "static") as "static" | "stream",
  debug: Deno.env.get("SENTRY_DEBUG") === "1",
});
console.log("SENTRY_INIT_DONE lifecycle=", Deno.env.get("LIFECYCLE") || "static");
