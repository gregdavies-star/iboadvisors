# Daily SEO run — 2026-11-15

**`/industries/restaurants` is indexed.** URL Inspection returned the first `lastCrawlTime` ever recorded for it — 2026-11-09T22:07:19Z, `PASS`, "Submitted and indexed" — and all 40 sitemap URLs now pass. Also rewrote the site's worst CTR gap and published one new post. Audit clean: 0 errors, 0 warnings.

## GSC totals (28 days to 2026-11-12 vs prior 28)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 77 | 6,855 | 1.12% | 10.5 |
| Prior | 80 | 3,766 | 2.12% | 11.2 |

Impressions +82%, position +0.7, clicks flat — the same dilution as the last three runs.

## Changes

| Page | Change | Data point |
|---|---|---|
| `/blog/family-business-succession-planning` | title + meta | lowCtr: 355 impressions, **0 clicks at position 4.9** vs 6.0% expected — the site's biggest gap. 288 of its 313 visible impressions are one query, "liquidity planning for family business succession" at 3.9, which the old title buried after the colon. Now `Liquidity Planning for Family Business Succession`. Last changed 10-13. |
| `/blog/private-equity-replace-founder-ceo` | **new post**, 2,153 words | Rule 7, cap open; top uncovered keyword in cluster 5. Four sources, all opened with WebFetch: AlixPartners 2026 (427 respondents, nearly two-thirds replace the portfolio CEO during the hold), Russell Reynolds via Harvard corpgov (135 of 196 European exits changed CEO; 24% in year one vs 60%+ after year two), Spencer Stuart (155 changes; planned ones often replace the founder *after the earn-out*), AlixPartners 2018. The leaver/earn-out table is invented arithmetic on a made-up $40M company. 150 words over the guide. |
| 2 posts | link | Inbound links for it, on sentences already citing the same survey without its timing. |
| `seo/STRATEGY.md` | note | Closed the restaurants entry in §8. The crawl predates your 11-10 request by a day, so the queue cleared it, not the resubmission. |

## Skipped

**Rule 3** — one rewrite, not two. `/blog` is out of cool-down but sits at 19.4, where no title earns clicks; `/industries/restaurants` (0 clicks at 9.2) already leads with "Restaurant EBITDA Multiples" and has six days of data — leave it to ~12-07. Nine rows in cool-down; the PE primer is closed per §8. **Rule 4** — nothing eligible: three rows rank `/blog`, two are homepage body copy, `types-of-buyouts` already answers its query, and two pages were edited 11-03 (free 11-17). **Rule 5** — the `/blog` ↔ `types-of-buyouts` rows already carry the 11-02 anchor remedy. **Rule 6** — the homepage lost 24 clicks; 13 are brand demand ("ibo advisors" 54 → 32 impressions at an unchanged 1.1 and 59% CTR), so there is no snippet fault to fix. **Rule 7** — still no `ahrefs-latest.json`.

## For a human

`/blog/sell-a-business-but-keep-control` shows 223 impressions at 6.3, but `vercel.json` already 301s it to `/blog/alternatives-to-selling-to-private-equity` — historical, will decay. Still open from 11-09: "industry multiples database" and "private equity accounting firm valuation" rank on untargeted terms.

## Flagged

Rule-5 "control" wording, six instances verified on disk today, for the audit pending your approval. Both 11-09 flags stand (`rollover-equity-second-bite-explained`, `minority-recapitalization-explained`). Three new: `what-happens-after-private-equity-buys-your-company`, `selling-to-private-equity-pros-and-cons` (body plus the FAQ heading "Can I keep control and still take money off the table?") and `family-business-succession-planning` ("selling a minority position without giving up control"). Reported, not edited. Nothing asked for deal specifics.
