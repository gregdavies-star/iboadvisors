# Daily SEO run — 2026-11-13

**`/industries/restaurants` is ranking.** Three weeks of "Discovered - currently not indexed" ended with the 11-09 crawl, and this is the first window covering it: 27 impressions at position 11.7, a first appearance. No new post (7-day cap full), no retitle (both eligible rows already handled on open PR #75). Three internal links; audit clean, 39 pages, 0 errors.

## GSC totals (28 days to 2026-11-10 vs prior 28)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 82 | 6,331 | 1.30% | 10.7 |
| Prior | 76 | 3,760 | 2.02% | 11.5 |

Impressions +68%, position +0.8, clicks +6. CTR falls because the new impressions are long conversational queries that click at roughly zero.

## Changes (rule 8)

| Page | Data point |
|---|---|
| `/blog/independent-buyout-explained` | `/blog/private-equity-holding-period` had 6 inbound, tied for the site floor. The donor is the category cluster's strongest page (27 in-links) and already quotes the 5.4-year median; that phrase is the anchor. |
| `/blog/types-of-buyouts` | Second donor, same target (6 → 8). Its secondary-buyout FAQ already ended on "the holding period starts over". |
| `/industries/restaurants` | `/blog/sde-vs-ebitda` had 6 inbound (6 → 7). The hub's FAQ prices single units on seller's discretionary earnings and never explained the term. Wording unchanged, so the FAQPage JSON-LD still matches. |

## Skipped

- **Rule 3.** 10 of 12 `lowCtr` rows are in cool-down or closed by STRATEGY §8. `/blog/family-business-succession-planning` (340 impressions, 0 clicks at 4.7) was retitled on PR #75 on 11-12; `/blog/selling-to-private-equity-pros-and-cons` (149, 7.0) already leads with its exact head query. `/blog` becomes eligible 11-14.
- **Rule 4.** Three of six `strikingDistance` rows are the blog index or homepage; "types of buyouts" is that page's own topic; `/ebitda-multiples-by-industry` and `/blog/majority-recapitalization-vs-sale` clear their 14-day cool-down on 11-17.
- **Rule 6.** `/blog/how-private-equity-actually-finances-a-buyout` fell 5 → 1 clicks, but its title and meta were rewritten on 11-07, 11-08 and 11-09, so nothing is measurable yet. Its lead query "buyout financings" returns generic LBO explainers on the debt split, which the page works out in more detail. No gap.
- **Rule 7.** Two posts in the trailing 7 days: holding-period (11-09) and the founder-CEO post (11-12, PR #75).

## Coverage

All 39 sitemap URLs `PASS`, second pull running. `/industries/restaurants` reports `lastCrawlTime` 2026-11-09T22:07:19Z; its first queries are restaurant-EBITDA-multiple variants at 9-12.5. `/blog/restaurant-ma` holds 54 impressions at 6.9 on different queries — no sign the two compete.

## For a human

- PR #75 is still open. This branch is built on `main` and merges cleanly, but the figures above describe a site without its changes.
- Cluster 5's last keyword, "private equity debt on acquired company", overlaps the finance post heavily: write it or drop it? (Raised 11-12.)
- `/blog/quality-of-earnings-report` is at 5 inbound links, the floor, with no unlinked mention of the term left to use as a donor.

## Flagged

Nothing asked for deal specifics. The five standing-rule-5 "control" wordings listed on PR #75 are unchanged on disk; not re-enumerated, to avoid sending a reviewer over the same ground twice.
