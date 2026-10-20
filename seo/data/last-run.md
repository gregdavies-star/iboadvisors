# Daily SEO run — 2026-10-20

First run since 10-13, and the first reading a `main` with the merged stack — this month's duplicate-post loop is gone.
Audit clean (0 errors, 0 warnings); 33 of 34 sitemap URLs indexed.
One new post, one title/meta rewrite, four internal links.

## GSC totals — 28 days (2026-09-20 → 10-17)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 81 | 3,847 | 2.11% | 11.2 |
| Prior 28d | 42 | 1,989 | 2.11% | 17.1 |

Clicks and impressions roughly doubled, position improved 5.9 places, CTR flat.

## Changes

- **New post `/blog/seller-financing-in-a-business-sale`** (2,527 words). Rule 7: no new post in the trailing 7 days; highest-priority uncovered keyword (cluster 3). One invented $6M-EBITDA company — a 7.0x price against 2.9x debt (GF Data/ACG Q2 2026), the four things the installment method does *not* defer (IRS Pub 537), a worked § 453A charge of $13,333/yr at the 7% Q4-2026 rate (IR-2026-98). Every source opened, every figure re-derived.
- **Title + meta, `/blog/minority-pe-stake-board-control-veto-rights`.** `lowCtr`: 101 impressions, 1 click (0.99%) at position 5.2 vs 3% expected; last rewritten 09-18. "The Veto List" → "Who Decides"; the description now names the five negotiable levers already on the page.
- **Four links.** Three inbound to the new post, each on a sentence that already named a seller note. One for rule 5: `/blog/private-equity-buyout-explained` is the designated winner for "private equity buyout" but had 3 inbound links while the losers hold the impressions (30 at 26.1, 19 at 20.7).
- **`keywords.json`:** mapped the new post; closed three duplicate "private equity buyout" rows reading as uncovered.

## Skipped

- **Rule 4:** three of four striking-distance rows are `/blog/family-business-succession-planning`, edited 10-13 (14-day cool-down). The fourth is "ibo finance" on the homepage — body copy off-limits.
- **A second title rewrite.** Four `lowCtr` pages are inside the 28-day cool-down. `/blog/independent-buyout-explained` (100 impr, 0 clicks, pos 5.0) is a related-domains case: we own `independentbuyout.com` and the homepage sits at 3.8 for "independent buyout", so the click likely lands on our own property — which GSC can't show. Two September rewrites didn't move it.
- **`/blog/sell-part-of-your-business-keep-control`** (148 impr, pos 7.4) is a 301 source; Google still surfaces the pre-09-27 URL. No evidenced snippet fault.
- **Rule 6:** no decliners.

## Coverage + for a human

- `/industries/restaurants`: "Discovered – currently not indexed" (up from "unknown to Google"), still no `lastCrawlTime` ever, despite ~2,500 words, FAQ schema, a correct canonical and 7 inbound links. No on-page lever left — **request indexing in Search Console**. Third run with this answer.
- The mid-term AFR (4.61%, Rev. Rul. 2026-19) is cited to the IRS AFR index; the ruling PDF wouldn't parse here, so the figure came from a secondary tabulation. Worth a check.
- Nothing flagged under the no-deal-data rule; banned-phrasing scan clean.
