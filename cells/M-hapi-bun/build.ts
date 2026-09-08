import { sentryBunPlugin } from "@sentry/bun/plugin";

await Bun.build({
  entrypoints: ["./app.ts"],
  outdir: "./dist",
  target: "bun",
  external: ["@sentry/*"],
  sourcemap: "external",
  plugins: [sentryBunPlugin()],
});
