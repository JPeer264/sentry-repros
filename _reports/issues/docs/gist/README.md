# Runtime docs audit, proposed issues for sentry-docs

Ninety-six proposed GitHub issues for `getsentry/sentry-docs` from the audit of the Bun, Deno and Cloudflare guides against the shipped SDK (develop at `6f2da7483d`, September 2026). One file per priority; within P0 the order is the suggested filing order.

| Priority | Meaning | Drafts |
| --- | --- | --- |
| [P0](#file-p0-md) | a page that loses data for a common setup | 40 |
| [P1](#file-p1-md) | a page that is wrong or missing for something users will hit | 111 |
| [P2](#file-p2-md) | consistency and hygiene | 52 |

**Start with [01-V11-CHECKLIST.md](#file-01-v11-checklist-md):** the getting-started and manual-setup changes that must land with v11, grouped by runtime, each linked to its draft.

Reproductions, report pages and the same drafts as individual body files: https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements

Section 7 (DOC-Q1 to DOC-Q6) comes from the getting-started paths run on 2026-09-08. Seven drafts carry a note: X2 and DOC-R20 are owned by Linear tickets already in progress, and DOC-C1 to DOC-C5 are v11-gated and belong under the v11 docs umbrella. Three pairs touch the same docs file and can be filed as one issue each: DOC-F11 with DOC-F28, DOC-F13 with DOC-F30, DOC-F19 with DOC-F36.

