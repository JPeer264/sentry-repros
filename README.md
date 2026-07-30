# Reproduction for getsentry/sentry-javascript#20625

Node.js single-executable application (SEA, built with [yao-pkg](https://yao-pkg.github.io/pkg/)) + Sentry build-time orchestrion instrumentation.

## Getting started

```sh
$ pnpm i
```

## Create SEA binary

```sh
$ pnpm build:esbuild
$ pnpm build:sea
```

## Run the binary

```sh
$ pnpm sea
```

Routes: `GET /`, `GET /users/:id`, `GET /work` (burns ~150ms CPU for profiling), `GET /error` (throws).
