// docs/platforms/javascript/guides/svelte/features/component-tracking.mdx:35-61 verbatim, except
// that the page's `compilerOptions: {...}` placeholder is not valid JavaScript and is written as `{}`.
// The components in src/component-tracking/ are named after the page's example array on purpose.
import { withSentryConfig } from "@sentry/svelte";

const config = {
  // Your svelte config
  compilerOptions: {},
};

const sentryOptions = {
  // Groups all component tracking-related options
  // (optional)
  componentTracking: {
    // Add the components you want to be tracked to this array.
    // Specify `true` to track all components or `false` to disable
    // tracking entirely
    // (optional, defaults to `true`)
    trackComponents: ["Navbar", "PrimaryButton", "LoginForm"],
    // To disable component initialization spans, set this to `false`.
    // (optional, defaults to `true`)
    trackInit: true,
    // To disable component update spans, set this to `false`
    // (optional, defaults to `true`)
    trackUpdates: false,
  },
};

export default withSentryConfig(config, sentryOptions);
