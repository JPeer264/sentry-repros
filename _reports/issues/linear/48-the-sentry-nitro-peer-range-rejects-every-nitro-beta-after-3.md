# The `@sentry/nitro` peer range rejects every Nitro beta after `3.0.260415-beta`

Milestone: XPlatform Functionality Gaps
Labels: JavaScript, Bug
Priority: High

`packages/nitro/package.json` peers `nitro: ">=3.0.0-0 <4.0.0 || 3.0.260311-beta || 3.0.260415-beta"`. npm lets a prerelease satisfy a comparator only when it carries the same `major.minor.patch`, so the range accepts exactly `3.0.0`, `3.0.260311-beta` and `3.0.260415-beta` and rejects every beta published since, the registry's `latest` included. `npm install` ends in `ERESOLVE` for a plain Nitro app (DOC-Q78, `results-latest-nitro.json`, which needed `--legacy-peer-deps`) and for `npm install @sentry/solidstart`, because SolidStart 2 pulls a newer beta (`results-import-src.json`). Two getting-started guides cannot be followed with npm as printed.

**Work item.** Widen the range so Nitro 3 prereleases resolve, and pin a recent beta in CI so it stays true.

**Evidence.** Getting-started reproductions [`quickstarts/nitro/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/nitro), [`quickstarts/solidstart/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/solidstart), run in September 2026 against develop `03aaf42455` (package 10.67.0); results in `results-*.json` and the README of each directory.
