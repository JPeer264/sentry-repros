// index.mdx:69-122 main.js with the "performance" option only (component-tracking.mdx:12 asks for
// tracing to be configured). Component tracking itself comes from svelte.config.js /
// svelte.config.options.js through build.mjs, no code change here.
import { mount } from "svelte";
import App from "./App.svelte";

import * as Sentry from "@sentry/svelte";
import { installHarness } from "../shared/harness";

window.Sentry = Sentry;
window.__svelteVersion = __SVELTE_VERSION__;
installHarness();

Sentry.init({
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: "/tunnel",
  debug: true,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 1.0,
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
});

const app = mount(App, {
  target: document.getElementById("app"),
});

export default app;
