# Reproduction for module ids with a query in `@apm-js-collab/code-transformer-bundler-plugins`

A script that calls the transform of the Vite plugin for one module of a fake package, `node_modules/fake-db/index.mjs`, two times: with the plain id, and with the id that Vite's dev server uses for a dependency that it does not pre-bundle (`?v=<hash>`). `createCodeTransformer()` gives the raw id to `moduleDetailsFromPath()` and `detectModuleType()`, so the module with the query is not transformed.

## Getting started

```sh
$ pnpm i
```

## Running

```sh
$ pnpm start
node_modules/fake-db/index.mjs: transformed
node_modules/fake-db/index.mjs?v=1a2b3c4d: not transformed
```

To check the fix, uncomment `patchedDependencies` in `pnpm-workspace.yaml` and run `pnpm i && pnpm start` again. The patch removes the query from the id with `stripQueryAndHashFromPath()`, and both ids are transformed.

Tested with `@apm-js-collab/code-transformer-bundler-plugins` 0.7.5, Node.js 22.23.1 and pnpm 12.3.4.
