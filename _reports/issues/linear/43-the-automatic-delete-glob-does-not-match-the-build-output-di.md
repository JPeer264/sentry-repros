# The automatic delete glob does not match the build output directory

Milestone: XPlatform Functionality Gaps
Labels: JavaScript, Bug
Priority: Medium

Two of the automatic `filesToDeleteAfterUpload` defaults point somewhere other than the directory the build wrote to. `packages/solidstart/src/vite/sourceMaps.ts:124` sets `["./**/*.map"]`, the whole project root: one SolidStart build deleted 3,543 maps, 3,519 of them under `node_modules/` and 24 under `.output/` (DOC-Q104, `results-import-src.json`). `packages/astro/src/integration/index.ts:75` hardcodes `["./dist/**/client/**/*.map", "./dist/**/server/**/*.map"]` and never reads `outDir`, so builds with `outDir: ./dist-middleware` and `./dist-removed-option` kept 27 and 26 hidden maps and shipped them with the app (DOC-Q100, `results-build-middleware.json`, `results-build-removed-option.json`). The Nitro default is derived from the output directory and is not affected.

**Work item.** Scope the SolidStart glob to the build output, and read `outDir` for the Astro one.

**Evidence.** Getting-started reproductions [`quickstarts/solidstart/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/solidstart), [`quickstarts/astro/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/astro), run in September 2026 against develop `03aaf42455` (package 10.67.0); results in `results-*.json` and the README of each directory.
