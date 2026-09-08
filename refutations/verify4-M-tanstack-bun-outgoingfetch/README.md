# verify4-M-tanstack-bun-outgoingfetch

## What it re-tests

Independent re-test of the capability **outgoingfetch** of cell `M-tanstack-bun` (see `$REPRO/cells/M-tanstack-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration. Results for this cell and capability were recorded under the cell id, so the entries below may include the other independent attempt on the same capability.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `app-baseline.log`, `app-bunall-static-b1314.log`, `app-bunall-static.log`, `app-bunall-stream.log`, `app-bunfetch-static.log`, `app-node-baseline.log`, `app2/`, `build-documented.log`, `build-pnpm-documented.log`, `build-pnpm-nitrolatest.log`, `build-pnpm-noviteplugin.log`, `build-pnpm-ssrexternal.log`, `build-shim-noplugin.log`, `build-shim-withplugin.log`, `pids.txt`, `rec.log`, `recorder.mjs`, `run2/`, `sink.log`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

No result was recorded under this directory name or under the cell and capability. The logs in this directory are the only record.
