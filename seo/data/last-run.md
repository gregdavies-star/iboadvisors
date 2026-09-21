# Daily SEO run — 2026-09-19

New-post day: the trailing-7-day cap had room for one, and the largest uncovered demand in GSC is the management-buyout family — 49 impressions at positions 28-30 against a single page. Every title, meta and expansion rule is in cool-down. Audit: 0 errors, 2 pre-existing warnings, both on the calculator.

## GSC totals — 28 days (2026-08-20 → 09-16)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 31 | 1,695 | 1.83% | 17.7 |
| Prior 28d | — | — | — | — |

`totals.previous` is still null — no data before 2026-08-18 — so **rule 6 is unusable until ~2026-10-15**; `decliners` is empty for that reason.

## Changes

**`/blog/management-buyout-vs-private-equity`** — new post, 1,920 words plus two tables. Uncovered priority-2 keyword; "management buyout" (15 impr @ 28.6), "management buyout financing" (13 @ 29.5) and variants are served today only by `/blog/management-buyout-financing`. Built on an invented $6M-EBITDA company: a 5.0x MBO against a 6.8x sponsor deal turns a $10.8M headline gap into a $13.1M gap in cash at closing. Every figure comes from a source opened with WebFetch (CT Acquisitions, GF Data via CapitalPad, Bain, Chambers, Goodwin, Cornell LII). 13 outbound internal links incl. the calculator.

**4 link edits**, all donors for the new post, all under 150 words so no `Updated` bumps: `/blog/management-buyout-financing` (69 impr), `/blog/how-to-sell-a-business-to-private-equity` (42), `/blog/exit-planning-for-business-owners` (44), `/blog/business-exit-planning-every-option`.

**`seo/keywords.json`** — "what happens after private equity buys your company" has had a page since 09-12 but was never marked `covered`, so rule 7 could have re-picked it. Fixed, plus the new keyword.

## Skipped

- **Rule 3** — all 3 `lowCtr` rows in cool-down: IBO explainer (175 impr, 1.14%) rewritten 09-15; veto-rights (164, 0 clicks) and `/blog` both 09-08.
- **Rule 4** — 2 rows are the homepage (body barred); the third is the IBO explainer, edited 09-15 and already the direct answer.
- **Rule 5** — 2 of 3 rows are apex/www twins predating the 308.
- **Rule 7** — "selling to private equity pros and cons" ranks higher in `keywords.json` but draws no impressions, and two pages already target the head term.

## Coverage

`/blog/family-business-succession-planning` is the only non-PASS URL, still "Discovered - currently not indexed". On-page remedies are exhausted (2,542 words, 12 inbound, indexable) — it needs a manual index request.

## Needs a human

1. **Authorize the calculator title/meta rewrite** (74 → ≤60; 194 → ≤155): ~115 impressions across ~30 variants at positions 55-82, 1 click. Rule 3 does not fire. Fourth ask.
2. **Request indexing** for the succession post.
3. **"what is an ibo"** (60 impr @ 8.5) — the explainer (26 @ 7.0) should outrank the homepage (32 @ 9.7), but the homepage links to it nowhere and that is barred body copy.

## Flagged

Nothing; the banned-phrasing grep returns zero matches site-wide.
