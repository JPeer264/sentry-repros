`guides/deno/index.mdx:106` shows `deno run --allow-net=<ingest> index.ts` and `:125` shows `deno run --allow-read=./src index.ts` as two separate commands, while the init snippets on the same page name the file `main.ts`. Neither `--allow-env` nor `--allow-sys` is mentioned, and `packages/deno/README.md` mentions no flag at all.

What was observed on deno 2.9.0: with only `--allow-net` and `--no-prompt`, events carry `server_name: null`, no OS version, an absolute filesystem path as the frame filename and no context lines. With the `@sentry/deno/import` hook line present, the same flags do not degrade but crash: `NotCapable: Requires env access, run again with the --allow-env flag`, raised from the vendored `debug` package inside `@sentry/server-runtime-injection` at module load (getting-started reproduction QS-deno, 2026-09-08). With all permissions granted, the same app reports the hostname, the OS version, an `app:///`-prefixed filename and context lines. No warning is printed in the restricted run. Every Deno e2e app runs with `--allow-net --allow-env --allow-read`, and the docker-backed ones add `--allow-sys`.

What to change:

- Replace the two commands at `:106` and `:125` with a single `deno run --allow-net=<ingest> --allow-read --allow-env --allow-sys main.ts`, using the same filename as the init snippets.
- Add a table naming what each flag unlocks: `--allow-net` event delivery, `--allow-read` source context lines and app-relative frame paths, `--allow-env` `SENTRY_*` lookups and `serverName`, `--allow-sys` hostname and OS version.
- Add the same table to `packages/deno/README.md`.

---

_From the runtime docs audit of September 2026, item DOC-D3, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._
