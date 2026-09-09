# Error events on Bun and Cloudflare carry no `transaction` field

Milestone: XPlatform Functionality Gaps
Labels: JavaScript, Bun, Cloudflare Workers, Bug
Priority: Medium

The same throwing route produces an error event with `transaction: "GET /debug-sentry"` on Node and no `transaction` key at all on Bun (`Bun.serve`, even with a `routes` map that names the server span `GET /users/:id`) and on Cloudflare (`withSentry`). Deno sets none either. Issues from those runtimes have no transaction to group or filter by.

**Work item.** Set `event.transaction` from the active segment span name in the Bun, Deno and Cloudflare request wrappers, as the Node request integration does.

**Evidence.** Getting-started reproductions [`quickstarts/node/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/node), [`quickstarts/bun/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/bun), [`quickstarts/deno/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/deno), [`quickstarts/cloudflare/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/cloudflare), run on 2026-09-08 against develop `6f2da7483d` (package 10.67.0); results in `results-*.json` and the README of each directory.
