# Benchmark: cacheClient on / off vs released v10

Measured 2026-08-24 on real Cloudflare Workers (workers.dev, fresh worker per run), raw data in
[`benchmarks/2026-08-24-matrix.json`](benchmarks/2026-08-24-matrix.json).

## Matrix

| Cell | SDK | `cacheClient` | edge cases |
| --- | --- | --- | --- |
| on · edge off (base) | `@sentry/cloudflare` 10.67.0 + [#23151](https://github.com/getsentry/sentry-javascript/pull/23151) (head `eba2d861`) | on | off |
| on · edge on | same | on | on |
| off · edge off | same | off | off |
| v10 · edge off | `@sentry/cloudflare` 10.70.0 (npm) | n/a | off |

"Edge cases" are the post-response captures of this repro: the `/checkout` `waitUntil` span tree
(log, metric, error) plus the DO audit flush, and the `/detached` DO task that fires 500 ms after
the RPC settled. With edge cases off both endpoints do only their synchronous work, so every cell
emits exactly the same telemetry and the CPU is comparable 1:1. With edge cases on, only the
cached client delivers all of it (v10 drops all 50 signal sets, `cacheClient: false` drops the
detached ones), so that cell is in the table for its delivery capability, not for cost parity.

Each cell was run **5 times**, one fresh worker per run (fresh DO namespace, no warm isolates),
cells interleaved over the same 100 minutes. Per run: the 100-request mix (50 `/burst?n=20`,
25 `/checkout`, 25 `/detached` at 5 req/s), Sentry-side validation, then 100 more `/burst?n=20`
as the CPU load. Delivery: all 20 runs passed their validator (per-request spans, logs, metrics
and errors for the edge-on cell; exact per-span-name counts for the edge-off cells).

Numbers are Workers Observability (`$workers.cpuTimeMs`, `$workers.wallTimeMs`) per worker
(fetch = the 200 load invocations, DO = the RPC invocations) and Cloudflare GraphQL
`cpuTimeUs / requests` per load window (billing-grade). Each value below is the **median of the
5 workers** of that cell.

## Medians

| Metric | on · edge off | on · edge on | off · edge off | v10 · edge off |
| --- | ---: | ---: | ---: | ---: |
| Worker CPU p50 | 8.00 ms | 5.00 ms | 6.00 ms | 8.00 ms |
| Worker CPU avg | 7.07 ms | 5.81 ms | 5.59 ms | 7.33 ms |
| Worker CPU p95 | 11.00 ms | 9.00 ms | 9.00 ms | 12.00 ms |
| Worker CPU p99 | 13.00 ms | 25.00 ms | 17.00 ms | 13.00 ms |
| Response time p50 (wall) | 765 ms | 779 ms | 758 ms | 765 ms |
| Response time p99 (wall) | 1174 ms | 1300 ms | 1352 ms | 1237 ms |
| DO CPU avg | 1.15 ms | 2.27 ms | 1.32 ms | 1.29 ms |
| DO CPU p99 | 3.00 ms | 24.00 ms | 4.00 ms | 4.00 ms |
| DO wall avg | 36 ms | 57 ms | 36 ms | 41 ms |
| DO wall p99 | 57 ms | 573 ms | 59 ms | 56 ms |
| GraphQL CPU / request, 100-request mix | 6.70 ms | 5.83 ms | 5.33 ms | 6.06 ms |
| GraphQL CPU / request, burst-100 | 7.20 ms* | 7.20 ms* | 7.00 ms | 8.99 ms |

\* burst-100 is the same load in both edge modes, so the `on` value is the median over all 10 workers.

## Relative to `cacheClient` on · edge cases off (= 100 %)

| Metric | on · edge off | on · edge on | off · edge off | v10 · edge off |
| --- | ---: | ---: | ---: | ---: |
| Worker CPU p50 | 100 % | −37.5 % | −25.0 % | ±0.0 % |
| Worker CPU avg | 100 % | −17.8 % | −20.8 % | +3.8 % |
| Worker CPU p95 | 100 % | −18.2 % | −18.2 % | +9.1 % |
| Worker CPU p99 | 100 % | +92.3 % | +30.8 % | ±0.0 % |
| Response time p50 | 100 % | +1.8 % | −0.9 % | ±0.0 % |
| Response time p99 | 100 % | +10.7 % | +15.2 % | +5.4 % |
| DO CPU avg | 100 % | +97.1 % | +15.0 % | +12.0 % |
| DO CPU p99 | 100 % | +700 % | +33.3 % | +33.3 % |
| DO wall avg | 100 % | +59.0 % | −0.4 % | +13.8 % |
| DO wall p99 | 100 % | +905 % | +3.5 % | −1.8 % |
| GraphQL CPU / request, mix | 100 % | −13.0 % | −20.4 % | −9.6 % |
| GraphQL CPU / request, burst-100 | 100 % | ±0.0 % | −2.8 % | +24.9 % |

## How to read it

- **Worker CPU on separate workers is dominated by host placement, not by the SDK variant.** Fresh
  workers land on one of two host classes (about 5 ms vs 8 ms p50 for the same code and load),
  and five runs do not average that out. The proof is in this dataset: `on · edge on` runs the
  same build *plus* extra work and still reads −18 % avg / −37 % p50 against the base, which is
  impossible as an SDK effect; the base cell simply drew three slow-class hosts. Read the
  worker-CPU rows as "the three SDK variants are within host noise of each other", never as a
  ranking. Ranking needs two builds in one worker on one host (see the notes at the end).
- **The DO rows are the robust signal.** DO work is identical and small per call, so host class
  matters less there: `cacheClient` on is the cheapest, `cacheClient` off +15 % CPU, v10 +12 %.
  The cached client neither constructs nor disposes a client per RPC call.
- **Response time does not change with any variant**: p50 758–779 ms in every cell, set by the
  20 sequential DO round trips of `/burst`. The SDK adds CPU, not latency.
- **`on · edge on` is not a cost comparison.** It is the only cell that executes *and delivers*
  the 25 post-response checkout signal sets and the 25 detached DO tasks; its DO wall p99 of
  573 ms is the repro's own 500 ms detached timer plus the audit flush.
- **v10 passes only because edge cases are off.** With them on, v10 fails validation on all 50
  post-response/detached signal sets, and `cacheClient: false` on the 25 detached ones.

## Notes

- The `off · edge off` and `v10` cells were produced with the same request mix but with the
  post-response captures removed at the source (`BENCH_EDGE_CASES=false` in the benchmark build,
  `EDGE_CASES=false` in this repro) so that all three SDK variants emit identical telemetry.
  `pnpm run run <run> on|off` keeps the edge cases on.
- Same-host comparisons (two SDK builds in one worker script, each behind its own path prefix,
  interleaved load) resolve differences the separate-worker matrix cannot: in those runs the
  cached client measured 3–17 % lower worker CPU than both v10 and `cacheClient: false`, with
  equal DO CPU and about half the burst p99.
- Workers Observability only populates `cpuTimeMs` on a subset of DO invocation events; GraphQL
  is the complete per-request number and is what Cloudflare bills.
