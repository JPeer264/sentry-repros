import * as Module from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as Sentry from "@sentry/nestjs";

const env = (k: string) => (globalThis as any).Deno?.env.get(k) ?? process.env[k];

Sentry.init({
  dsn: "https://public@example.invalid/1",
  tunnel: `http://127.0.0.1:${env("SINK_PORT")}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: "static",
});

(Module as any).registerHooks({
  load(url: string, context: unknown, nextLoad: Function) {
    if (url.endsWith(".json")) {
      const src = readFileSync(fileURLToPath(url), "utf8");
      return { format: "commonjs", source: `module.exports = ${src}`, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});
console.log("json fix registered AFTER init");
