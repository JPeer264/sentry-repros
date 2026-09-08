The three OpenTelemetry pages gate themselves to a `supported` allowlist that includes `javascript.bun` but neither `javascript.deno` nor `javascript.cloudflare`: `docs/platforms/javascript/common/opentelemetry/index.mdx:11`, `custom-setup.mdx:9` and `using-opentelemetry-apis.mdx:9`. Deno and Cloudflare readers never see the section.

Both runtimes support the setup on develop. `packages/deno/src/sdk.ts:114` calls `setupOpenTelemetryTracer()` when `options.enableOpenTelemetrySetup ?? true`, so a Deno app gets a Sentry OpenTelemetry tracer provider by default, and spans created through `@opentelemetry/api` reach Sentry with no extra configuration. `packages/cloudflare/src/sdk.ts:23-29` exposes the same `enableOpenTelemetrySetup` option, defaulted to `false`, and installs the tracer when it is set to `true`.

What to change:

- Add `- javascript.deno` and `- javascript.cloudflare` to the `supported` lists on all three pages.
- State the differing defaults: on for Deno, opt-in for Cloudflare via `enableOpenTelemetrySetup: true`.

---

_From the runtime docs audit of September 2026, item DOC-R7, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._
