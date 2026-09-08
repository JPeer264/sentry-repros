# Add e2e apps for the verified Bun framework cells

Milestone: Bun Test Coverage
Labels: JavaScript, Bun, Tests
Priority: Medium

Bun has e2e apps for Elysia, Next.js and mysql, and integration suites for Hono and two drivers. No Bun app runs Express, Koa, Hapi, Fastify, Oak, Fresh, NestJS, Remix, SolidStart, SvelteKit, Astro, React Router, TanStack Start or Nuxt, although all fourteen were verified to work with the wiring in the cell records. Each cell in the reproduction folder is a runnable app with a README that lists install, run and expected output.

**Work item.** Port the cells into `dev-packages/e2e-tests/test-applications/`, one per framework, starting with the four Node HTTP frameworks on the plugin build.

**Evidence.** [`cells/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells) (the `M-*-bun` directories), and the framework grid in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html).
