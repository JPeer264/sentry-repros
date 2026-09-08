import { AsyncLocalStorage } from "node:async_hooks";
const als = new AsyncLocalStorage<string>();
let n = 0;

export default {
  fetch(req: Request): Promise<Response> {
    const path = new URL(req.url).pathname;
    const storeAtEntry = als.getStore();
    const id = `r${++n}`;
    return als.run(id, async () => {
      if (path === "/dyn") {
        await import(`data:text/javascript,export const x=${Math.random()};`);
      } else if (path === "/plain") {
        await new Promise((r) => setTimeout(r, 5));
      }
      return Response.json({ id, path, storeAtEntry: storeAtEntry ?? null, storeInside: als.getStore() });
    });
  },
};
