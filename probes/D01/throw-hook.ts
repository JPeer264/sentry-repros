import "@sentry/deno/import";
import "./init.ts";

console.log("about to throw");

setTimeout(() => {
  throw new Error("d01 uncaught throw");
}, 0);
