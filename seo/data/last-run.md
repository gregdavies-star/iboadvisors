# Daily SEO run — 2026-10-13 (folded into the open stack)

Run #48 fired at 17:52 UTC, +6.9 hours after its 11:00 cron. Steps 1-11 succeeded; only step 12 (open a pull request) failed, as on every run since the repo setting blocking Actions from creating PRs was found off. This is the sixteenth run folded onto this branch.

## GSC totals — 28 days (2026-09-13 → 10-10)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 78 | 3,974 | 1.96% | 12.2 |
| Prior 28d | 20 | 1,046 | 1.91% | 18.0 |

Clicks nearly quadrupled and average position improved 5.8 places against the prior window. Both windows predate anything on this branch, which has not shipped.

## Kept from the run

- **Fresh GSC data** (`gsc-latest.json`, `gsc-coverage.json`).
- **A three-scenario preference waterfall**, carried from the dropped duplicate post into `/blog/majority-recapitalization-vs-sale` and re-derived on that post's own invented company. This fills a real gap: the page already asserted that the liquidation preference "decides more second-bite outcomes than growth does" while the table above it modelled no preference at all, so the site's strongest claim about the preference was unsupported on the only page making it. Three earlier runs circled this gap without filling it. Figures re-derived from GF Data's Q3 2025 ESOP Advisor report (Tables 1 and 3-4) via Capital Pad: 6.8x and 4.0x/3.4x for the $25M-$50M enterprise-value tier, first nine months of 2025.
- **The M&A broker registration exemption**, one paragraph appended to the existing advisor section of `/blog/family-business-succession-planning`. Verified directly against 15 U.S.C. § 78o(b)(13): added by Pub. L. 117-328 effective 90 days after 2022-12-29; prior-fiscal-year EBITDA under $25,000,000 **or** gross revenues under $250,000,000; the buyer must both control and be active in management; custody of funds is one of nine disqualifying activities. The run's version named custody as though it were the only condition, so the paragraph as written states the exemption as conditional.

## Dropped from the run

- **`/blog/majority-recapitalization`** — the twelfth duplicate post in this stack, on a slug already dropped on 10-03, duplicating `/blog/majority-recapitalization-vs-sale`. Root cause unchanged and unchanged all month: every run reads a `main` that lacks this stack, so the same keywords keep reading as uncovered. Merging the PR is the only fix.
- **Two H2s on `/blog/family-business-succession-planning`** (~860 words). Both duplicate sections already on this branch, and the liquidity one **contradicts** it: it derives an $11 million cash-at-close ceiling from the 4.0x total-debt multiple where the shipped section derives about $8 million from the 3.4x senior multiple, and it reprices the page's invented company at 6.8x/$27M against its established 7.0x/$28M. The advisor table gave five roles against the shipped section's six, which the page's own FAQ ("Six roles, not one firm") depends on. Ninth run to edit this file.
- **Title and meta on `/blog/family-business-succession-planning`** — sixth consecutive run to propose rewriting this title; the 10-08 rewrite on this branch has not shipped.
- **Title and meta on `/blog/selling-to-private-equity-pros-and-cons`** — same reason; rewritten on this branch on 10-08, unshipped.
- **Three link additions.** All three already exist on this branch pointing at the right targets. The third was the fourth attempt to route "private equity buyout" at `/blog/what-happens-after-private-equity-buys-your-company`; this branch covers the term with `/blog/private-equity-buyout-explained`, links it from that page with that anchor, and maps the whole trio there in `keywords.json`.

## Coverage — a regression worth a human

`/industries/restaurants` moved from "Discovered – currently not indexed" to **"URL is unknown to Google"**. That is backwards: a URL Google had previously discovered now reads as one it has never seen. This is a single day's inspection reading and could be a transient API response, so it is worth re-reading tomorrow before drawing a conclusion from the direction of travel. The reading itself is unambiguous though: no `lastCrawlTime`, and both `robotsTxtState` and `indexingState` come back unspecified. It is in the sitemap, its canonical is correct, it was expanded on 09-26, and it carries 6 inbound internal links against 4 each for its two indexed siblings. The URL inspection has never returned a `lastCrawlTime` for it at all. No amount of on-page work or internal linking fixes a URL Google is not fetching. **Request indexing in Search Console** is still the only lever, and this is the second consecutive run to reach that conclusion independently.

## Stale asks the run repeated

- The ~165-impression pe-buyout pool with "no page" and "not in `keywords.json`". This branch has `/blog/private-equity-buyout-explained`, `/blog/types-of-buyouts`, and all four terms mapped. The run cannot see them.
- Apex and www both appearing for the calculator. The 301 is correct and GSC reports a 28-day rolling window, so consolidation cannot show yet. Closed.

## Verification

Arithmetic re-derived from scratch for the preference table and the run's own waterfall; both internally consistent. Source dates and periods checked on the Capital Pad page (GF Data Q3 2025 ESOP Advisor report; `?p=505747` 301s to the canonical URL, so the canonical form is used). § 78o(b)(13) read in full, including the nine excluded activities, the control-and-active-management test and the effective-date note. Heading check across all changed pages, including the full H2 list per page, since a duplicate section auto-merged without conflicting on 10-11. Blog-card excerpts checked against page metas. All 27 `jobTitle` values read "Managing Partner". Both approved biography lines present. No deal data, client references, counts, sizes, timelines or outcomes added. Banned-phrasing scan clean.
