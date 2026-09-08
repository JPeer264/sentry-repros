# verify4-M-tanstack-bun-routenames

## What it re-tests

Independent re-test of the capability **routenames** of cell `M-tanstack-bun` (see `$REPRO/cells/M-tanstack-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration. Results for this cell and capability were recorded under the cell id, so the entries below may include the other independent attempt on the same capability.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `appA.pid`, `appB.pid`, `appC.pid`, `appD.pid`, `appE.pid`, `build-plugin-extall.log`, `build-plugin-extdeps.log`, `build-plugin-extinj.log`, `build-plugin-noexternal.log`, `build-r3.log`, `dc-test.mjs`, `dc2.mjs`, `dc3.mjs`, `runA-bun-nohttp-static.log`, `runB-bun-http-static.log`, `runC-bun-http-stream.log`, `runD-final-static.log`, `runE-bun1314.log`, `sink-r2.log`, `sink.log`, `sink.mjs`, `sink.pid`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

No result was recorded under this directory name or under the cell and capability. The logs in this directory are the only record.
