# Reproduction for missing bundler peer dependencies in `@apm-js-collab/code-transformer-bundler-plugins`

A pnpm workspace with two packages that wrap the Vite plugin of `@apm-js-collab/code-transformer-bundler-plugins`: `a` uses Vite 7.3.6 and `b` uses Vite 8.3.1. The type declarations of the plugin import `vite`, but the package does not declare it, so pnpm resolves it to the Vite that it hoists into `node_modules/.pnpm/node_modules` (7.3.6). The type check of `b` fails with `error TS2322`, because the hook types of the plugin come from Vite 7.

## Getting started

```sh
$ pnpm i
```

## Running

```sh
$ pnpm typecheck
a typecheck: Done
b typecheck: plugin.ts(6,29): error TS2322: Type 'ObjectHook<(this: TransformPluginContext, code: string, id: string, options?: { ssr?: boolean | undefined; } | undefined) => TransformResult | Promise<...>, { ...; }> | undefined' is not assignable to type 'ObjectHook<(this: TransformPluginContext, code: string, id: string, options?: { moduleType: ModuleType; ssr?: boolean | undefined; } | undefined) => TransformResult | Promise<...>, { ...; }> | undefined'.
...
b typecheck:       The 'this' types of each signature are incompatible.
b typecheck:         Type 'TransformPluginContext' is missing the following properties from type 'TransformPluginContext': cache, getWatchFiles, setAssetSource
b typecheck: Failed
```

To check the fix, uncomment `packageExtensions` in `pnpm-workspace.yaml` and run `pnpm i && pnpm typecheck` again. pnpm then installs one copy of the plugin for each Vite version, and both packages pass.

Tested with `@apm-js-collab/code-transformer-bundler-plugins` 0.7.4, Vite 7.3.6 and 8.3.1, TypeScript 6.0.3 and pnpm 12.3.4.
