// docs: platform-includes/getting-started-complete/javascript.remix.mdx:359-384 is the shape of this file
// (remix plugin, a Sentry plugin, `build.sourcemap: "hidden"`). QS_VITE_PLUGIN selects the Sentry plugin:
//   none   (default) no Sentry build plugin, the page's config minus the plugin it never installs
//   remix  sentryRemixVitePlugin from "@sentry/remix/vite", the develop subpath (migration page)
//   docs   sentryVitePlugin from "@sentry/vite-plugin", the import the page prints (:362)
// The Sentry plugin is imported lazily only so one config can serve all variants; the page shows a static import.
import { defineConfig } from "vite";
import { vitePlugin as remix } from "@remix-run/dev";

const variant = process.env.QS_VITE_PLUGIN ?? "none";

const sentryPlugins =
  variant === "remix"
    ? (await import("@sentry/remix/vite")).sentryRemixVitePlugin({ appDirPath: "./app" })
    : variant === "docs"
      ? (await import("@sentry/vite-plugin")).sentryVitePlugin({
          // If you use .sentryclirc or environment variables,
          // you don't need to specify these options
          org: "___ORG_SLUG___",
          project: "___PROJECT_SLUG___",
          // store your auth token in an environment variable
          authToken: process.env.SENTRY_AUTH_TOKEN,
        })
      : [];

export default defineConfig({
  plugins: [
    remix({
      // ... your Remix plugin options
    }),
    sentryPlugins,
  ],

  build: {
    sourcemap: "hidden",
    // ... rest of your Vite build options
  },
});
