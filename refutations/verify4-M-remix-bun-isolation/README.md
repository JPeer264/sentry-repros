# verify4-M-remix-bun-isolation

## What it re-tests

Independent re-test of the capability **isolation** of cell `M-remix-bun` (see `$REPRO/cells/M-remix-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration. Results for this cell and capability were recorded under the cell id, so the entries below may include the other independent attempt on the same capability.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `README-rerun-verify.txt`, `README-rerun.txt`, `a1.log`, `a3.log`, `a4.log`, `a5.log`, `a6.log`, `a7.log`, `app/`, `build-server.ts`, `drive-iso.mjs`, `drive-iso2.mjs`, `drive-trace.mjs`, `drive-trace2.mjs`, `instrument-bunhttp.mjs`, `instrument.mjs`, `modeB-debug.log`, `modeB.log`, `modeB2.log`, `modeB3.log`, `package-lock.json`, `package.json`, `pids-v.txt`, `server-bunhttp.mjs`, `server-iso.mjs`, `server-iso2.mjs`, `server-iso3.mjs`, `server-iso4.mjs`, `server.mjs`, `sink-v.log`, `sink.log`, `vbase.log`, `vbunhttp-dbg.log`, `vbunhttp-nospans.log`, `vbunhttp-seq.log`, `vbunhttp-spans.log`, `vbunhttp-stream.log`, `vite.config.ts`, `vmodeA-bunhttp.log`, `x_dc2.mjs`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

No result was recorded under this directory name or under the cell and capability. The logs in this directory are the only record.
