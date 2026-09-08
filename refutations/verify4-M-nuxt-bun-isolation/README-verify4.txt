verify4-M-nuxt-bun-isolation

Nuxt 4.5.2 / Nitro 2.13.4 / h3 1.15.11, NITRO_PRESET=bun, bun 1.4.0, @sentry/nuxt 10.67.0 (develop).

Rerun:
  cd app && NITRO_PRESET=bun npx nuxt build
  PORT=52882 node ../sink5.mjs &            # envelope sink, records trace_id/tags/transaction
  cd app && PORT=52881 bun run .output/server/index.mjs &
  APP_PORT=52881 SINK=http://127.0.0.1:52882 node ../drive.mjs

drive.mjs: one GET /api/error, then three concurrent GET /api/iso?tag=alpha|beta|gamma,
then GET /api/sentinel (captureMessage + flush) as the sentinel.

A  runA3.log / resultA3.json  documented wiring (@sentry/nuxt only)      -> BROKEN
C  runC.log  / resultC.json   documented wiring + traceLifecycle:static  -> BROKEN (same)
B  runB.log  / resultB.json   + bunServerIntegration() from @sentry/bun  -> WORKS
