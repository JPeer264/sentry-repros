import { registerHooks } from "node:module";

registerHooks({
  load(url: string, ctx: { format?: string }, nextLoad: (url: string, ctx: unknown) => { format?: string; source?: unknown }) {
    const result = nextLoad(url, ctx);
    if (url.includes("openai/resources/chat/completions/completions")) {
      console.log(
        `load format for ${url.split("node_modules/")[1] ?? url} => ${result.format} ctx.format: ${ctx.format} source type: ${typeof result.source}`,
      );
    }
    return result;
  },
});

await import("openai");
console.log("imported openai");
