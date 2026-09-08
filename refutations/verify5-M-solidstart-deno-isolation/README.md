# verify5-M-solidstart-deno-isolation

## What it re-tests

Independent re-test of the capability **isolation** of cell `M-solidstart-deno` (see `$REPRO/cells/M-solidstart-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration. Results for this cell and capability were recorded under the cell id, so the entries below may include the other independent attempt on the same capability.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `als/`, `app/`, `build.log`, `build2.log`, `build3.log`, `build4.log`, `build5.log`, `build6.log`, `build7.log`, `case-iso-deno-base.log`, `case-iso-deno-baseline.log`, `case-isoiso-deno.log`, `case-isoiso-node.log`, `case-isoscope-deno.log`, `case-mw-deno.log`, `deno-b.log`, `deno-b.pid`, `deno-c.log`, `deno-c.pid`, `deno-d.log`, `deno-d.pid`, `deno-static.log`, `deno.pid`, `install.log`, `lc-static.log`, `lc-stream.log`, `node-a.log`, `node-a.pid`, `sink.log`, `sink.mjs`, `sink.pid`, `wa.log`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

No result was recorded under this directory name or under the cell and capability. The logs in this directory are the only record.
