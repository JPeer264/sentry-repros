import { sentryBunPlugin } from "@sentry/bun/plugin";

const result = await Bun.build({
  entrypoints: ["./app.ts"],
  outdir: "./dist",
  target: "bun",
  external: ["@sentry/*"],
  sourcemap: "external",
  plugins: [sentryBunPlugin()],
});

console.log("success", result.success);
for (const log of result.logs) console.log(log);
