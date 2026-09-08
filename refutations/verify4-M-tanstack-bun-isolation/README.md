# verify4-M-tanstack-bun-isolation

## What it re-tests

Independent re-test of the capability **isolation** of cell `M-tanstack-bun` (see `$REPRO/cells/M-tanstack-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration. Results for this cell and capability were recorded under the cell id, so the entries below may include the other independent attempt on the same capability.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `app-bun-conditional.log`, `app-doc.log`, `app-iso.log`, `app-node-stock.log`, `app-node.log`, `app-pnpm/`, `app.pid`, `build-conditional.log`, `build-documented-nitro-latest.log`, `build-documented.log`, `build-pnpm-debug.log`, `build-pnpm-debug2.log`, `build-pnpm-documented.log`, `build-pnpm-documented2.log`, `build-pnpm-extall.log`, `build-pnpm-extinj.log`, `build-pnpm-full.log`, `build-pnpm-iso.log`, `build-pnpm-noplugin.log`, `build-pnpm-ssrexternal.log`, `build-stock-node.log`, `core-probe/`, `dc-probe.mjs`, `mini/`, `mini-iso.log`, `mini-isoonly.log`, `mini-stock.log`, `mini.pid`, `npm-install.log`, `npm-nitro.log`, `pnpm-install.log`, `pnpm-install2.log`, `sink.log`, `sink.mjs`, `sink.pid`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

No result was recorded under this directory name or under the cell and capability. The logs in this directory are the only record.
