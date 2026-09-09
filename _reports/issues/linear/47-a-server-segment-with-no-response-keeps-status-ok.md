# A server segment with no response keeps status ok

Milestone: XPlatform Functionality Gaps
Labels: JavaScript, Bug
Priority: Medium

A request that never produced a response still ends its segment span as a success. A Connect request the client aborted arrived with `status: ok` and `http.response.status_code: 200` after 3 s although nothing had been written (DOC-Q53, `results-no-handler.json`). The SvelteKit segment of a throwing route is `ok` with no status code at all, and only the `sveltekit.resolve` child carries the 500 (DOC-Q94, `results-base.json`); the three throwing routes of the Cloudflare Pages run behave the same (DOC-Q84, `results-base.json`). Alerts and failure rates built on segment status miss every one of these.

**Work item.** Set the segment status from the response, and from the thrown error where there is no response, in the Node HTTP server span and in the SvelteKit and Cloudflare request wrappers.

**Evidence.** Getting-started reproductions [`quickstarts/connect/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/connect), [`quickstarts/sveltekit/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/sveltekit), [`quickstarts/cloudflare-pages/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/cloudflare-pages), run in September 2026 against develop `03aaf42455` (package 10.67.0); results in `results-*.json` and the README of each directory.
