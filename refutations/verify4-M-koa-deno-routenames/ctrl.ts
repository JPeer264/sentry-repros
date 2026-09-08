import { registerHooks } from "node:module";
registerHooks({ load(url: string, ctx: unknown, next: (u: string, c: unknown) => unknown) { return next(url, ctx); } });
const m = await import("koa");
console.log("loaded koa ok", typeof m.default);
