# Make the Cloudflare framework e2e apps required and add the missing ones

Milestone: CF Test Coverage
Labels: JavaScript, Cloudflare Workers, Tests
Priority: Medium

`react-router-8-cloudflare`, `tanstackstart-react-cloudflare` and `sveltekit-3-cloudflare-workers` are `optional` in CI (`.github/workflows/build.yml:1131`), so the wiring the Cloudflare framework pages describe does not run on pull requests. No app covers Express, Koa, Hapi or NestJS behind `httpServerHandler` with the Vite plugin, Elysia with `aot: false`, Oak, Fresh, Remix through `@sentry/remix/cloudflare`, or SolidStart.

**Work item.** Promote the three apps to required and port the nine missing cells.

**Evidence.** `cells/M-*-cf/`, and the framework grid in `_reports/deep-probe-report.html`.
