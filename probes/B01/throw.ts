import "./instrument";
import * as Sentry from "@sentry/bun";

if (process.env.USER_HANDLER === "1") {
  process.on("uncaughtException", err => {
    console.log("USER_HANDLER saw:", (err as Error).message);
  });
}

if (process.env.WHERE === "toplevel") {
  throw new Error("B01 uncaught exception (top level)");
}

setTimeout(() => {
  throw new Error("B01 uncaught exception (timer)");
}, 10);

setTimeout(async () => {
  Sentry.captureMessage("sentinel");
  await Sentry.flush(2000);
}, 1500);
