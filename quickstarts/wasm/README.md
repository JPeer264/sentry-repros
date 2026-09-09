# QS-wasm, the WebAssembly getting-started guide, against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `03aaf42455` (v11 line, package version `10.67.0`),
installed from the prebuilt tarballs in `../../_toolbox/pack-develop-03aaf424/`.

Google Chrome 153.0.8010.37 driven by `playwright-core` 1.55.0 (`chromium.launch({ channel: 'chrome',
headless: true })`, no browser download), `esbuild` 0.25.9, `wabt` 1.0.39 (assembles the `.wat`),
node v26.5.0, macOS (Darwin 24.6.0). All envelopes go to a local sink via the `tunnel` option; the DSN
is a placeholder and nothing leaves the machine.

## What it reproduces

A new user following the WebAssembly guide end to end: install `@sentry/browser` and `@sentry/wasm`,
paste the `Sentry.init` with `wasmIntegration()`, add a wasm function that traps, click the two
verify buttons. The guide is `docs/platforms/javascript/guides/wasm/index.mdx` (frontmatter
`sdk: sentry.javascript.wasm`). Its `<PlatformContent>` steps render from:

| Guide line | includePath | Renders from |
| --- | --- | --- |
| `index.mdx:18` | `getting-started-prerequisites` | `platform-includes/getting-started-prerequisites/javascript.wasm.mdx:1-6` |
| `index.mdx:108` | `getting-started-data-collection` | `platform-includes/getting-started-data-collection/javascript.mdx:1-29` (no `javascript.wasm.mdx`) |
| `index.mdx:143` | `getting-started-browser-sandbox-warning` | `platform-includes/getting-started-browser-sandbox-warning/javascript.mdx:1-5` (no `javascript.wasm.mdx`) |

The guide shows the wasm side in Rust (`index.mdx:127-133` and `202-212`). This run has no Rust
toolchain, so `src/divide.wat` holds the same two functions in the WebAssembly text format:
`divide(a, b)` is `i32.div_s` (traps with `divide by zero` when `b` is 0) and
`compute_intensive_function(iterations)` sums `0..iterations*1000`. `build.mjs` assembles it twice:

- `dist/divide.wasm` (205 bytes): the module as assembled, no custom sections beyond the name section.
- `dist/divide-buildid.wasm` (271 bytes): the same module plus a 16-byte `build_id` custom section and
  an `external_debug_info` section holding `divide.debug.wasm`, the two sections `@sentry/wasm` reads
  (`packages/wasm/src/registry.ts:17,29`). This is what `wasm-split` adds to a module; nothing in the
  guide's toolchain path adds them.

The page (`public/index.html`, or `public/errors-only.html` for the errors-only init) carries:

| Button | What it does |
| --- | --- |
| `Trigger WebAssembly error` | `index.mdx:148-152`, calls the guide's `testWasmError()` (`index.mdx:170-184`): `divide(10, 0)` in a `try/catch` with `Sentry.captureException(e)` |
| `Test WebAssembly with tracing` | `index.mdx:225-229`, calls the guide's `testWasmTracing()` (`index.mdx:242-259`): `Sentry.startSpan({ op: "test", name: "Example Span" }, ...)` around `compute_intensive_function(1000)` |
| `#btn-uncaught` | not in the guide: the same trap without the `try/catch`, so it reaches Sentry through the global `onerror` handler |
| `#btn-sentinel` | `Sentry.captureMessage("sentinel")` plus a `sentinel-span`; the run polls the sink for these instead of sleeping |

The guide's snippets offer two calling styles (`wasmModule.divide(10, 0)` "directly" or
`wasmModule.instance.exports.divide(10, 0)` "via WebAssembly API", `index.mdx:176-179`). The module
is loaded with the WebAssembly API here, so `public/buttons.js` keeps both lines and activates the
API one (`callStyles: {direct: false, api: true}` in every results file). The loader runs on
`DOMContentLoaded`, after the module-script bundle has run `Sentry.init`, as `index.mdx:65` asks
("initialize it ... before loading your WebAssembly modules"). Two loaders, picked by the page query:
`?load=streaming` is `WebAssembly.instantiateStreaming(fetch(url))`, `?load=bytes` is
`fetch(url)` + `arrayBuffer()` + `WebAssembly.instantiate(bytes)`.

## Install

```bash
cd $REPRO/quickstarts/wasm
npm install   # package.json pins every @sentry/* to a pack-develop-03aaf424 tarball
              # and repeats them in `overrides`
```

`index.mdx:44` says `npm install @sentry/browser @sentry/wasm --save`; here both come from the toolbox
tarballs. `package.json` needs the `overrides` block because the wasm tarball depends on
`@sentry/browser@10.67.0` and `@sentry/core@10.67.0`, which npm would otherwise resolve against the
registry. Installed tree (`node_modules/@sentry`): `browser browser-utils core feedback replay
replay-canvas wasm`, all `10.67.0` from `file:../../_toolbox/pack-develop-03aaf424/...`, plus
`@sentry/conventions@0.20.0` from the registry as a normal published dependency. No `@sentry/*` SDK
package came from the registry (`package-lock.json` has no `https://` `resolved` entry under
`@sentry/` other than `conventions`). `esbuild`, `playwright-core` and `wabt` come from the registry
as tooling.

## Run

```bash
cd $REPRO/quickstarts/wasm
./run.sh npm          # the guide verbatim (error monitoring + tracing), dist/divide.wasm, streaming loader
./run.sh build-id     # same page and bundle, dist/divide-buildid.wasm, streaming loader
./run.sh bytes        # dist/divide-buildid.wasm through fetch().arrayBuffer() + WebAssembly.instantiate(bytes)
./run.sh errors-only  # the guide with only error monitoring selected, dist/divide-buildid.wasm, streaming loader
```

Each run assembles the two modules and builds the variant's esbuild ESM bundle (`src/app-npm.js` for
the first three, `src/app-errors.js` for the last), refuses to start if port 4734 is taken, starts the
sink and static server on `[::]:4734`, drives one headless Chrome through the buttons, polls
`/__items` until the sentinel event (and, with tracing, the sentinel span and the pageload span) has
arrived, and writes `results-<variant>.json`: the docs lines behind each step, the timed `steps`,
the SDK metadata read from the client (`meta`), the console, a `summary` of every envelope item, the
`checks`, a computed `verdict`, the compact sink items and the raw envelope payloads. Every wait is a
poll against one hard deadline of 60 seconds per variant; `run.sh` also wraps the driver in
`timeout 110`. The browser console for a variant is in `app-<variant>.log`, the sink's own output in
`sink-<variant>.log`.

## Expected

Quoted from the guide and the includes it renders.

**Install**

- `index.mdx:44`: `npm install @sentry/browser @sentry/wasm --save`.

**Configure**

- `index.mdx:65`: "initialize it in your application's entry point before loading your WebAssembly
  modules. Sentry's Wasm integration enhances the Browser SDK and allows it to provide more detailed
  debug information for WebAssembly modules, including Debug IDs, Debug Files, Code IDs, Code Files
  and memory addresses."
- `index.mdx:70-100`: `import { wasmIntegration } from "@sentry/wasm"`, `sendDefaultPii: true`,
  `integrations: [Sentry.browserTracingIntegration(), wasmIntegration()]`, `tracesSampleRate: 1.0`,
  `tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/]`. With only
  error monitoring selected the `performance` blocks drop out and `integrations` is
  `[wasmIntegration()]`. No `release` in either rendering.
- `platform-includes/getting-started-data-collection/javascript.mdx:5-11`: the `dataCollection`
  option (not exercised here, the browser run covers this shared include).

**Verify**

- `index.mdx:120`: "add a function to your WebAssembly module that you can then call to cause an error
  (for example, division by zero)"; Rust `divide` at `index.mdx:127-133`.
- `index.mdx:148-152` and `170-184`: the button and `testWasmError()`, `Sentry.captureException(e)`
  inside the `catch`.
- `index.mdx:197-259`: `compute_intensive_function`, the second button, and `testWasmTracing()`
  which "wraps your WebAssembly function calls in a Sentry span to measure the execution time".
- `index.mdx:275`: "head over to your project on Sentry.io to view the collected data".

The page never mentions `wasm-split`, `build_id` custom sections, DWARF, debug file upload, source
maps or the `wasm://wasm/<hash>` naming; the only symbolication claim is the sentence at line 65.

## Observed

Common to every variant (`meta` and `summary.sdk` in each results file): `Sentry.init` runs before the
wasm load, `sdk.name` `sentry.javascript.browser`, `sdk.version` `10.67.0`, `sdk.packages`
`[npm:@sentry/browser 10.67.0]` (`@sentry/wasm` does not add a package entry). Installed integrations
with tracing: `EventFilters, FunctionToString, ConversationId, BrowserApiErrors, Breadcrumbs,
GlobalHandlers, LinkedErrors, Dedupe, HttpContext, CultureContext, BrowserSession, BrowserTracing,
Wasm, SpanStreaming, WebVitals`; errors-only: the same minus `BrowserTracing`, `SpanStreaming`,
`WebVitals`. `traceLifecycle` is `stream`, so tracing arrives as `span` envelope items, not
`transaction`. The console shows `Integration installed: Wasm`, one `Captured error event 'divide by
zero'` per trap, `Result: 1783293664` from `testWasmTracing` (the i32 sum wraps), and, once per
captured event, `Discarded session because of missing or non-string release` (the guide's init has no
`release`, so no `session` item is ever sent). One `pageerror` per run: the uncaught trap.

Every trap arrives as `RuntimeError: divide by zero` with three frames: `HTMLButtonElement.onclick`
(the page), `testWasmError` (`buttons.js`, or `testWasmErrorUncaught`), and the wasm frame. The
caught one has `mechanism.type` `generic`, `handled: true`; the uncaught one
`auto.browser.global_handlers.onerror`, `handled: false`. Both get the same wasm treatment.

| Variant | Module | Loader | Wasm frame | `debug_meta.images` | Status |
| --- | --- | --- | --- | --- | --- |
| `npm` | `divide.wasm`, no `build_id` | streaming | `function: divide`, `filename: http://localhost:4734/divide.wasm`, `instruction_addr: 0x4d`, `platform: native`, `in_app: true`, **no `addr_mode`** | **absent** | partial |
| `build-id` | `divide-buildid.wasm` | streaming | as above plus `addr_mode: rel:0` | `[{type: wasm, code_id: 0123456789abcdef1032547698badcfe, code_file: http://localhost:4734/divide-buildid.wasm, debug_file: http://localhost:4734/divide.debug.wasm, debug_id: 0123456789abcdef1032547698badcfe0}]` | works |
| `bytes` | `divide-buildid.wasm` | `instantiate(bytes)` | `filename: wasm://wasm/609a33c2`, `instruction_addr: 0x4d`, `platform: native`, **no `addr_mode`** | **absent** | partial |
| `errors-only` | `divide-buildid.wasm` | streaming | as `build-id` | as `build-id` | works |

Tracing (`npm`, `build-id`, `bytes`): the `Example Span` (`op: test`, `origin: manual`, `status: ok`)
and the `sentinel-span` arrive as children of the `pageload` segment (the click lands inside the
pageload idle span), in one span envelope with 16 spans; `Sentry.startSpan` around the wasm call works
as `index.mdx:237` says. `errors-only`: three `event` items, no `span` item, the `startSpan` calls
are no-ops.

## Findings

1. **P1, docs wrong**, `index.mdx:65`. The page promises "Debug IDs, Debug Files, Code IDs, Code Files
   and memory addresses". With a module that has no `build_id` custom section the build sends memory
   addresses only: `results-npm.json` has the wasm frame with `instruction_addr` and
   `platform: native`, but no `addr_mode`, and the event has no `debug_meta` at all.
   `registry.ts:43-47` returns before registering an image when `build_id` is missing, and
   `index.ts:126-133` sets `addr_mode` only for a registered image. The guide's Rust snippets and
   `npm install` step never produce that section (it is what `wasm-split` writes), and the page does
   not mention `wasm-split`, debug files or DWARF anywhere. `results-build-id.json` shows the full
   promise being kept once the section exists. Docs-side fix: state at line 65 that the module needs
   a `build_id` custom section (`wasm-split`) and that the DWARF debug file must be uploaded, with a
   link to the debug files docs.
2. **P2, SDK limit**, `index.mdx:160,176-179` ("access it through the WebAssembly API"). Loading the
   module with `WebAssembly.instantiate(bytes)` after `fetch().arrayBuffer()` (the path every
   environment without `instantiateStreaming` takes) leaves the frame named `wasm://wasm/609a33c2`
   in Chrome (`results-bytes.json`), so it never matches the image the integration registered under
   the fetch URL: no `addr_mode`, no `debug_meta`, even with `build_id` present. Docs-side fix: say
   that symbolication needs the module loaded with `instantiateStreaming` or `compileStreaming` (or
   any loader that keeps the URL as the module's script name).
3. **P2, SDK limit**, `index.mdx:70-100`. The init snippet has no `release`; every captured event logs
   `Discarded session because of missing or non-string release` and no `session` envelope item is
   sent in any variant, so release health stays empty. The browser getting-started snippet carries a
   `release` line; this one does not. Docs-side fix: add the `release` line (or a sentence that
   sessions need it).

Not findings, but worth knowing: `debug_id` is emitted as the 32 hex digits of `build_id` plus a
trailing `0` (`0123456789abcdef1032547698badcfe0`, 33 characters, no dashes); whether Sentry's
ingestion accepts that shape was not checked here. The uncaught trap (not in the guide) is treated
exactly like the caught one. `captureMessage("sentinel")` arrives with an `exception.values[0]`
carrying `value: sentinel`, a one-frame stacktrace and `mechanism.synthetic: true` in every variant.

## Files

- `package.json`, `package-lock.json`: the pinned install.
- `src/divide.wat`: the guide's two functions in wat. `src/app-npm.js`, `src/app-errors.js`: the two
  renderings of `index.mdx:70-100` plus `tunnel` and `debug: true`.
- `public/index.html`, `public/errors-only.html`, `public/buttons.js`: the pages, the guide's buttons
  and verify functions, the loader and the sentinel.
- `build.mjs`, `sink.mjs`, `drive.mjs`, `run.sh`: the harness.
- `results-{npm,build-id,bytes,errors-only}.json`, `app-*.log`, `sink-*.log`: the evidence.
- `dist/`, `node_modules/`: left in place.
