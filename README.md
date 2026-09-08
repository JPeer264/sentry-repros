# Runtime docs audit reproductions

Reproductions from the audit of the Sentry JavaScript SDK on Bun, Deno and Cloudflare Workers, September 2026. Every probe, framework cell and refutation is a directory with a README: Install and Run, Expected (the recorded verdict) and Observed (what the run printed). The 37 rebuilt cells and the 68 probes have hand-written READMEs from the rebuild; the 14 cells kept from the original run and the 114 refutations have READMEs generated from their recorded results. [INDEX.md](INDEX.md) lists all of them with their rebuild status.

The SDK under test is `getsentry/sentry-javascript` at `6f2da7483d` (develop, v11 line, package version 10.67.0). The `npm pack` tarballs of that build are in `_toolbox/pack/`, so a reproduction pins the audited commit without a checkout.

## Layout

| Directory | Content |
| --- | --- |
| `probes/<ID>/` | 68 runtime probes: B (Bun), D (Deno), C (Cloudflare), N (follow-ups), X (cross-checks) |
| `cells/M-<framework>-<runtime>/` | 51 framework cells, the full cross product of 17 frameworks and 3 runtimes |
| `refutations/verify4-*`, `verify5-*` | 114 independent re-tests, one per capability that a cell reported broken or partial |
| `_toolbox/` | `TOOLBOX.md` (rules and conventions the agents followed), `sink.mjs` (the envelope sink), `pack/` (the SDK tarballs) |
| `_records/` | the JSON records each rebuild was made from, the vendored results, and the index builder |
| `_reports/` | the deep probe report, the docs audit and the quick starts as HTML, plus the issue and ticket drafts under `issues/` |

## Running a reproduction

Three variables appear in the READMEs and logs:

- `$REPRO` is this repository. Set it once: `export REPRO=$(pwd)`.
- `$SDK` was the `sentry-javascript` worktree at `6f2da7483d`. Nothing needs it at run time; the tarballs replace it.
- `$SCRATCH` was the working directory of the audit session. It no longer exists; paths under it appear only in logs and recorded commands.

Prerequisites: Node 22 or later, bun 1.4.0, deno 2.9.0, wrangler 4.129 (installed per cell), and a MariaDB on `127.0.0.1:3307` with user `root`, no password, database `app` and table `users(id, name)` with two rows:

```sh
docker run -d --rm --name qs-mysql -p 127.0.0.1:3307:3306 -e MARIADB_ALLOW_EMPTY_ROOT_PASSWORD=1 -e MARIADB_DATABASE=app mariadb:11
docker exec qs-mysql mariadb -uroot app -e "CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(64)); INSERT INTO users VALUES (1,'Ada'),(2,'Linus');"
```

Then follow the Install and Run lines of the README in the directory. Every run starts the sink first, drives the app with curl, and prints the sink's `/__items` as the observed result. Run one reproduction at a time; several framework builds in parallel exhaust a laptop.

## Reports

`_reports/deep-probe-report.html`, `_reports/docs-audit.html` and `_reports/quick-starts.html` are complete pages; open them in a browser. `_reports/issues/P0/` holds the GitHub issue drafts for the P0 findings and `_reports/issues/linear/` the ticket drafts for the compatibility project, each with a preview page and the generator that built it.
