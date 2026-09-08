# verify4-M-nuxt-deno-isolation

## What it re-tests

Independent re-test of the capability **isolation** of cell `M-nuxt-deno` (see `$REPRO/cells/M-nuxt-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration. Results for this cell and capability were recorded under the cell id, so the entries below may include the other independent attempt on the same capability.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `RERUN.sh`, `alsr/`, `alstest/`, `alstest2/`, `app/`, `app-deno.log`, `app-deno.pid`, `app-node-clear.log`, `app-node-clear.pid`, `app-node-preset.log`, `app-node-preset.pid`, `app-node-preset2.log`, `app-node-preset2.pid`, `app-node-runtime.log`, `app-node-runtime.pid`, `build-deno.log`, `build-deno2.log`, `build-node-clear.log`, `build-node.log`, `install-nuxt.log`, `install-sentry.log`, `logmark.txt`, `out-deno-server/`, `run2-appA.log`, `run2-appA.pid`, `run2-sink.log`, `run2-sink.pid`, `run3-app.log`, `run3-app.pid`, `run3-build.log`, `run3-sink.log`, `run3-sink.pid`, `run3b-app.log`, `run3b-app.pid`, `run3b-items.json`, `sink.log`, `sink.pid`, `sink2.log`, `sink2.mjs`, `sink2.pid`, `uninstall-nitro.log`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

No result was recorded under this directory name or under the cell and capability. The logs in this directory are the only record.
