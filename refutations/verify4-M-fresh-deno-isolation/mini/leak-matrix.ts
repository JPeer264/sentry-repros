import { AsyncLocalStorage } from "node:async_hooks";
const als = new AsyncLocalStorage<string>();
let n = 0;

const ops: Record<string, () => Promise<unknown>> = {
  none: () => Promise.resolve(),
  timer: () => new Promise((r) => setTimeout(r, 5)),
  readfile: () => Deno.readTextFile("./deno.json"),
  dynimport_data: () => import(`data:text/javascript,export const x=${Math.random()};`),
  dynimport_file: () => import("./lazy-mod.ts"),
  wasm: () => WebAssembly.compile(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0])),
  crypto: () => crypto.subtle.digest("SHA-256", new Uint8Array([1, 2, 3])),
};

Deno.serve({ port: Number(Deno.env.get("PORT")) }, async (req) => {
  const op = new URL(req.url).pathname.slice(1) || "none";
  const before = als.getStore() ?? null;
  const id = `${op}#${++n}`;
  const inside = await als.run(id, async () => {
    await ops[op]?.();
    return als.getStore();
  });
  return Response.json({ op, storeAtEntry: before, inside, storeAtRootAfter: als.getStore() ?? null });
});
