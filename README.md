# Reproduction for getsentry/sentry-javascript#25339

Plain Node.js app, Express 5 bundled with `vite build --ssr` and `sentryVitePlugin()` from `@sentry/node/vite`, no framework. The plugin force-bundles Express's CommonJS `router`, and the injected snippet `require()`s `@sentry/server-utils`, which resolves to its CJS build. Vite 5-7 turn that build's `require("@sentry/core")` into a default import, and `@sentry/core` stays external and has no default export.

The install is hoisted (`nodeLinker: hoisted` in `pnpm-workspace.yaml`), as with npm. With pnpm's default layout, Vite bundles `@sentry/core` too and the server starts.

## Getting started

```sh
$ pnpm i
```

## Running

```sh
$ pnpm build
$ pnpm start
file:///.../build/app.js:23
import require$$0$1 from "@sentry/core";
       ^^^^^^^^^^^^
SyntaxError: The requested module '@sentry/core' does not provide an export named 'default'
```

`pnpm start` sends one request to `GET /` and exits. Without `SENTRY_DSN`, the spans are logged instead of sent.

Tested with `@sentry/node` 11.7.0, Vite 7.3.7, Express 5.1.0, Node.js 24.21.0, pnpm 12.3.4.
