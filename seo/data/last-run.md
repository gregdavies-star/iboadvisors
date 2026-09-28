# Daily SEO run — 2026-09-26

Rule 1 clean (0 audit errors). Rule 2 had the only real problem: `/industries/restaurants` is the sole non-PASS sitemap URL, so it got a 420-word section plus two inbound links. Rules 3–6 are blocked by cool-downs, the homepage-body ban and missing prior-window data; the rest of the budget went to rule 7.

## GSC totals — 28 days (2026-08-27 → 09-23)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 53 | 2,422 | 2.19% | 15.6 |
| Prior 28d | — | — | — | — |

`totals.previous` is still null, so **rule 6 yields no decliners** (~2026-10-15).

## Changes — 4 pages edited, 1 new post

| Change | Data point |
|---|---|
| **`/industries/restaurants`** — section on the four restaurant EBITDA normalizations, a worked bridge ($3.2M reported → $4.0M adjusted, invented group), plus one FAQ in body and JSON-LD | **"Discovered – currently not indexed"**, the only non-PASS URL of 28. Its two identical siblings are indexed, so this is weight, not a template fault. Pre-opening costs sourced to Texas Roadhouse's FY2025 10-K |
| `alternatives-to-selling-to-pe` → restaurants page | 109 impr @ 10.2; its sector paragraph already names multi-unit restaurants |
| `minority-pe-stake-veto-rights` → restaurants page | 178 impr @ 9.9; its capex-consent paragraph already turns on restaurant unit spending |
| **New: `/blog/sell-part-of-your-business-keep-control`** — 1,979 words, 12 internal links, sourced to 8 Del. C. §141(a), §271(a) and IRC §1042 | The four highest-priority uncovered keywords, all cluster 2. Built on governance mechanics, not a route list, to stay clear of the minority-recap and alternatives posts |
| `minority-recapitalization-explained` → the new post | Cluster-3 hub, 74 impr @ 9.8, closest topical match |

`keywords.json` fixed: `EBITDA multiples by industry` had a live page but no `covered` entry, so rule 7 could have re-published it.

## Skipped

- **Rule 3** — all 3 `lowCtr` rows in cool-down: `/blog` (09-08), explainer (09-15), veto rights (09-18).
- **Rule 4** — 3 of 4 rows are the homepage (body barred); the 4th is answered in the explainer's opening.
- **Rule 5** — 3 of 4 rows are apex/`www` duplicates of our own domain.

## Needs a human

1. **~94 impressions, 0 clicks, no page and no keyword entry:** `buyout private equity` (41 @ 26.4), `private equity buyout` (21 @ 20.5), `pe buyout` (13 @ 28.5). Absent from `keywords.json`, so no rule reaches it. Add to cluster 5.
2. **Apex still outranks `www` on the calculator** — 391 impr @ 34.4 against 46 @ 10.1. The 301 is correct; consolidation lag.
3. **`what is an ibo`** — 68 impr, 0 clicks; `independentbuyout.com` (ours) also ranks page one, so the click may land where GSC cannot see it.
4. **Stranded past page 2:** `management buyout financing` (74 @ 23.3), `exit planning for business owners` (24 @ 85.3).

## Flagged

Nothing. Banned-phrasing scan: 0 matches across 30 HTML files; all JSON-LD parses. The approved "$1.8 billion" line is intact in both places, so that flag stays dropped.
