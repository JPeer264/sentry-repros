# The Deno import hook requires `--allow-env` at module load through the vendored debug package

Milestone: Deno Functionality Gaps
Labels: JavaScript, Deno, Bug
Priority: Medium

With `import "@sentry/deno/import"` as the first line and the permission flags the Deno guide shows (`--allow-net`, `--allow-read`), the process exits before the app starts: `NotCapable: Requires env access, run again with the --allow-env flag`, raised from `node_modules/@sentry/server-runtime-injection/build/esm/vendored/debug/src/node.js:124` reading `process.env` at module load. A scoped `--allow-env=SENTRY_DSN` is not enough. Without the hook line the same flags run, and the SDK silently drops `server_name`, the OS version, context lines and `app://` frame paths.

**Work item.** Guard the environment reads in the vendored `debug` (or read them lazily) so the hook loads under a scoped or missing `--allow-env`, and warn once instead of degrading silently when a permission is missing.

**Evidence.** Getting-started reproduction [`quickstarts/deno/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/deno), run on 2026-09-08 against develop `6f2da7483d` (package 10.67.0); results in `results-*.json` and the README of each directory.
