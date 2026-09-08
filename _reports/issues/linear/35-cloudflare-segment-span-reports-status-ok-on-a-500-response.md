# Cloudflare segment span reports status ok on a 500 response

Milestone: CF Functionality Gaps
Labels: JavaScript, Cloudflare Workers, Spans, Bug
Priority: Medium

A `withSentry` route that throws answers 500 through wrangler, and the error event arrives with mechanism `auto.http.cloudflare`, but the segment span of that request is emitted with `status: "ok"`. Node, Bun and Deno mark the same route `internal_error`.

**Work item.** Set the span status from the thrown error in the Cloudflare request wrapper, the way the other runtimes do.

**Evidence.** Getting-started reproduction [`quickstarts/cloudflare/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/cloudflare), run on 2026-09-08 against develop `6f2da7483d` (package 10.67.0); results in `results-*.json` and the README of each directory.
