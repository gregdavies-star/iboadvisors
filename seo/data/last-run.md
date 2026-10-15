# Daily SEO run — 2026-10-15

The 10-13 stack merged (PR #56), so `main` finally matches what earlier runs kept re-proposing — no duplicate posts, no stale asks. One new post, three link edits, one keyword-map fix. No title/meta rewrites: no candidate was evidenced.

## GSC totals — 28 days (2026-09-15 → 10-12)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 78 | 3,866 | 2.02% | 11.7 |
| Prior 28d | 24 | 1,299 | 1.85% | 18.2 |

## Changes

- **New post `/blog/seller-financing-business-sale`** (rule 7). Nothing published in the trailing 7 days; `seller financing in a business sale` was the highest-priority uncovered keyword, and seller notes appeared on 13 pages with no page of their own. Covers subordination, blockage, standstill and full standby; a worked hypothetical valuing a $5.25M note at $3.44M–$4.65M, turning a 7.0x offer into 6.64x–6.88x; set-off as a second escrow; the tax schedule. Every source opened before citing: IRS Pub 537, 26 U.S.C. § 453A, the IRS AFR index, SRS Acquiom LMM deal terms. Arithmetic re-derived; company invented and labelled.
- **Three links.** `/blog/earnout-in-business-sale` and `/blog/management-buyout-financing` → the new post. `/blog/how-private-equity-actually-finances-a-buyout` (21 inbound) → `/blog/private-equity-buyout-explained`, which had 3 inbound links, fewest on the site, despite owning the ~165-impression `private equity buyout` pool.
- **`keywords.json`.** Those three pe-buyout terms sat in clusters 3 and 5 without `covered` entries, so every run re-read them as uncovered. Mapped; duplicates removed.

## Skipped, with reasons

- **Rule 3:** the five rows at real page-1 positions (family succession, PE pros/cons, minority recap, MBO vs PE, alternatives-to-PE) are all inside the 28-day cool-down, rewritten 10-04 to 10-13. `/blog/how-to-sell-a-business-to-private-equity` and `/business-valuation-calculator` have head queries at positions 28–75 — a ranking problem, not a snippet one. `/blog` loses brand impressions to the homepage, correctly. `/blog/independent-buyout-explained` sits at 4.9 with zero clicks, but `independentbuyout.com` (ours) ranks page one for those terms and can absorb the click invisibly.
- **Rule 4:** four of six rows are pages edited 10-04 and 10-13; the other two are homepage queries, and homepage body copy is off-limits.
- **Rule 5:** brand terms the homepage wins at 1.1, plus the pe-buyout pair already routed with that anchor from both losers. Verified, not repeated. **Rule 6:** no decliners.

## Coverage and human asks

`/industries/restaurants` reads "Discovered – currently not indexed". Last run saw "URL is unknown to Google" and called it a regression; that has reverted, so read it as a transient API response. The page is ~2,000 words with FAQ schema, 7 inbound links (more than both indexed siblings), correct canonical, in the sitemap, and expanded twice in September — nothing left on-page. **Request indexing in Search Console**, the third run to conclude this.

Audit: 34 indexable pages, 0 errors, 0 warnings. Flagged: nothing. No deal data added; banned-phrasing scan clean; `jobTitle` reads Managing Partner.
