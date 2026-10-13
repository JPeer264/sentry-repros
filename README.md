# Reproduction for SvelteKit 2 + Svelte 4 returning 500 since rollup 4.64.6

With Svelte 4, every server-rendered page that imports `$app/stores` returns 500 since rollup 4.64.6:

```
ReferenceError: $state is not defined
```

`is_legacy` in SvelteKit's `src/runtime/client/state.svelte.js` tests `onMount.toString()` with `/function \w+\(\) \{\}/`. In the server build, Svelte 4's `onMount` is `function onMount() {\n}`, so the check is `false` and the Svelte 5 branch with `$state.raw()` runs. Up to rollup 4.64.5, tree-shaking removed that branch. Rollup 4.64.6 keeps it ([rollup/rollup#6551](https://github.com/rollup/rollup/pull/6551)).

`pnpm-workspace.yaml` pins rollup with `overrides`, because vite 5 accepts any `rollup@^4.20.0`. The `minimumReleaseAgeExclude` entries let pnpm 11+ install rollup 4.64.6 before it is one day old.

## Reproduction Steps

1. Install, build and start the app:
   ```sh
   $ pnpm install
   $ pnpm build
   $ pnpm start
   ```

2. Request the page:
   ```sh
   $ curl -i http://localhost:3000/
   HTTP/1.1 500 Internal Server Error
   ```
   The server logs:
   ```
   ReferenceError: $state is not defined
       at <instance_members_initializer> (build/server/chunks/stores-Dt54WMc1.js:28:19)
       at new Page (build/server/chunks/stores-Dt54WMc1.js:27:7)
   ```

3. Set `rollup: 4.64.5` in `pnpm-workspace.yaml` and run step 1 and 2 again:
   ```sh
   $ curl -i http://localhost:3000/
   HTTP/1.1 200 OK
   ```

Tested with Node v22.23.1, pnpm 12.3.4, @sveltejs/kit 2.70.3, svelte 4.2.20, vite 5.4.21 and @sveltejs/vite-plugin-svelte 3.1.2.
