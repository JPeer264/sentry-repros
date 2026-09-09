// repro-only: one outgoing request to the sink's /recorder endpoint, which records the propagation headers.
// Nitro 3 has no global `$fetch`; the handler reports which function it used.
import { defineHandler } from "nitro/h3";

export default defineHandler(async () => {
  const url = `${process.env.SENTRY_TUNNEL}recorder`;
  const g = globalThis as { $fetch?: (u: string) => Promise<unknown> };
  const used = typeof g.$fetch === "function" ? "$fetch" : "fetch";
  const res = used === "$fetch" ? await g.$fetch!(url) : await (await fetch(url)).json();
  return { used, res };
});
