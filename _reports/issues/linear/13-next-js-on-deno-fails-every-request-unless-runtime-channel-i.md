# Next.js on Deno fails every request unless runtime channel injection is off

Milestone: Deno + Framework gaps
Labels: JavaScript, Deno, Bug
Priority: High

Next.js 15 App Router builds and serves on Deno 2.9 with `deno run -A node_modules/next/dist/bin/next build` and `start`. With the default `Sentry.init`, every request returns 500 with `SyntaxError: Unexpected token ':'`, because the runtime channel hook makes `require("*.json")` fail (denoland/deno#36240). `enableRuntimeChannelInjection: false` fixes it and is the public option today, though it appears nowhere in the docs. Database spans then come from drivers with their own diagnostics channels (mysql2 3.11+, ioredis 5.11+) and from drivers Sentry bundles and transforms at build time (ioredis below 5.11, with webpack and `buildTimeInstrumentation` on, which `--turbopack` or `buildTimeInstrumentation: false` removes again). mysql 2.x and pg record nothing, because they stay in the server-external packages, and forcing them into the bundle corrupts the driver on Node as well as Deno. Outgoing fetch needs `integrations: [winterCGFetchIntegration()]` from `@sentry/vercel-edge`, already a dependency of `@sentry/nextjs`.

**Work item.** Disable runtime channel injection automatically on Deno until the JSON shim lands, and add the WinterCG fetch integration to the Next.js server defaults when the runtime is Deno.

**Evidence.** Cell record M-nextjs-deno in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproduction [`cells/M-nextjs-deno/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-nextjs-deno), each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
