# Daily SEO run — 2026-10-21

Clicks and impressions nearly doubled against the prior 28 days and average position improved 5.5 places, so there was no decliner work. Two real problems: `/industries/restaurants` still unindexed while both sibling industry pages rank, and a three-way fight over "private equity buyout" caused by two of our own titles leading with the same head term. Both fixed; no new post (the trailing-7-day cap of 2 is met).

| Window | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| 2026-09-21 → 10-18 | 80 | 3,878 | 2.06% | 11.4 |
| 2026-08-24 → 09-20 | 43 | 2,055 | 2.09% | 16.9 |

## Changes (4 pages)

- **`/industries/restaurants` — expanded ~670 words.** "Discovered – currently not indexed", 0 impressions, while `/industries/government-contractors` runs 43 impressions at 4.2 and `/industries/healthcare-services` 37 at 11.3. It already has 7 inbound links, so the gap is perceived value, not discovery. Added a section on the three four-wall ratios a buyer tests before accepting restaurant EBITDA — prime cost, occupancy as a share of sales, and the gap between restaurant-level margin and company EBITDA — plus one FAQ and its JSON-LD entry. Every figure came from the Texas Roadhouse FY2025 10-K already cited on the page (food and beverage 35.0% vs 33.4%, labor 33.3% vs 33.1%, rent 1.6%, restaurant margin 15.5% vs 17.1%). "Reviewed" moved to October 2026.
- **`/blog/what-happens-after-private-equity-buys-your-company` — retitled** to "What Happens After Private Equity Buys Your Company". It led with the exact term `/blog/private-equity-buyout-explained` targets while sitting at 26.1 on "buyout private equity" (47 imp) and 20.7 on "private equity buyout" (34 imp) — and at 3.8 on its own query. Last title change 09-20, outside the cool-down.
- **Two contextual links into the winner** `/blog/private-equity-buyout-explained` (5 inbound links, positions 47.7 and 11.4), from `/blog/alternatives-to-selling-to-private-equity` and `/blog/selling-to-private-equity-pros-and-cons`, query as anchor text.

## Skipped

- **Low CTR:** seven of eight flagged pages are inside the 28-day cool-down. The eighth, `/blog/how-pe-firms-value-a-company`, is eligible but its impressions are almost all "private equity accounting firm valuation" (pos 66.6) and "private equity and accounting firm valuations" (pos 52.5). No snippet wins at position 60 — content gap, not title fault.
- **Striking distance:** all three queries sit on `/blog/family-business-succession-planning`, expanded 10-13 (clears 10-27). The other two are homepage queries; homepage body copy is off limits.
- **Internal linking:** every post already links to ≥5 others.

## Coverage

32 of 35 PASS. Restaurants addressed above; requesting indexing in Search Console is still the other lever. `/blog/dividend-recapitalization` and `/blog/seller-financing-in-a-business-sale` show "URL is unknown to Google" — both ≤3 days old with 3 and 8 inbound links, so crawl lag, not a fault.

## Needs a human

1. **PE buying accounting firms**: 27 impressions across two variants, ranking 50-66 on a generic page, no page targeting it. Worth a post once the cap clears — public-record rich, needs no deal data.
2. **Request indexing for `/industries/restaurants`** after merge.
3. `seo/tmp-changelog.mjs` is an untracked helper the sandbox would not let me delete — please remove before merging.

## Verification

Every figure in the new section was read off the 10-K itself, not from memory. One draft sentence explained the 1.6% rent line by saying Texas Roadhouse owns much of its real estate; the filing says the opposite — "the majority of our company restaurants are located on leased premises" — so the sentence was rewritten to make the point the filing does support, that a reported rent line is not the same thing as total occupancy cost.

No flags. Nothing added references an IBO Advisors transaction, client, or result; the only specificity is a public SEC filing and arithmetic on a made-up twelve-unit group.
