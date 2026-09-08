# Nuxt on Workers: parameterless routes are named by method only

Milestone: Cloudflare + Framework gaps
Labels: JavaScript, Cloudflare Workers, Bug
Priority: Medium

With the documented `sentryCloudflareNitroPlugin` wiring, six of seven capabilities pass. Only routes with parameters, such as `/api/users/[id]`, get their route pattern; a parameterless route such as `/api/health` is reported as bare `GET` under the stream lifecycle and as the request URL under static. A second Nitro plugin that renames the root span from `event.context.matchedRoute` with `getActiveSpan`, `getRootSpan` and `spanToJSON` produced identical output to a patched SDK.

**Work item.** Rename the root span from the matched Nitro route inside `sentryCloudflareNitroPlugin`.

**Evidence.** Cell record M-nuxt-cf in `_reports/deep-probe-report.html`; reproduction `cells/M-nuxt-cf/`, each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
