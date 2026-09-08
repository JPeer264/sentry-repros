// The literal form asked for in the audit brief: no `external`, no `sourcemap`.
import { sentryBunPlugin } from "@sentry/bun/plugin";

await Bun.build({
  entrypoints: ["./app.ts"],
  outdir: "./dist-minimal",
  target: "bun",
  plugins: [sentryBunPlugin()],
});
