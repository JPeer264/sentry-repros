#!/usr/bin/env bash
# Usage: ./run.sh <variant>
#   verbatim      index.mdx vite.config.ts as printed (no Nitro plugin): build, then the page's cp + start commands
#   nitro         index.mdx vite.config.ts plus nitro(); src/server.ts = the `--import` variant; started with --import
#   no-import     the "Without --import Flag" src/server.ts (index.mdx:390-402), started without --import
#   plugin-first  sentryTanstackStart() placed before tanstackStart() (index.mdx:241 says it should be last)
# Sink on 4762, app on 4763. Kills the server and the sink before exiting.
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VARIANT="${1:-nitro}"
SINK_PORT=4762
APP_PORT=4763
export SINK_URL="http://localhost:${SINK_PORT}"
export APP_URL="http://localhost:${APP_PORT}"
cd "$DIR"

case "$VARIANT" in
  verbatim)     CONFIG="vite.config.ts";              SERVER="src/server.with-import.ts";    START=(node --import ./.output/server/instrument.server.mjs .output/server/index.mjs) ;;
  nitro)        CONFIG="vite.config.nitro.ts";        SERVER="src/server.with-import.ts";    START=(node --import ./.output/server/instrument.server.mjs .output/server/index.mjs) ;;
  no-import)    CONFIG="vite.config.nitro.ts";        SERVER="src/server.without-import.ts"; START=(node .output/server/index.mjs) ;;
  plugin-first) CONFIG="vite.config.plugin-first.ts"; SERVER="src/server.with-import.ts";    START=(node --import ./.output/server/instrument.server.mjs .output/server/index.mjs) ;;
  *) echo "unknown variant $VARIANT"; exit 1 ;;
esac

REPO_ROOT="$(cd "$DIR/../.." && pwd)"
sanitize() { sed -i "" "s#${REPO_ROOT}#\$REPRO#g" "$1"; }
if [ "${SKIP_BUILD:-0}" != "1" ]; then
  cp "$SERVER" src/server.ts
  rm -rf dist .output
  ( timeout 170 npx vite build --config "$CONFIG"; echo "exit=$?" ) > "build-${VARIANT}.log" 2>&1
  tail -3 "build-${VARIANT}.log"
  # index.mdx:331, the page's build script tail.
  cp instrument.server.mjs .output/server 2>&1 | tee -a "build-${VARIANT}.log"
  sanitize "build-${VARIANT}.log"
fi
[ "${BUILD_ONLY:-0}" = "1" ] && exit 0

if [ "$VARIANT" = "verbatim" ]; then
  ( PORT=$APP_PORT timeout 20 "${START[@]}"; echo "exit=$?" ) > "server-${VARIANT}.log" 2>&1
  node -e '
    const fs = require("fs");
    const v = process.argv[1];
    const build = fs.readFileSync(`build-${v}.log`, "utf8").split("\n");
    const server = fs.readFileSync(`server-${v}.log`, "utf8").split("\n");
    const ls = d => { try { return fs.readdirSync(d); } catch (e) { return String(e.code); } };
    fs.writeFileSync(`results-${v}.json`, JSON.stringify({ variant: v, steps: [
      { label: "vite build with index.mdx:233-249 verbatim", result: { exit: build.find(l => l.startsWith("exit=")), dist: ls("dist"), distServer: ls("dist/server"), output: ls(".output") } },
      { label: "cp instrument.server.mjs .output/server (index.mdx:331)", result: build.filter(l => l.startsWith("cp:")) },
      { label: "node --import ./.output/server/instrument.server.mjs .output/server/index.mjs (index.mdx:358)", result: server.filter(l => /Error|exit=/.test(l)) },
    ], console: { build: build.filter(l => /sentry|warn|error|exit=|built in|dist\//i.test(l)), server }, verdict: "broken: the printed vite.config.ts has no Nitro plugin, so vite build writes dist/server/server.js and no .output/; both the cp and the start command the page prints fail" }, null, 2));
  ' "$VARIANT"
  sanitize "server-${VARIANT}.log"; sanitize "results-${VARIANT}.json"
  echo "wrote results-${VARIANT}.json"
  exit 0
fi

PORT=$SINK_PORT node "$DIR/sink.mjs" > "sink-${VARIANT}.log" 2>&1 &
SINK_PID=$!
for _ in $(seq 1 100); do curl -sf "$SINK_URL/__items" >/dev/null && break; sleep 0.1; done

PORT=$APP_PORT HOST=localhost "${START[@]}" > "server-${VARIANT}.log" 2>&1 &
SERVER_PID=$!
for _ in $(seq 1 150); do curl -sf -o /dev/null "$APP_URL/" && break; sleep 0.2; done

node "$DIR/drive.mjs" "$VARIANT"
STATUS=$?

kill $SERVER_PID 2>/dev/null; wait $SERVER_PID 2>/dev/null
kill $SINK_PID 2>/dev/null; wait $SINK_PID 2>/dev/null
sanitize "server-${VARIANT}.log"; sanitize "results-${VARIANT}.json"
echo "wrote $DIR/results-${VARIANT}.json (server log: server-${VARIANT}.log, build log: build-${VARIANT}.log)"
exit $STATUS
