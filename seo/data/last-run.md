# SEO daily run — 2026-10-24

One new post on adjusted EBITDA add-backs, with three inbound links. Two title/meta rewrites from `lowCtr`. A fourth pass at `/industries/restaurants`, where the on-page work now looks finished.

| Window | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| 2026-09-24 → 10-21 | 77 | 4,067 | 1.89% | 11.5 |
| Prior 28 days | 53 | 2,422 | 2.19% | 15.6 |

Clicks +45%, impressions +68%, position 15.6 → 11.5. The CTR "decline" is arithmetic: the new impressions arrived on page 2–5. Most of the `lowCtr` list has that cause and is not a snippet problem.

## Changes

- **New `/blog/adjusted-ebitda-add-backs`** (2,152 words). Rule 7: one post in the trailing 7 days, cap allowed one. Built on the SEC's own add-back test (Non-GAAP C&DI 100.01 — an expense recurring "repeatedly or occasionally, including at irregular intervals") plus three EDGAR staff letters: Bill.com (2021, commissions), Cardiovascular Systems (2022, IPR&D), BRC Inc. (2024, recruiting). Worked schedule, made-up numbers; 6 internal links plus the calculator.
- **Inbound links to it** from `/blog/how-pe-firms-value-a-company` (26 in-links; its step-2 paragraph now defers to the detail page rather than competing), `/ebitda-multiples-by-industry` (359 impr), `/blog/exit-planning-for-business-owners`.
- **`/ebitda-multiples-by-industry` title+meta** — 359 impr, 2 clicks (0.56%) at 16.5 vs 1.0% expected, never rewritten. Title now promises the table the top query ("industry multiples database", 34 impr) wants.
- **`/blog/majority-recapitalization-vs-sale` title+meta** — 111 impr, **0 clicks at position 6.7** vs 3.0% expected: the one row where position is good enough that the snippet is genuinely the fault.
- **`/industries/restaurants` +520 words** on the working capital peg, which runs negative in restaurants (cited to Cracker Barrel FY2025 10-K), plus FAQ, schema, and a ninth inbound link from `/blog/business-exit-planning-every-option`.
- `seo/keywords.json`: new post mapped; three cluster-4 keywords closed against pages already answering them.

Audit: 36 pages, **0 errors, 0 warnings**. Sitemap and JSON-LD regenerated.

## Skipped

Rule 4 — all three striking-distance queries sit on `/blog/family-business-succession-planning` (expanded 10-13, in cool-down); the fourth is homepage. Rule 3 — `/blog/what-happens-after-private-equity-buys-your-company` skipped on diagnosis: its 269 impressions are borrowed buyout queries at positions 20–26, too deep for a snippet to help. Five other rows in cool-down. Rule 6 — the only decliner is apex `iboadvisors.com`, i.e. the apex→www 301 working. Rule 5 — three of five rows are brand queries the homepage wins.

## Needs a human

1. **`/industries/restaurants` is likely no longer an on-page problem**: 3,200+ words, correct canonical, nine in-body inbound links — more than either sibling industry page, created the same day and both indexed. The likelier cause is overlap with `/blog/restaurant-ma` (position 6.5) and the restaurants row in `/ebitda-multiples-by-industry` (position **2.5** for "ebitda multiple for restaurants"). If still NEUTRAL in two weeks, merge the post into the industry page and 301 it rather than expanding a fifth time. No redirect made.
2. `/ebitda-multiples-by-industry` ranks 45–90 on its head terms — an authority gap. The digital-PR play in STRATEGY.md §5.1 targets this page.
3. No `ahrefs-latest.json`: post selection used `keywords.json` priority and GSC impressions only.

## Flagged

Nothing. No source or opportunity row asked for deal specifics; no copy on the pages touched names an IBO Advisors transaction, client, deal count or result.
