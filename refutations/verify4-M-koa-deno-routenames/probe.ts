import "./json-fix.ts";
import "@sentry/deno/import";
const g = globalThis as any;
console.log("marker-before-koa", JSON.stringify(g.__SENTRY_ORCHESTRION__));
await import("koa");
console.log("marker-after-koa", JSON.stringify(g.__SENTRY_ORCHESTRION__));
await import("@koa/router");
console.log("marker-after-router", JSON.stringify(g.__SENTRY_ORCHESTRION__));
