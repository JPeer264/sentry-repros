# QS-deno — plain Deno getting-started path, against SDK `develop`

SDK under test: `getsentry/sentry-javascript` @ `6f2da7483d` (v11 line, package version `10.67.0`),
installed from the prebuilt tarballs in `../../_toolbox/pack/`. Deno `2.9.0`, macOS 24.6.0.
All envelopes go to a local sink via the `tunnel` option; nothing leaves the machine.

## What it reproduces

A new user following the Deno path end to end: install `@sentry/deno`, write `main.ts` with
`import "@sentry/deno/import"` as the first line and `Sentry.init` below it, start `Deno.serve`, and
run the verify step. Two texts are followed side by side: the shipped guide
`~/dev/sentry-docs/docs/platforms/javascript/guides/deno/index.mdx` and the proposed quick start
`../../_reports/quick-starts.html`, section "Deno", steps 1 to 4.

The app is a plain `Deno.serve` handler with five routes:

| Route | What it does |
| --- | --- |
| `/users/:id` | `URLPattern` match, returns `Response.json({ id })` — the quick start's example route |
| `/debug-sentry` | throws `new Error("My first Sentry error!")` out of the handler |
| `/debug-span` | `Sentry.startSpan({op:"test", name:"My First Test Span"})` around an outgoing `fetch` to the sink's `/recorder`, which records the inbound `sentry-trace` / `baggage` headers |
| `/debug-log` | `Sentry.logger.info("hello from /debug-log", ...)` |
| `/sentinel` | `Sentry.captureMessage("sentinel")` — the run waits for this in the sink instead of sleeping |

Five run shapes are exercised as separate variants (`quickstart`, `guide-flags`,
`guide-flags-nohook`, `no-hook`, `import-flag`, `deno-serve`), each writing its own
`results-<variant>.json`.

## Install

```bash
cd /Users/janpeer/dev/sentry-runtime-audit-repros/quickstarts/deno
npm install     # package.json pins @sentry/deno to a tarball and overrides every transitive @sentry/*
```

The two documented install commands cannot be used against an unpublished build:

- The guide's specifier form, `import * as Sentry from "npm:@sentry/deno"`
  (`index.mdx:44` with `___SDK_PACKAGE___` = `npm:@sentry/deno`), **does** work once the tarballs sit
  in a local `node_modules`, because `nodeModulesDir` resolves `npm:` specifiers from there:

  ```
  $ deno run --allow-read=. --allow-env check-npm-specifier.ts
  resolved @sentry/deno 10.67.0
  ```

- The quick start's `deno add npm:@sentry/deno` (`quick-starts.html:156`) would pull `10.73.0` from the
  registry, which is exactly what this audit must not test, so it was not run. `deno.json` carries the
  same import map the quick start shows (`quick-starts.html:158-163`), with
  `"nodeModulesDir": "manual"` instead of `"auto"` so that Deno uses the npm-installed tree verbatim.
  `package.json` needs an `overrides` block, because npm otherwise resolves the tarballs' transitive
  `@sentry/*@10.67.0` deps against the registry. This is a harness artifact, not a defect in the guide.

Installed tree (`node_modules/@sentry`): `core deno server-runtime-injection server-utils`, all
`10.67.0` from `file:../../_toolbox/pack/…`, plus `@sentry/conventions@0.20.0` from the registry as a
normal published dependency. No `@sentry/*` SDK package came from the registry.

## Run

```bash
cd /Users/janpeer/dev/sentry-runtime-audit-repros/quickstarts/deno
./run.sh quickstart          # deno run --allow-net --allow-env --allow-read=. --allow-sys=hostname,osRelease main.ts
./run.sh guide-flags         # deno run --no-prompt --allow-net main.ts            (index.mdx flags only)
./run.sh guide-flags-nohook  # deno run --no-prompt --allow-net main-no-hook.ts
./run.sh no-hook             # quick start flags, entry without the `@sentry/deno/import` line
./run.sh import-flag         # --import=./node_modules/@sentry/deno/build/import.mjs instead of the first line
./run.sh deno-serve          # deno serve ... serve.ts  (export default { fetch })
```

Each run starts the sink on `127.0.0.1:44219`, starts one app on `127.0.0.1:44220`, curls the five
routes, polls `/__items` until the sentinel event, the sentinel's server span and the timer-flushed log
batch have all arrived, writes `results-<variant>.json` (sink items + raw span and event payloads + the
headers the recorder saw) and kills both processes. Init debug output is in `app-<variant>.log`.

## Expected

What the shipped guide claims:

- `index.mdx:38` — "Import the Sentry Deno SDK directly from the npm registry, before importing any other modules".
- `index.mdx:44` — `import * as Sentry from "___SDK_PACKAGE___";` (`npm:@sentry/deno`).
- `index.mdx:60` — "Initialize Sentry as early as possible in your app", with the `Sentry.init({ dsn, tracesSampleRate: 1.0 })` snippet at `index.mdx:69-81`.
- `index.mdx:94` / `index.mdx:100` — "To make sure the SDK can send events, enable network access for your Sentry ingestion domain": `deno run --allow-net=___ORG_INGEST_DOMAIN___ index.ts`.
- `index.mdx:113` / `index.mdx:119` — "Grant read access to your source files so that the SDK can include your source code in stack traces": `deno run --allow-read=./src index.ts`.
- `index.mdx:149-157` — verify errors with `try { foo() } catch (e) { Sentry.captureException(e) }`.
- `index.mdx:176-190` — verify tracing with `Sentry.startSpan({ op: "test", name: "My First Test Transaction" }, …)`.
- `index.mdx:207` — "head over to your project on Sentry.io to view the collected data".
- `platform-includes/getting-started-prerequisites/javascript.deno.mdx:7` — "Deno version >= `2.0.0`".
- The guide names **no other permission flag**: no `--allow-env`, no `--allow-sys`, and nothing about `@sentry/deno/import`.

What the proposed quick start claims (`../../_reports/quick-starts.html`):

- `:156` — `deno add npm:@sentry/deno`.
- `:157` — "Add `nodeModulesDir` to `deno.json`. The library instrumentation in step 3 rewrites packages while they load, and it only sees packages that live in a local `node_modules` directory, not in Deno's global npm cache."
- `:165-166` — "The first import registers the library instrumentation hook (step 3); it has to be the first import of the program" / `import "@sentry/deno/import";`.
- `:181` — `deno run --allow-net --allow-env --allow-read=. --allow-sys=hostname,osRelease main.ts`.
- `:182` — flag table: `--allow-env` "Required by the first-line `@sentry/deno/import` hook, which exits with `NotCapable: Requires env access` without it"; `--allow-read=.` "Source lines in stack traces and `app://` paths instead of absolute file paths"; `--allow-sys=hostname,osRelease` "`server_name` and the OS version on events".
- `:183` — "Without a flag the SDK skips that feature silently, with no warning and no permission prompt."
- `:184` — "The same applies to `deno serve`: `export default { fetch }` is instrumented like `Deno.serve`".
- `:186` — "An `http.server` span per `Deno.serve` request, named by HTTP method. `Deno.serve` has no router, so route names come from a framework."
- `:187` — "Outgoing `fetch()` calls record a breadcrumb only. They do not get a span and do not carry trace headers yet."
- `:201` — "If you forget the import, the SDK still installs the integrations and records nothing for those libraries, without a warning."
- `:396` (verification table) — "`--import=@sentry/deno/import` (bare specifier) does not resolve".

## Observed on 2026-09-08

### Step 1 — Install

`npm install` of the tarball plus overrides: `added 6 packages, and audited 7 packages in 1s`, no peer
or version complaints. The guide's `npm:@sentry/deno` specifier resolves to the local `10.67.0` build
(`check-npm-specifier.ts`, output quoted under **Install**). **Holds** for the specifier form; the
quick start's `deno add` form was not run against the registry on purpose.

### Step 2 — Configure

`main.ts` is the quick start's file split into three modules so the variants can share it:

```ts
import "@sentry/deno/import";
import "./init.ts";
import { handler } from "./routes.ts";
import { APP_PORT } from "./config.ts";

Deno.serve({ port: APP_PORT, hostname: "127.0.0.1" }, handler);
```

`init.ts` is the quick start's `Sentry.init` verbatim plus `tunnel` (to reach the local sink) and
`debug: true`. The app started with no warning and no permission prompt. **Holds.**

### Step 3 — Verify (variant `quickstart`, `results-quickstart.json`)

Command:

```
deno run --allow-net --allow-env --allow-read=. --allow-sys=hostname,osRelease main.ts
```

Error event, verbatim and trimmed from `/__items`:

```json
{"type":"event","exception":"Error: My first Sentry error!","mechanism":"auto.http.deno","handled":false,
 "sdk":"sentry.javascript.deno","sdk_version":"10.67.0","runtime":"deno","runtime_version":"2.9.0",
 "hasContextLine":true,"server_name":"DJ90J9R5XC.local","os":"macOS 24.6.0","hasAppFrame":true,
 "appFrames":[{"filename":"app:///routes.ts","context_line":"    throw new Error(\"My first Sentry error!\");"}],
 "trace_id":"0d4af291194844128517ab130537d344",
 "request":{"url":"http://127.0.0.1:44220/debug-sentry","method":"GET","hasData":false,
            "headers":{"accept":"*/*","host":"127.0.0.1:44220","user-agent":"curl/8.7.1"}},
 "environment":"production"}
```

`mechanism` is `auto.http.deno` with `handled: false` (the throw escapes the `Deno.serve` handler),
context lines are present, the in-app frame path is `app:///routes.ts`, `server_name` and
`os 24.6.0` are set. **`transaction` is absent from every event** — the compact mapping shows
`tx=undefined`, and the raw payload has no `transaction` key at all.

Server spans — one `span` envelope per request, **envelope item type `span`, no `transaction` envelope
was sent for any route** (`sentry.trace_lifecycle = "stream"`):

```json
{"type":"span","trace_id":"…","items":["http.server GET"],
 "raw":[{"name":"GET","op":"http.server","status":"ok","is_segment":true,"origin":"auto.http.deno",
         "url":"http://127.0.0.1:44220/users/42"}]}
{"type":"span","items":["http.server GET"],
 "raw":[{"name":"GET","op":"http.server","status":"ok","is_segment":true,"origin":"auto.http.deno",
         "url":"http://127.0.0.1:44220/debug-sentry"}]}
{"type":"span","items":["http.server GET"],
 "raw":[{"name":"GET","op":"http.server","status":"ok","is_segment":true,"origin":"auto.http.deno",
         "url":"http://127.0.0.1:44220/debug-log"}]}
{"type":"span","items":["http.server GET"],
 "raw":[{"name":"GET","op":"http.server","status":"ok","is_segment":true,"origin":"auto.http.deno",
         "url":"http://127.0.0.1:44220/sentinel"}]}
```

Every route, `/users/:id` included, is named `GET`; the segment attributes are
`"sentry.segment.name": "GET"` and `"sentry.segment.name.source": "url"`. The readiness probe on
`/nope` produced a sixth span with `"status":"error"`.

`/debug-span` — the manual span and the server span arrive in one envelope, and **there is no
`http.client` span at all**:

```json
_The block below is quoted from an earlier run of the same variant; the shipped `results-quickstart.json` carries the same envelope shape under trace `d048e15b956b4204b51de02aa7c26964`._

{"type":"span","trace_id":"983e6dd9d6e940e1bbd0ffff8e292360",
 "items":["test My First Test Span","http.server GET"],
 "raw":[{"name":"My First Test Span","op":"test","status":"ok","parent_span_id":"b506e46cc229da49",
         "is_segment":false,"origin":"manual"},
        {"name":"GET","op":"http.server","status":"ok","is_segment":true,"origin":"auto.http.deno",
         "url":"http://127.0.0.1:44220/debug-span"}]}
```

The recorder saw no propagation headers on the outgoing `fetch` (`/__headers`):

```json
[{"url":"/recorder?from=debug-span","sentry-trace":null,"baggage":null,"traceparent":null}]
```

Log item:

```json
{"type":"log","items":["info: hello from /debug-log"]}
```

Sentinel (`captureMessage` ships a synthetic stack trace, `attachStacktrace` on by default):

```json
{"type":"event","message":"sentinel","exception":"undefined: sentinel","mechanism":"generic","handled":true,
 "sdk":"sentry.javascript.deno","sdk_version":"10.67.0","runtime":"deno","runtime_version":"2.9.0",
 "hasContextLine":true,"server_name":"DJ90J9R5XC.local","os":"macOS 24.6.0","hasAppFrame":true,
 "appFrames":[{"filename":"app:///routes.ts","context_line":"    Sentry.captureMessage(\"sentinel\");"}]}
```

Item types in the run, in order: `event event span span span span span span log`.

### Step 4 — Variants

**(a) The guide's documented flags only — `deno run --no-prompt --allow-net main.ts`**
(`results-guide-flags.json`, `app-guide-flags.log`). The app never starts:

```
error: Uncaught (in promise) NotCapable: Requires env access, run again with the --allow-env flag
    at Object.toObject (ext:deno_os/30_os.js:133:12)
    at Object.ownKeys (ext:deno_node/_process/process.ts:83:42)
    at file:///…/node_modules/@sentry/server-runtime-injection/build/esm/vendored/debug/src/node.js:124:30
```

`results-guide-flags.json` has `"items": []`. The guide's flag set (`index.mdx:100`, `index.mdx:119`)
is not enough to run the quick start's `main.ts`, and the crash comes from the vendored `debug`
package inside `@sentry/server-runtime-injection` reading `process.env` at module load, not from a
Sentry check with a readable message.

Same flags without the hook line (`guide-flags-nohook`, `main-no-hook.ts`) does run, and shows exactly
what the missing flags cost. Verbatim from `/__items`:

```json
{"type":"event","exception":"Error: My first Sentry error!","mechanism":"auto.http.deno","handled":false,
 "sdk":"sentry.javascript.deno","sdk_version":"10.67.0","runtime":"deno","runtime_version":"2.9.0",
 "hasContextLine":false,"os":"macOS undefined","hasAppFrame":false,
 "appFrames":[{"filename":"/Users/janpeer/dev/sentry-runtime-audit-repros/quickstarts/deno/routes.ts"}],
 "request":{"url":"http://127.0.0.1:44220/debug-sentry","method":"GET",…}}
```

Missing: `server_name` (absent from the payload), `os.version` (raw `contexts.os` is `{"name":"macOS"}`),
context lines (`hasContextLine:false`), `app://` frame paths (absolute filesystem paths instead).
Everything else still worked: 6 `span` envelopes, the manual span, the log item, 39 integrations.
**Nothing warns** — the debug output contains no message about a missing permission, which is what
`quick-starts.html:183` says.

**(b) Without the `@sentry/deno/import` first line** (`no-hook`, `results-no-hook.json`). Init works and
the item set is identical to `quickstart`: same two events, same six `span` envelopes with the same
names, same log item, same 39 integrations, same missing `http.client` span and headers. Nothing in
`app-no-hook.log` mentions the hook, library instrumentation, or a degraded mode:

```
$ grep -iE "warn|not instrumented|hook" app-no-hook.log
(no output)
```

The integration list is the same with and without the hook — `Express Fastify Hapi Koa Mysql …` are all
reported "installed", and the debug log even says `[instrumentation:mysql] Bun/Deno, subscribing
eagerly` in both runs. This reproduction ships no database or framework dependency, so it does not
show the span difference itself; it confirms the silence claim at `quick-starts.html:201`.

**(c) `--import=./node_modules/@sentry/deno/build/import.mjs` instead of the first line**
(`import-flag`, `results-import-flag.json`). Works; byte-identical item shapes to `quickstart`.
The bare specifier form still does not resolve, as the verification table says (`:396`):

```
$ deno run --allow-net --allow-env --allow-read=. --allow-sys=hostname,osRelease --import=@sentry/deno/import main-no-hook.ts
error: Could not find a matching package for 'npm:@sentry/deno' in the node_modules directory.
```

**(d) `deno serve` with `export default { fetch }`** (`deno-serve`, `results-deno-serve.json`).
`deno serve --allow-net --allow-env --allow-read=. --allow-sys=hostname,osRelease --port 44220 --host 127.0.0.1 serve.ts`
starts (`deno serve: Listening on http://127.0.0.1:44220/`) and one request cycle produces the same
items as `Deno.serve`: error event with `mechanism auto.http.deno / handled false`, six `http.server GET`
span envelopes, the manual `test My First Test Span` child, the log item, no `http.client` span, no
propagation headers.

### Step 5 — Init debug output

`debug: true` prints **no SDK name, no SDK version, no runtime name and no runtime version** — there is
no "Initializing Sentry" banner at all on Deno. Those values had to be read off the envelopes:
`sdk` `sentry.javascript.deno`, `sdk_version` `10.67.0`, `runtime` `deno`, `runtime_version` `2.9.0`
(also on the spans as `sentry.sdk.name` / `sentry.sdk.version` and
`process.runtime.engine.version` `14.9.207.2-rusty`).

The debug output is `Integration installed: <name>` lines plus per-library subscription lines:

```
Sentry Logger [log]: Integration installed: EventFilters
…
Sentry Logger [log]: [instrumentation:mysql] Bun/Deno, subscribing eagerly
Sentry Logger [log]: [instrumentation:mysql] subscribing to channels
```

**39 integrations installed**, identical in every variant that boots:

```
EventFilters RequestData FunctionToString LinkedErrors Dedupe Breadcrumbs DenoContext DenoServe DenoHttp
ContextLines NormalizePaths GlobalHandlers Express Fastify Hapi Koa Graphql Mongo Mongoose Mysql Mysql2
Redis Postgres Prisma Tedious GenericPool Kafka Amqplib LruMemoizer Aws LangChain LangGraph VercelAI
OpenAI Anthropic_AI Google_GenAI PostgresJs Firebase SpanStreaming
```

### Does each claim hold on develop?

| Claim | Verdict |
| --- | --- |
| `npm:@sentry/deno` specifier, imported before other modules (`index.mdx:38-44`) | **yes** — resolves to the local build, SDK initializes |
| `Sentry.init({ dsn, tracesSampleRate: 1.0 })` as early as possible (`index.mdx:60-81`) | **yes** |
| `deno run --allow-net=<ingest> index.ts` is enough to send events (`index.mdx:100`) | **no** — the quick start's `main.ts` dies with `NotCapable: Requires env access`; even without the hook line, `--allow-net` alone silently drops `server_name`, the OS version, context lines and `app://` paths |
| `--allow-read=./src` gives source code in stack traces (`index.mdx:119`) | **partial** — read access is what unlocks context lines, but the path has to cover the entry file and the working directory; the guide never mentions `--allow-env` or `--allow-sys`, which the SDK also uses |
| `try/catch` + `captureException` produces an issue (`index.mdx:149-157`) | **yes** — plus an uncaught throw out of a `Deno.serve` handler is captured as `auto.http.deno` / `handled: false` |
| `Sentry.startSpan({op:"test", name:"My First Test Transaction"})` produces a trace (`index.mdx:176-190`) | **partial** — the span ships in a `span` envelope as a child of the `http.server` segment; no `transaction` envelope is sent on develop's default `traceLifecycle: 'stream'`, and the guide's "Transaction" wording no longer matches |
| Captured data shows up as named transactions (`index.mdx:207`) | **partial** — every server span is named `GET` with `sentry.segment.name.source: "url"`, and events carry no `transaction` field at all |
| Deno `>= 2.0.0` (`javascript.deno.mdx:7`) | **not tested** — only Deno 2.9.0 was available |
| `nodeModulesDir` in `deno.json` (`quick-starts.html:157`) | **yes** — `"manual"` with an npm-installed tree works; the `npm:` specifiers resolve from it |
| `import "@sentry/deno/import"` must be the first import (`quick-starts.html:165-166`) | **yes** for placement; the line itself changed nothing in this app, which has no instrumented library |
| The quick start's four-flag command runs the app (`quick-starts.html:181`) | **yes** |
| `--allow-env` required by the hook, `NotCapable: Requires env access` without it (`quick-starts.html:182`) | **yes** — verbatim error reproduced |
| `--allow-read=.` gives source lines and `app://` paths (`quick-starts.html:182`) | **yes** — `app:///routes.ts` with `context_line` present; absolute paths and no context lines without it |
| `--allow-sys=hostname,osRelease` gives `server_name` and the OS version (`quick-starts.html:182`) | **yes** — `server_name: "DJ90J9R5XC.local"`, `os: macOS 24.6.0` with the flag; both absent without it |
| A missing flag is skipped silently, no warning, no prompt (`quick-starts.html:183`) | **yes** for `--allow-sys` and `--allow-read`; **no** for `--allow-env`, which is a hard crash, not a silent skip |
| `deno serve` with `export default { fetch }` is instrumented like `Deno.serve` (`quick-starts.html:184`) | **yes** |
| One `http.server` span per request, named by HTTP method (`quick-starts.html:186`) | **yes** — `GET` for all five routes including `/users/:id` |
| Outgoing `fetch()` gets no span and no trace headers (`quick-starts.html:187`) | **yes** — no `http.client` item, and the recorder saw `sentry-trace: null`, `baggage: null` |
| Forgetting the hook import warns about nothing (`quick-starts.html:201`) | **yes** — identical integration list, no warning line |
| Bare `--import=@sentry/deno/import` does not resolve (`quick-starts.html:396`) | **yes**; the `./node_modules/@sentry/deno/build/import.mjs` path form does |

## Files

`deno.json`, `package.json`, `config.ts`, `init.ts`, `routes.ts`, `main.ts`, `main-no-hook.ts`,
`serve.ts`, `check-npm-specifier.ts`, `run.sh`, and `sink.mjs` (a copy of `../../_toolbox/sink.mjs` by
way of `../node/sink.mjs`, extended with `sdk_version`, `runtime_version`, span `op`/`url`/`source`,
a `/recorder` endpoint that records inbound propagation headers, `/__headers`, and — added here —
`server_name`, `os`, `hasAppFrame` and the in-app frames on events).

`node_modules` is removed after the run; the **Install** line restores it.
