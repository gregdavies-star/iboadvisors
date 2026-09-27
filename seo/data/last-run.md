# Daily SEO run — 2026-09-27

Rule 1 clean (0 audit errors). Rule 2 fired for the first time in weeks — `/industries/restaurants` is the only sitemap URL not `PASS`. Rule 3 had one row out of cool-down; rule 7 published cluster 2's top uncovered keyword.

## GSC totals — 28 days (2026-08-28 → 09-24)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 54 | 2,582 | 2.09% | 15.2 |
| Prior 28d | — | — | — | — |

`totals.previous` is still null, so **rule 6 yields no decliners** (~2026-10-15).

## Changes — 4 pages edited, 1 new post

| Change | Data point |
|---|---|
| **`/industries/restaurants`** +430 words on owned real estate, plus an FAQ | Only non-`PASS` URL ("Discovered — currently not indexed"), while both siblings published 09-25 are indexed. Business at 3.0x–5.0x EBITDA against net lease retail cap rates of **6.93%** (Q3 2025, Northmarq/RCA via CPE) ≈ 14x rent, on the page's existing 12-unit hypothetical. It already had 4 inbound links from `PASS` pages, so the deficit was depth. |
| **`alternatives-to-selling-to-private-equity`** meta rewrite | `lowCtr`: 120 impr, 1 click (**0.83%**) at position 10.0 against 3.0% expected; never rewritten since 09-08. **Title left as-is** — at 58 chars it already leads with the primary query and no ≤60-char variant beats it. |
| **New post `/blog/sell-a-business-but-keep-control`** | GSC shows the intent with no decision page serving it: `minority recapitalization` 10 @ 21.6, `minority recap` 6 @ 9.0, `private equity minority investments` 9 @ 73.9. 2,079 words, 12 internal links, 6 sources opened with WebFetch. |
| **3 inbound links to it** | `minority-pe-stake-veto-rights` (185 impr @ 9.7, the site's #2 page, whose thesis *is* this question), `business-exit-planning-every-option` (cluster-2 hub), `alternatives-to-selling-to-pe` (its FAQ asks the title question almost verbatim). |

No edit bumped an `Updated` date.

## Skipped

- **Rule 3, 3 of 4** — cool-down: `/blog` (09-08), IBO explainer (09-15), veto rights (09-18).
- **Rule 4, all 5** — 3 are the homepage (body barred); `what is an ibo` is answered in the explainer's H1; the 5th is a quoted search for the Stanford GSB article we cite (20 impr @ 7.4).
- **Rule 5** — 3 of 4 rows are apex/`www` duplicates of ours.

## Needs a human

1. **Apex vs `www` still splits brand queries** — apex `/business-valuation-calculator` shows 16 impr @ 2.1 on `ibo advisors` against `www` at 6.0. The `vercel.json` 301 is correct, so this is consolidation lag: check GSC's duplicate/canonical report.
2. **`what is an ibo`** — 69 impr, 0 clicks. `independentbuyout.com` also ranks page one, so the click may land on our own domain GSC cannot see. Not a snippet fault; the in-remit fix remains one homepage link to the explainer.
3. **Stranded past page 2:** `management buyout financing` (73 @ 23.6), `exit planning for business owners` (24 @ 85.3), `business valuation calculator` (64 @ 70.3).

## Flagged

Nothing. Banned-phrasing scan: 0 matches across 30 HTML files. Both approved "$1.8 billion" lines intact.
