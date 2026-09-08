import * as Module from "node:module";
Module.registerHooks({
  load(url: string, context: unknown, nextLoad: (u: string, c: unknown) => { format?: string }) {
    const result = nextLoad(url, context);
    if (url.endsWith(".json") && result.format !== "json") result.format = "json";
    return result;
  },
});
