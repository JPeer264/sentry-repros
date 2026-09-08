# Errata for the deep probe report

Corrections found by the verification pass of 2026-09-08 that apply to the published deep probe report (`deep-probe-report.html`). The report page itself is not regenerated; read these next to it.

## Capability matrix, Bun column

- Row "Server span naming": the citation [B03] is wrong. B03 never uses `Bun.serve({ routes })` and its develop spans are named bare `GET`. The parameterized-name evidence is in B11 (`GET /hello/:name`, `origin: auto.http.bun.serve`), B09, B17 and B19. Add: under the default stream lifecycle a plain `Bun.serve` fetch handler produces method-only span names.
- Row "Handler error captured with request context", the `Bun.serve` half: cite B05 or B09, whose routes throw and whose events carry `request.url`. B03 calls `captureException` inside the handler and never throws.
- Row "Release health sessions", and finding F36: the clause "manual `startSession`/`captureSession` per request works" comes from a verification run that is not in the shipped probe B05. Treat it as record-only. That run also recorded a caveat the report drops: the manual sessions come out as `exited` with `errors: 0` even when the request captured an exception.

## Findings

- F4 (streaming on `Bun.serve`): the `node:http` comparison (907 ms full, 305 ms on abort) and the `startSpanManual` workaround come from the verification directory, not from the shipped probe B10. Record-only. The shipped `/stream` route records a 1 ms span (2 ms in the original run); "records a 0 ms span" is exact only for `/stream-cancel`.
- F11 (short-lived scripts): the `Sentry.close(2000).then(() => process.exit())` and `process.exitCode = n` variants have no file in the shipped probe B08. Record-only.
- F15 (NestJS on Bun): "once `@sentry/nestjs` is bundled together with the app" names a configuration that the shipped probe B14 does not contain. B14's variant that bundles `@sentry/nestjs` while leaving `@sentry/bun`, `core`, `node` and `server-utils` external does not boot (`ReferenceError: node is not defined`). The working shape in the record is "no `@sentry/*` package external at all" (a verification run with NestJS 12.0.1 and express 5.2.1); the working shape in the shipped probe is `build4` (everything `@sentry/*` external except `@sentry/nestjs/setup`).
- Docs coverage line for B17 ("mysql2 spans appear only when bundled"): probe B17 ships no unbundled control leg; the plain-run contrast is in B19 and in the `No diagnostics-channel injection detected` warning of B16.
- X02: the log files are named `log-bun140-*.txt` but were produced with Bun 1.4.2, as the README says.

## Probes whose sink output was not persisted

B07, B08, B18 and N7 print their sink dumps to the terminal; the README's Observed section carries the lines, the directory does not. B06 and B07 were re-run on 2026-09-08 and matched.
