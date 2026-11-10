# Daily SEO run — 2026-11-10

`/industries/restaurants` has been crawled for the first time and is indexed, so **all 39 sitemap URLs return `PASS`** — the first clean coverage report. One title/meta rewrite, one internal link. Audit clean: 39 pages, 0 errors, 0 warnings.

## GSC totals (28 days to 2026-11-07 vs prior 28)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 80 | 5,663 | 1.41% | 11.0 |
| Prior | 78 | 3,974 | 1.96% | 12.2 |

Impressions +43%, position +1.2, clicks +2 — the new impressions land at 10-20, diluting CTR before they earn clicks.

## Changes

| Page | Change | Data point |
|---|---|---|
| `/blog/family-business-succession-planning` | title + meta | `lowCtr`: 256 impr, 1 click (0.39%) at position 4.8 vs 6.0% expected, last changed 10-13. **205 of the 256 are one query** — "liquidity planning for family business succession", position 3.8, zero clicks — which the old title did not contain. New title is that query, front-loaded, 49 chars; the meta carries the page's finding ($26M of claims against $23M of equity). |
| `/blog/how-to-sell-a-business-to-private-equity` | link | Rule 8: `/blog/quality-of-earnings-report` held 5 inbound links, the site floor. The donor's diligence step already said "a buy-side quality-of-earnings review" and did not link it. |

## Skipped

**Rule 3** — 11 of 13 `lowCtr` rows in cool-down; the twelfth, `selling-to-private-equity-pros-and-cons`, already leads with its exact query and shows only 13 of 134 impressions in `pageQueries`, so a retitle is churn (STRATEGY §8). **Rule 4** — two rows rank `/blog`, not a post; "ibo finance" is homepage body copy; `majority-recapitalization-vs-sale` was edited 11-03; `types-of-buyouts` already answers both its queries under their own H2s. **Rule 5** — the loser in all three non-brand rows is the blog index, which already links the winner. **Rule 6** — none. **Rule 7** — capped, 2 posts in 7 days.

## Coverage

`/industries/restaurants` returned a `lastCrawlTime` for the first time, **2026-11-09T22:07:19Z**, and moved to "Submitted and indexed" — the signal STRATEGY §8 said to wait for. The crawl predates your 11-10 request, so it likely came from the earlier one. No ranking read yet; the window ends 11-07.

## For a human

`/blog` is the third-largest page by impressions (456, 1 click, position 20.7) and is the URL Google picks for "owner buyout" (11.7), "buyouts alternatives" (5.1), "buyout companies" (22.4) and "types of buyouts" (51.9). An index page winning post-level queries is weak — worth deciding whether "owner buyout" gets its own post.

## Flagged

Standing rule 5 (post audit pending your approval), verified on disk today: `minority-recapitalization-explained` ("you keep majority ownership, board control, and operating authority") and `rollover-equity-second-bite-explained` ("sell and still keep control"). Two more, not previously reported: `selling-to-private-equity-pros-and-cons` (two) and `what-happens-after-private-equity-buys-your-company`, both phrased as the owner's question rather than a claim. Reported, not edited. Nothing asked for deal specifics.
