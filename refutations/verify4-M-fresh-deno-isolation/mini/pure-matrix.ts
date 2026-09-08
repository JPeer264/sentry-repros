import { AsyncLocalStorage } from "node:async_hooks";
import { createServer } from "node:http";
const als = new AsyncLocalStorage<string>();
let n = 0;

async function body(path: string) {
  if (path === "/dyn") {
    await import(`data:text/javascript,export const x=${Math.random()};`);
  } else if (path === "/dyn-cached") {
    await import("./lazy-mod.ts");
  } else if (path === "/plain") {
    await new Promise((r) => setTimeout(r, 5));
  }
}

function handle(path: string) {
  const storeAtEntry = als.getStore();
  const id = `r${++n}`;
  return als.run(id, async () => {
    await body(path);
    return { id, path, storeAtEntry: storeAtEntry ?? null, storeInside: als.getStore() };
  });
}

const mode = Deno.env.get("MODE");
if (mode === "denoserve") {
  Deno.serve({ port: Number(Deno.env.get("PORT")) }, async (req) =>
    Response.json(await handle(new URL(req.url).pathname)));
} else if (mode === "nodehttp") {
  createServer((req, res) => {
    handle(req.url ?? "/").then((r) => {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify(r));
    });
  }).listen(Number(Deno.env.get("PORT")));
  console.log("node:http listening");
}
