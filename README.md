# Reproduction: `DataCollection` type export

Plain Node.js app in TypeScript that calls `Sentry.init()` with `dataCollection: {} as Required<DataCollection>`. With the released `@sentry/node`, `tsc` fails, because only `@sentry/core` exports the type: `error TS2305: Module '"@sentry/node"' has no exported member 'DataCollection'.`

## Getting started

```sh
$ pnpm i
```

To test a local SDK build of the branch `feat/export-data-collection-type`:

```sh
# in sentry-javascript
$ pnpm run build:dev:filter @sentry/node
$ (cd packages/node && yalc publish --sig)
$ (cd packages/server-utils && yalc publish --sig)

# in this repro
$ yalc add @sentry/node@11.10.0 @sentry/server-utils@11.10.0
$ printf "overrides:\n  '@sentry/server-utils': file:.yalc/@sentry/server-utils\n" > pnpm-workspace.yaml
$ pnpm i
```

`pnpm build` needs only the local `@sentry/node`. `pnpm start` also needs the local `@sentry/server-utils`, because `@sentry/node` on `develop` imports exports that 11.10.0 does not have.

## Running

```sh
$ pnpm build
src/index.ts(2,15): error TS2305: Module '"@sentry/node"' has no exported member 'DataCollection'.
```

With the local SDK build, `pnpm build` passes, and `pnpm start` runs `Sentry.init()` without output.

Tested with `@sentry/node` 11.10.0, TypeScript 7.0.2, Node.js 22.23.1, pnpm 12.3.4.
