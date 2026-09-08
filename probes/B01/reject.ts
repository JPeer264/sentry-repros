import "./instrument";
import * as Sentry from "@sentry/bun";

Promise.reject(new Error("B01 unhandled rejection"));

setTimeout(async () => {
  Sentry.captureMessage("sentinel");
  await Sentry.flush(2000);
}, 1500);
