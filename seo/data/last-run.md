# Daily SEO run — 2026-10-14

The 16-run stack merged to `main` this morning (PR #56), so this is the first run in a month reading a repo that matches the live site. With cool-downs now checkable, every `lowCtr` and `strikingDistance` row resolves to blocked-or-not-evidenced. One new post and five internal links instead; no duplicate post, no title rewrite.

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current (09-14 → 10-11) | 78 | 3,918 | 1.99% | 11.9 |
| Prior 28d | 21 | 1,161 | 1.81% | 18.3 |

Clicks 3.7x, position up 6.4 places, no decliners.

## Changes

- **New post `/blog/seller-financing-in-a-business-sale`** (rule 7) — highest-priority uncovered keyword, cluster 3. Nothing on the site is about seller notes; the MBO-financing post covers them only as one layer of a buy-side stack. Sourced to IRC [§ 453](https://www.law.cornell.edu/uscode/text/26/453), [§ 453A](https://www.law.cornell.edu/uscode/text/26/453A) (the $5,000,000 threshold and the pledging rule), [§ 1274A](https://www.law.cornell.edu/uscode/text/26/1274A), [IRS Pub 537](https://www.irs.gov/publications/p537) and the [SRS Acquiom 2026 LMM study](https://www.srsacquiom.com/our-insights/lower-middle-market-deals/) (4,400+ deals; earnouts in 29% ≤$50M). Invented company, arithmetic re-derived. 2,645 words against the 1,200–2,000 target: the overage is the four installment-sale rules, in line with the site's other pillars.
- **Five internal links** into the un-indexed pages. `/blog/private-equity-buyout-explained` (4 inbound) and `/blog/earnout-in-business-sale` (5) were the weakest on the site; linked from `how-pe-firms-value-a-company` (24 inbound), `how-to-sell-a-business-to-private-equity`, `how-private-equity-actually-finances-a-buyout` (22) and `management-buyout-financing`.
- **`seo/keywords.json`** — the pe-buyout trio read as uncovered in clusters 3 and 5 despite cluster 2 mapping it to `/blog/private-equity-buyout-explained`. That mis-read is the mechanism behind ten dropped duplicate posts. Mapped everywhere; cluster-3 duplicates removed.

## Skipped

- **All 10 `lowCtr` rows.** Seven are inside the 28-day cool-down. The three eligible ones show no snippet fault: `/blog` earns 55 of its 344 impressions on *ibo advisors* at p2.7, where the homepage takes the click at p1.1; `how-to-sell-a-business-to-private-equity` averages p16.1 only because brand queries lift it, its head terms sitting at p25–33; `independent-buyout-explained` (p4.9, 0 clicks) competes on IBO-definition queries with **independentbuyout.com, which we own** — those clicks are invisible here. All three titles are already exact-match at 49–59 chars.
- **All 6 `strikingDistance` rows.** Three are `family-business-succession-planning`, edited nine runs running and last on 10-13; two are homepage queries, where body copy is off-limits; the sixth is a quoted-phrase search on a page edited 10-03.
- **Cannibalization** — brand rows across our own estate. The *private equity buyout* split has a designated winner that shipped today; it needs indexing, not routing.

## Needs a human

- **`/industries/restaurants`: request indexing in Search Console.** Live since September, 7 inbound links, correct canonical, in the sitemap — and URL Inspection has never once returned a `lastCrawlTime`. Third consecutive run to reach this independently; no on-page work fixes a URL Google is not fetching. The other five un-indexed URLs only went live today.
- 15 of 27 blog-index card excerpts differ from their page metas. Pre-existing, already noted by hand on 10-13; flagged so the scope is known.

Audit: 34 pages, 0 errors, 0 warnings. No deal data added, banned-phrasing scan clean, all `jobTitle` values read Managing Partner.
