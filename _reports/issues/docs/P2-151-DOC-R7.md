The three OpenTelemetry pages gate themselves to a `supported` allowlist that includes `javascript.bun` but neither `javascript.deno` nor `javascript.cloudflare`: `docs/platforms/javascript/common/opentelemetry/index.mdx:11`, `custom-setup.mdx:9` and `using-opentelemetry-apis.mdx:9`. Deno and Cloudflare readers never see the section.

Both runtimes support the setup on develop, with different defaults. `packages/deno/src/sdk.ts:114` calls `setupOpenTelemetryTracer()` when `options.enableOpenTelemetrySetup ?? true`, so a Deno app gets a Sentry OpenTelemetry tracer provider unless it passes `enableOpenTelemetrySetup: false`, and spans created through `@opentelemetry/api` reach Sentry with no extra configuration. `packages/cloudflare/src/sdk.ts:23` sets `options.enableOpenTelemetrySetup ??= false` and installs the tracer at `:27-29` only when the option is `true`. Bun, already on the list, is off by default too: it delegates to `@sentry/node`, where `packages/node/src/sdk/index.ts:253` applies `options.enableOpenTelemetrySetup ?? false`.

`custom-setup.mdx` is the exception and should stay gated for now. Its body is written around `skipOpenTelemetrySetup` (`:35`, `:122`, `:132`), `SentryContextManager` (`:35`, `:53`), `SentrySpanProcessor` (`:53`, `:66`) and `SentrySampler` (`:53`), none of which exist on develop, and the include it pulls for JavaScript readers is written against the same removed API. There is no `javascript.deno.mdx` or `javascript.cloudflare.mdx` under `platform-includes/performance/opentelemetry-setup/`, so the two guides would fall back to `javascript.mdx` and get a page that cannot be followed.

What to change:

- Add `- javascript.deno` and `- javascript.cloudflare` to the `supported` lists in `opentelemetry/index.mdx` and `using-opentelemetry-apis.mdx`, after checking those two bodies for Node-only wording.
- State the differing defaults: Deno sets up the tracer unless `enableOpenTelemetrySetup: false`, Cloudflare only with `enableOpenTelemetrySetup: true`, Bun off unless it is turned on.
- Leave `custom-setup.mdx:9` as it is until that page and the `performance/opentelemetry-setup` includes are dealt with.

---

_From the runtime docs audit of September 2026, item DOC-R7, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-08 against docs `aebda0ee4` and develop `03aaf42455`, after a second verification pass over every item._
