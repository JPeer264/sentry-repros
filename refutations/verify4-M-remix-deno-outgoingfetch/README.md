# verify4-M-remix-deno-outgoingfetch

## What it re-tests

Independent re-test of the capability **outgoingfetch** of cell `M-remix-deno` (see `$REPRO/cells/M-remix-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration. Results for this cell and capability were recorded under the cell id, so the entries below may include the other independent attempt on the same capability.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `README-verify.txt`, `app/`, `appA.log`, `appA.pid`, `appB.log`, `appB.pid`, `appC.log`, `appC.pid`, `appD.log`, `appD.pid`, `appE.log`, `appE.pid`, `appF.log`, `appF.pid`, `appF2.log`, `appF2.pid`, `appG.log`, `appG.pid`, `appG2.log`, `appG2.pid`, `appH.log`, `appH.pid`, `appI.log`, `appI.pid`, `build1.log`, `build2.log`, `build3.log`, `build4.log`, `build5.log`, `db.mjs`, `deno-fetch-integration.mjs`, `deno.json`, `globals-fetchonly.mjs`, `globals-first.mjs`, `globals-flex.mjs`, `globals-subset.mjs`, `install.log`, `instrument.server.mjs`, `package-lock.json`, `package.json`, `probe.sh`, `rec.log`, `rec.pid`, `recorder.mjs`, `recorder2.mjs`, `runA.log`, `runA.pid`, `runB.log`, `runB.pid`, `runC.log`, `runC.pid`, `runD.log`, `runD.pid`, `runE.log`, `runE.pid`, `runF.log`, `runF.pid`, `runG.log`, `runG.pid`, `server-dbfirst.mjs`, `server-flex.mjs`, `server-plain.mjs`, `server-subset.mjs`, `server-undici.mjs`, `server-undicifetchonly.mjs`, `sink.log`, `sink.mjs`, `sink.pid`, `t-mysql-plain.mjs`, `tsconfig.json`, `vite.config.ts`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

No result was recorded under this directory name or under the cell and capability. The logs in this directory are the only record.
