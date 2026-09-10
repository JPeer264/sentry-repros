# Source maps are deleted after a build that uploaded nothing

Milestone: XPlatform Functionality Gaps
Labels: JavaScript, Bug
Priority: High

Without an auth token the bundler plugin logs `Will not upload source maps` and then deletes the maps the framework plugin had just told it to generate, so a build that reads as green ships with no source maps and nothing says so. SolidStart deleted 3,543 `*.map` files (DOC-Q104, `results-import-src.json`), Nitro left no `*.map` anywhere under `.output` (DOC-Q80, `results-start.json`), the Next.js Turbopack path left `.next/static` with zero maps and no `sourceMappingURL` (DOC-Q89, `results-app-router.json`), and Astro deleted the hidden maps it had switched on itself (DOC-Q100, `results-build-base.json`).

Each framework plugin fills `sourcemaps.filesToDeleteAfterUpload` on the user's behalf, and the deletion runs whether or not an upload happened: `packages/solidstart/src/vite/sourceMaps.ts:117-124`, `packages/astro/src/integration/index.ts:71-75`, `packages/nitro/src/sourceMaps.ts:89-90`, `packages/nextjs/src/config/getBuildPluginOptions.ts:301-310`.

**Work item.** Skip the automatic deletion when no upload was attempted, and say once at build time that the maps were kept.

**Evidence.** Getting-started reproductions [`quickstarts/solidstart/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/solidstart), [`quickstarts/nitro/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/nitro), [`quickstarts/nextjs/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/nextjs), [`quickstarts/astro/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/astro), run in September 2026 against develop `03aaf42455` (package 10.67.0); results in `results-*.json` and the README of each directory.
