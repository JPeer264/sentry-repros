# verify4-M-remix-bun-outgoingfetch

## What it re-tests

Independent re-test of the capability **outgoingfetch** of cell `M-remix-bun` (see `$REPRO/cells/M-remix-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration. Results for this cell and capability were recorded under the cell id, so the entries below may include the other independent attempt on the same capability.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `REPRO.md`, `app/`, `app-a/`, `app-baseline-static.log`, `app-baseline-stream.log`, `app-bunall-static.log`, `app-bunall-stream.log`, `app-bundle-continue.log`, `app-bundle-static.log`, `app-bunfetch-static.log`, `app-bunfetch-stream.log`, `app-node-import-static.log`, `app-plain-continue.log`, `items-baseline-static.json`, `items-baseline-stream.json`, `items-bunall-static.json`, `items-bunall-stream.json`, `items-bundle-static.json`, `items-bunfetch-static.json`, `items-bunfetch-stream.json`, `items-node-import-static.json`, `pids.txt`, `rec-baseline-static.json`, `rec-baseline-stream.json`, `rec-bunall-static.json`, `rec-bunall-stream.json`, `rec-bundle-static.json`, `rec-bunfetch-static.json`, `rec-bunfetch-stream.json`, `rec-node-import-static.json`, `rec.log`, `run.sh`, `sink.log`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

No result was recorded under this directory name or under the cell and capability. The logs in this directory are the only record.
