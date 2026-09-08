# verify4-M-oak-deno-outgoingfetch

## What it re-tests

Independent re-test of the capability **outgoingfetch** of cell `M-oak-deno` (see `$REPRO/cells/M-oak-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration. Results for this cell and capability were recorded under the cell id, so the entries below may include the other independent attempt on the same capability.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app-b-nohook.log`, `app-base-static.log`, `app-baseline.log`, `app-fetchfix-static.log`, `app-fetchfix-stream.log`, `app-fix-static.log`, `app-fix-stream.log`, `app-nodehttp-static.log`, `app-nohook-static.log`, `app.pid`, `app1.pid`, `app2.pid`, `app3.pid`, `app4.pid`, `appb.pid`, `deno.json`, `deno.lock`, `fetch-integration.ts`, `instrument-b.ts`, `instrument-nohook.ts`, `instrument.ts`, `main-b.ts`, `main-nohook.ts`, `main.ts`, `package-lock.json`, `package.json`, `rec.log`, `rec.pid`, `recorder.mjs`, `sink.log`, `sink.mjs`, `sink.pid`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

No result was recorded under this directory name or under the cell and capability. The logs in this directory are the only record.
