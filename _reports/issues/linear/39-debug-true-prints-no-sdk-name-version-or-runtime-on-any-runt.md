# `debug: true` prints no SDK name, version or runtime on any runtime

Milestone: XPlatform Functionality Gaps
Labels: JavaScript, Improvement
Priority: Low

With `debug: true`, Node prints `Initializing Sentry: process: <pid>, thread: main.` and the list of installed integrations; Bun prints the same banner; Deno and Cloudflare print no banner at all. None of the four prints the SDK name, the SDK version, or the runtime name and version. In every reproduction those had to be read off the envelopes. A support thread that starts with "enable debug and paste the output" gets no identity line.

**Work item.** Print one line at init with SDK name, version, runtime name and version, on every runtime.

**Evidence.** Getting-started reproductions [`quickstarts/node/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/node), [`quickstarts/bun/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/bun), [`quickstarts/deno/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/deno), [`quickstarts/cloudflare/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/cloudflare), run on 2026-09-08 against develop `6f2da7483d` (package 10.67.0); results in `results-*.json` and the README of each directory.
