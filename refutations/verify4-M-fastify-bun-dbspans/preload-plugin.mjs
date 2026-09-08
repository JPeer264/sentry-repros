import { sentryBunPlugin } from "@sentry/bun/plugin";
Bun.plugin(sentryBunPlugin());
await import("./instrument.mjs");
