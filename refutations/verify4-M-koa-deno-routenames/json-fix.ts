import { registerHooks } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

registerHooks({
  load(url: string, context: unknown, nextLoad: (u: string, c: unknown) => unknown) {
    if (url.endsWith(".json")) {
      return {
        format: "json",
        source: readFileSync(fileURLToPath(url), "utf8"),
        shortCircuit: true,
      };
    }
    return nextLoad(url, context);
  },
});
