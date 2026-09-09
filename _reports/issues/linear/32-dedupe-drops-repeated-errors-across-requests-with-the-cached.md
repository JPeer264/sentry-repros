# Dedupe drops repeated errors across requests with the cached client

Milestone: CF Functionality Gaps
Labels: JavaScript, Cloudflare Workers, Bug
Priority: Medium

On develop the client is cached per isolate, so the Dedupe integration's state survives across requests. It then treats an identical error thrown in a later request as a duplicate: hitting the same failing route twice sends one event, and a repeated `captureMessage` is dropped with `Event dropped due to being a duplicate of previously captured event.` until a different event intervenes. Seen on Pages and on Workers, and inside Workflows. On 10.73.0, with a client per request, every hit produced an event. Two workarounds were verified: `cacheClient: false` in the SDK options, which restores the per-request delivery, or keeping the cached client and dropping the integration with `integrations: defaults => defaults.filter(i => i.name !== 'Dedupe')`.

**Work item.** Reset the dedupe state per request, or leave Dedupe out of the Cloudflare defaults when the client is cached.

**Evidence.** Probe records C10, C14, C26 in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproductions [`probes/C10/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/probes/C10), [`probes/C14/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/probes/C14), [`probes/C26/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/probes/C26). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
