// docs/platforms/javascript/guides/svelte/features/component-tracking.mdx:18-27 verbatim, except
// that the page's `compilerOptions: {...}` placeholder is not valid JavaScript and is written as `{}`.
import { withSentryConfig } from "@sentry/svelte";

const config = {
  // Your svelte config
  compilerOptions: {},
};

export default withSentryConfig(config);
