# Daily SEO run — 2026-10-17

First run after PR #56 merged on 10-14: the sixteen-run stack is on `main` and the duplicate-post loop is closed. Shipped one new post, three inbound links, a blog-index title/meta rewrite, and the keyword-map fix behind the loop. Audit clean (34 pages, 0 errors).

## GSC totals — 28 days (2026-09-17 → 10-14)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 81 | 3,720 | 2.18% | 11.3 |
| Prior 28d | 31 | 1,695 | 1.83% | 17.7 |

Clicks 2.6x, impressions 2.2x, position 6.4 places better — both windows end before the stack shipped.

## Changes

- **New post `/blog/seller-financing-business-sale`** (2,211 words). Rule 7: the 10-13 post was dropped in merge resolution, so nothing live in the trailing 7 days. Highest-priority uncovered keyword; "seller note" appears on 12 posts (18 times on `/blog/management-buyout-financing`) with no page targeting it. Four sources, each opened in full and itemised in the changelog: the AM&AA consideration mix via Lippes Mathias (70/10/15/5 at $25M–$50M EV), a subordinated seller note filed as an SEC 8-K exhibit (180-day standstill, no cap on blockage notices), ACG/GF Data FY2025 (7.2x), IRS Pub 537 (§453A's $5M threshold). Worked example is an invented $6M-EBITDA company.
- **Three inbound links**, each inside a sentence that already named a seller note: `/blog/management-buyout-financing`, `/blog/how-private-equity-actually-finances-a-buyout`, `/blog/earnout-in-business-sale`.
- **`/blog` title and meta.** `lowCtr`: 336 impressions, 1 click (0.30%) at position 19.0 against 1.0% expected. The index ranks for buyout queries ("buyout companies" 30 impr at 23.5, "owner buyout", "business buyout") the old exit-planning title never matched. Last changed 09-08.
- **`keywords.json`.** "private equity buyout" (clusters 3, 5) and "buyout private equity"/"pe buyout" (cluster 5) now map to `/blog/private-equity-buyout-explained`. Covered in cluster 2 only, they read as uncovered — the loop behind the duplicate posts.

## Skipped

All seven `strikingDistance` rows: three on `/blog/family-business-succession-planning` (expanded 10-13), three on the homepage (body copy off-limits), one 13 days past a 10-04 edit. All six cannibalization rows are already resolved on `main`. Remaining `lowCtr` rows are inside the cool-down; `/blog/sell-part-of-your-business-keep-control` (126 impr at 7.4) is a dead slug already 301'd in `vercel.json`. No decliners.

## For a human

`/industries/restaurants` reads **"Discovered – currently not indexed"**, reversing the 10-13 "unknown to Google" reading — transient, not a trend. Unchanged underneath: no `lastCrawlTime` has ever been returned for it, though on-page is clean with 7 inbound links and a correct canonical. **Request indexing in Search Console** is the only lever; third run to say so. The other 32 sitemap URLs PASS.
