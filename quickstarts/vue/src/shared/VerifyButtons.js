import * as Sentry from "@sentry/vue";
import { markWired } from "./harness";

// The guide's verify snippets, docs/platforms/javascript/guides/vue/index.mdx, as one component
// object with a template string (the docs print them as fragments of App.vue). Only the `id`
// attributes, the logs button and the fetch probe are added.
export const VerifyButtons = {
  name: "VerifyButtons",
  template: `<div>
    <!-- index.mdx:285-298 -->
    <button id="btn-throw" @click="throwError">Throw error</button>
    <!-- index.mdx:318-337 -->
    <button id="btn-span" @click="throwErrorInSpan">Throw error</button>
    <!-- includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:12-24 -->
    <button id="btn-log" @click="logs">logs</button>
    <!-- Propagation probe for tracePropagationTargets: ["localhost", ...] (index.mdx:111) -->
    <button id="btn-fetch" @click="fetches">fetch</button>
  </div>`,
  mounted() {
    markWired();
  },
  methods: {
    throwError() {
      throw new Error('Sentry Error');
    },
    throwErrorInSpan() {
      Sentry.startSpan({ op: "test", name: "Example Frontend Span" }, async () => {
        // Simulate an asynchronous operation
        await new Promise(resolve => setTimeout(resolve, 99));

        throw new Error("Sentry Error");
      });
    },
    logs() {
      Sentry.logger.info("User example action completed");

      Sentry.logger.warn("Slow operation detected", {
        operation: "data_fetch",
        duration: 3500,
      });

      Sentry.logger.error("Validation failed", {
        field: "email",
        reason: "Invalid email",
      });
    },
    fetches() {
      fetch("/recorder?from=relative");
      fetch(window.location.origin + "/recorder?from=absolute");
    },
  },
};
