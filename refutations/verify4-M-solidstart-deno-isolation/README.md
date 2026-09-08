# verify4-M-solidstart-deno-isolation

## What it re-tests

Independent re-test of the capability **isolation** of cell `M-solidstart-deno` (see `$REPRO/cells/M-solidstart-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration. Results for this cell and capability were recorded under the cell id, so the entries below may include the other independent attempt on the same capability.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `A-deno.log`, `A.pid`, `B-deno.log`, `B.pid`, `C-deno.log`, `C-node.log`, `C.pid`, `Cn.pid`, `D-deno.log`, `D.pid`, `E-deno.log`, `E.pid`, `F-nowarm.log`, `als/`, `als-283.log`, `als-fetchmod.log`, `als-import.log`, `als-noop.log`, `als-serve.log`, `als-timeout.log`, `als.pid`, `als3-deno 0-.log`, `als3-deno 1-.log`, `als3-http 0-.log`, `als4-deno-0.log`, `als4-deno-1.log`, `als4-http-1.log`, `als4-node.log`, `app/`, `app-a.log`, `app-b.log`, `app-c.log`, `app-d.log`, `app-e.log`, `appa.pid`, `appb.pid`, `appc.pid`, `appd.pid`, `appe.pid`, `build1.log`, `build2.log`, `build3.log`, `build4.log`, `build5.log`, `min/`, `min-deno.log`, `mindeno.pid`, `mini/`, `mini-deno.log`, `mini-deno.pid`, `npm-install.log`, `output-orig/`, `package-lock.json`, `package.json`, `repro-deno.log`, `repro.pid`, `sink.log`, `sink.pid`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

No result was recorded under this directory name or under the cell and capability. The logs in this directory are the only record.
