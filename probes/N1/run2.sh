#!/bin/bash
# usage: ./run2.sh <appdir> <label> [deno flags...]
# Same as run3.sh but pinned to main.ts, the entry that carries `import "@sentry/deno/import"`.
set -u
APPDIR="$1"; LABEL="$2"; shift 2
HERE="$(cd "$(dirname "$0")" && pwd)"
exec "$HERE/run3.sh" "$APPDIR" "$LABEL" main.ts "$@"
