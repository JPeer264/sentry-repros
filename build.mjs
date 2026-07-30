import * as esbuild from "esbuild";
import { cpSync } from "node:fs";
import { globSync } from "node:fs";
import { sentryOrchestrionPlugin } from "@sentry/server-utils/orchestrion/esbuild";
import { sentryEsbuildPlugin } from "@sentry/esbuild-plugin";

const result = await esbuild.build({
  entryPoints: ["src/app.js"],
  outfile: "dist/app.mjs",
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  sourcemap: true,
  // Let bundled CommonJS dependencies dynamically require Node built-ins.
  banner: {
    js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);",
  },
  // Native addons must stay real runtime requires: @sentry/node-cpu-profiler
  // picks a prebuild via literal `require('./sentry_cpu_profiler-<id>.node')`
  // and expects the native binding back. Keeping them external preserves the
  // literal, which pkg's asset detection can then see.
  external: ["./sentry_cpu_profiler-*.node"],
  plugins: [
    sentryOrchestrionPlugin(),
    sentryEsbuildPlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
    }),
  ],
});

for (const warning of result.warnings) {
  console.warn("[esbuild warning]", warning.text, warning.location?.file ?? "");
}

// Ship the prebuilds next to the bundle under their original names so the
// external requires resolve. Only this platform's are needed for the repro.
const prebuilds = globSync(
  "node_modules/@sentry/node-cpu-profiler/lib/sentry_cpu_profiler-*.node",
);

for (const file of prebuilds) {
  cpSync(file, `dist/${file.split("/").pop()}`);
}

console.log(`copied ${prebuilds.length} profiler prebuilds to dist/`);
