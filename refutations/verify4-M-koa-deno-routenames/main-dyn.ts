import "./json-fix.ts";
import "@sentry/deno/import";
await import("./instrument.ts");
await import("./app.ts");
