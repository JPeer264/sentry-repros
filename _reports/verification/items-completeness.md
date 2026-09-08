# Docs audit: re-check of 18 items (DOC-R*)

Checked on 2026-09-08 against:

- docs: `/Users/janpeer/dev/sentry-docs` at master `aebda0ee4`
- SDK as audited: worktree `/Users/janpeer/dev/sentry-worktrees/audit-runtime-docs` at `6f2da7483d`
- SDK today: develop head `03aaf42455` (full tree extracted from the GitHub tarball, so
  "appears nowhere in packages/*/src" claims were verified exhaustively, not by sampling)
- reproductions: `probes/D11` (DOC-R2), `probes/C01` + `quickstarts/cloudflare/results-waituntil.json`
  (DOC-R14), and, incidentally, `probes/C08`, `C10`, `N4`, `N8`, `C12` which corroborate R16, R19,
  R13, R17 and R18

## Result

| verdict | items |
| --- | --- |
| correct-and-open | R1, R2, R4, R5, R7, R8, R10, R11, R12, R13, R14, R15, R16, R17, R19, R20 (16) |
| partially-correct | R6, R18 (2) |
| correct-but-fixed-on-master | none |
| wrong | none |

No item was fixed on master. Every docs claim still holds today; four items cite lines that moved.

## Line drift on master

- **R13** the page moved: `guides/cloudflare/features/agents-sdk.mdx` ->
  `guides/cloudflare/agent-tracing/agents-sdk.mdx` (commit `2e707563c`). Claims now at `:11`, `:43`, `:45`.
- **R14** `guides/cloudflare/index.mdx` waitUntil section is `:376-424` (was `:372-420`), commit `4baeabd4f`.
- **R17** Deno run commands are `:100` and `:119` (were `:106`, `:125`), same commit.
- **R19** Pages setup section is `:161-205` (was `:161-201`); the snippet ref `:174` is still exact.

Everything else sits on the exact cited lines, including all thirteen R6 pages, both R8 tables, the
three R11 includes and all four R20 files.

## The two items that need editing before they ship

**R6** - the docs half is exact, but the SDK sentence "installs all thirteen ... in the Deno default
set" is wrong for `dataloader` and `knex`. `getTracingIntegrations()`
(`packages/server-utils/src/integrations/index.ts:31-58`) installs eleven of the thirteen plus
prisma; dataloader and knex are opt-in on Deno exactly as on Node, and
`packages/deno/src/index.ts:114-117` says so. The recommendation survives (all thirteen are usable on
Deno), but the body needs the correction, and every one of the thirteen pages carries an alert
"This integration only works in the Node.js and Bun runtimes" that has to change with the frontmatter.

**R18** - every checkable claim holds (both pages ungated, `@sentry/cloudflare` exports none of the
three, Bun `:33-35` and Deno `:87-89` export all three). The sentence "The audit verified the same
functions imported from `@sentry/core` work inside a `withSentry` handler" has no artifact in the
repro repo; `probes/C12` only proves the exports are missing and that no session envelope is ever
emitted. The plumbing exists (`CloudflareClient extends ServerRuntimeClient`, core
`captureSession`/`sendSession`), so the claim is plausible but untested - either re-run it or
recommend gating the section instead.

## Corrections worth carrying into the other 16 drafts

- **R20 is bigger than an import swap.** `SentrySampler` and `wrapSamplingDecision`, which the same
  snippets use, are gone too, on top of `SentryContextManager`, `SentrySpanProcessor`,
  `validateOpenTelemetrySetup` and `skipOpenTelemetrySetup`. `@sentry/opentelemetry` exports six
  symbols total. There is no custom-OTel-setup path left to document for Bun, so the item should
  delete the three includes (their only consumer is `opentelemetry/custom-setup.mdx`, at `:49`,
  `:80`, `:160` - page and includes all still exist on master) rather than rewrite them. Also,
  `enableOpenTelemetrySetup` already defaults to `false` on Bun, so the proposed replacement is a no-op.
- **R7 must be sequenced behind R20**: `custom-setup.mdx`'s body is built on the same removed symbols
  and there are no `javascript.deno` / `javascript.cloudflare` files under
  `platform-includes/performance/opentelemetry-setup/`.
- **R1** the Cloudflare include has a second "Opt in ..." sentence at `:35` (Workers) that the item
  misses, and master now contradicts itself: the new `migration/v10-to-v11/index.mdx` says at `:23`
  and `:198` that stream is the default.
- **R8** `nativeNodeFetchIntegration` still exists and is exported by `@sentry/node`; only Bun and
  Deno do not re-export it. The Deno table also needs the `Console` and `OnUnhandledRejection` rows
  pruned; the Bun table's Node-ish rows are all fine.
- **R10** three off-by-one SDK citations (`:70`, `:73-76`, `:55`).
- **R14** "verified on both trace lifecycles" overstates the artifacts: the recorded error evidence
  is stream-mode only (C14 covers both lifecycles, but for spans). The source argument is
  lifecycle-independent, so make that the argument.
- **R16** cite the implementation (`instrumentations/instrumentDurableObjectHandlers.ts:44,66,85,102,119`)
  rather than the JSDoc, and separate span *origin* from error *mechanism*.
- **R19** "span and transaction" should be "span" - the probe ran the stream default.

Per-item detail, including decisive source lines and the exact edits, is in `items-completeness.json`.
