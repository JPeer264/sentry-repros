# Gist verification, runtime docs audit issues

Gist: https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21
Checked 2026-09-08, read-only. Live content saved to `gist-live/`, raw API response to `gist-raw.json`.

**Verdict: needs fixes.** One required fix, five nits. Everything substantive is correct.

## What passed

**Live equals local.** All five files came back untruncated and are byte-identical to the local
`_reports/issues/docs/gist/` copies (`cmp` clean; `00-README.md` compared against local `README.md`).

**Numbering and counts.** Sections run contiguously 1..96 in file order: P0.md 1-14, P1.md 15-80,
P2.md 81-96. Counts are 14 / 66 / 16, matching `_items.json`, each file's own stated draft count,
its Contents list length, and its footer count.

**Items.** All 96 ids from `_items.json` appear exactly once, each in the file matching its prio.
No missing, no duplicates, no extras. Title, type and heading are byte-identical for all 96.
83 bodies match verbatim; the other 13 carry a prepended `**Note.**` paragraph, and the body after
that paragraph matches verbatim. Those 13 are exactly the notes check 5 asks for, so they are not
edits. Every section closes with the `---` rule and the audit footer.

**Links.** 143 anchor links checked, none broken and none ambiguous. Each of the 96 TOC links equals
the GitHub-slugger anchor of its own section, in its own file, with link text equal to the heading.
Each of the 41 checklist links resolves to the section number in its anchor, in the file matching
the P0/P1/P2 tier on that line, with link text equal to the section title and the cited audit id
equal to that section's audit id. All `#file-*-md` links match real gist file anchors.

The only anchor collision among 113 headings is `## Contents`, which appears in P0/P1/P2 and slugs
to the same base. Nothing links to `#contents`, so no link is affected.

**Content sanity.** No `claude.ai`, no `__ROWS__`, no `%s`, no `$SCRATCH`, no `~`, no
TODO/FIXME/XXX. Code fences balanced in all five files; every table has a header separator. All
seven Linear-owned notes present (X2 -> JS-2599, DOC-R20 -> SDK-1351, DOC-C1..C5 -> v11-gated under
SDK-1296) and all three pairs cross-reference each other. The nine `__` hits are real content:
`__SENTRY_OPTIONS_CALLBACK__`, `manual-setup__v10.7.0.mdx`, `@jsr/oak__oak`, and the sentry-docs
template variables `___SDK_PACKAGE___`, `___PUBLIC_DSN___`, `___ORG_INGEST_DOMAIN___`.
The checklist's own `Counts: 21 must, 18 should, 2 later` matches its 41 checkboxes.

**Spot reads** (random: P0 #4, #6; P1 #51, #79; P2 #94, #96). All six read as complete GitHub issues,
with a title, what the page says with file:line, what was observed on develop, and what to change.
No sentence reads as an instruction to the writer rather than a description of the change.

## What needs fixing

1. **Required. `00-README.md` has no link to the release checklist.** Its only links are
   `#file-p0-md`, `#file-p1-md`, `#file-p2-md` and the sentry-repros tree URL; `01-V11-CHECKLIST.md`
   is neither linked nor mentioned. A reader on the index cannot reach the checklist. Add, under the
   table: `Release checklist: [v11 docs minimum, getting started and manual setup](#file-01-v11-checklist-md)`.

2. Nit. `What to change` is formatted two ways: 18 sections use the bold heading
   `**What to change**`, 70 use plain `What to change:`. Fix in `_items.json` and regenerate.

3. Nit. 34 P1 new-page Finding lines end in the telegraphic `<framework> on <runtime>: documented no`,
   for example DOC-F26's `NestJS on Deno: documented no`. It reads as a table cell. Rewrite the
   `heading` field as a sentence.

4. Nit. The checklist's "Not in this list" says *the 34 framework pages* but the parenthetical
   enumerates 39 ids; it reaches 34 only after subtracting DOC-F11, F13, F28, F29 and F30, which are
   listed earlier in the same checklist. Narrow the ranges or say "excluding those listed above".

5. Nit. DOC-Q4 (P2 #94) cites `bun 1.4.2`; the other 19 version citations say Bun 1.4.0.

6. No action. The `#contents` anchor collides across P0/P1/P2 on the single gist page, but nothing
   links to it.
