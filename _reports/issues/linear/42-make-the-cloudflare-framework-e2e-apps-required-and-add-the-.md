# Make the Cloudflare framework e2e apps required and add the missing ones

Milestone: CF Test Coverage
Labels: JavaScript, Cloudflare Workers, Tests
Priority: Medium

`react-router-8-cloudflare`, `tanstackstart-react-cloudflare` and `sveltekit-3-cloudflare-workers` are `optional` in CI (`.github/workflows/build.yml:1131`), so the wiring the Cloudflare framework pages describe does not run on pull requests. No app covers Express, Koa or Hapi behind `httpServerHandler` with the Vite plugin, NestJS or Fresh on the esbuild orchestrion build, Elysia with `aot: false`, Oak, Remix through `@sentry/remix/cloudflare`, or SolidStart.

**Work item.** Promote the three apps to required and port the nine missing cells.

**Evidence.** [`cells/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells) (the `M-*-cf` directories), and the framework grid in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html).
