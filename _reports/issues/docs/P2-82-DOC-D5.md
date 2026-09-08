The Deno v7-to-v8 migration includes are Bun text. `platform-includes/migration/javascript-v8/important-changes/javascript.deno.mdx:9` says "Sentry Bun SDK" and claims OpenTelemetry-powered Express, Fastify, Hapi and Nest auto-instrumentation. `platform-includes/migration/javascript-v8/integrations-package-removal/javascript.deno.mdx:3-5` names `@sentry/bun`. `platform-includes/migration/javascript-v8/other-changes/javascript.deno.mdx:3` says "your Bun SDK" and links `./v8-opentelemetry`, whose `supported:` list does not include `javascript.deno`, so the link renders dead on the Deno guide.

What was observed: the v8 Deno SDK did not have the OpenTelemetry-powered framework auto-instrumentation the include describes, and the package under discussion on these pages is `@sentry/deno`.

What to change:

- In `important-changes/javascript.deno.mdx`, replace "Sentry Bun SDK" with "Sentry Deno SDK" and delete the OpenTelemetry Express/Fastify/Hapi/Nest auto-instrumentation claim.
- In `integrations-package-removal/javascript.deno.mdx:3-5`, replace `@sentry/bun` with `@sentry/deno`.
- In `other-changes/javascript.deno.mdx:3`, replace "your Bun SDK" with "your Deno SDK" and remove the `./v8-opentelemetry` link, which is not shown for Deno.

---

_From the runtime docs audit of September 2026, item DOC-D5, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._
