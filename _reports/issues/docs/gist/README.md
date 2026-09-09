# Runtime docs audit, proposed issues for sentry-docs

199 proposed GitHub issues for `getsentry/sentry-docs` from the audit of the runtime and framework guides against the shipped SDK (develop at `6f2da7483d` and `03aaf42455`, September 2026). One file per priority; within P0 the order is the suggested filing order.

| Priority | Meaning | Drafts |
| --- | --- | --- |
| [P0](#file-p0-md) | a page that loses data for a common setup | 39 |
| [P1](#file-p1-md) | a page that is wrong or missing for something users will hit | 109 |
| [P2](#file-p2-md) | consistency and hygiene | 51 |

**Start with [01-V11-CHECKLIST.md](#file-01-v11-checklist-md):** the getting-started and manual-setup changes that must land with v11, grouped by runtime, each linked to its draft.

Reproductions, report pages and the same drafts as individual body files: https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements

Section 7 (DOC-Q1 to DOC-Q113) comes from the getting-started and manual-setup runs of 2026-09-08 and 2026-09-09. X2 and DOC-R20 are owned by Linear tickets already in progress, DOC-C1 to DOC-C5 are v11-gated and belong under the v11 docs umbrella, and 17 drafts carry a note on a Linear ticket under SDK-1429 that touches the same lines. Four audit findings are covered by those tickets and have no draft: DOC-Q29 and DOC-Q38 by SDK-1482, DOC-Q62 by SDK-1461, DOC-Q86 by SDK-1483. Three pairs touch the same docs file and can be filed as one issue each: DOC-F11 with DOC-F28, DOC-F13 with DOC-F30, DOC-F19 with DOC-F36.

