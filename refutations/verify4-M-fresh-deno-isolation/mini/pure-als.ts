import { AsyncLocalStorage } from "node:async_hooks";
const als = new AsyncLocalStorage<string>();

async function work(label: string, dyn: boolean) {
  await als.run(label, async () => {
    if (dyn) await import(`data:text/javascript,export const x=${Math.random()};`);
    else await new Promise((r) => setTimeout(r, 5));
    console.log(`inside ${label}: ${als.getStore()}`);
  });
  console.log(`after run(${label}) at top level: ${als.getStore()}`);
}

await work("A", false);
await work("B", true);
console.log("root store after B:", als.getStore());
setTimeout(() => console.log("in a later timer:", als.getStore()), 20);
