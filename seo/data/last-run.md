# Daily SEO run — 2026-10-12

First run since 09-26, so every cool-down had expired and `totals.previous` is populated for the first time. Clicks are up 4x on the prior 28 days and average position improved four places. Budget went to the two worst CTR gaps and the one genuinely uncovered priority-3 keyword.

## GSC totals — 28 days (2026-09-12 → 10-09)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 79 | 4,064 | 1.94% | 12.6 |
| Prior 28d | 19 | 913 | 2.08% | 16.8 |

## Changes — 4 content pages, 1 new post

| Change | Data point |
|---|---|
| **`/blog/family-business-succession-planning`** — title + meta rewrite | `lowCtr`: 577 impr, 2 clicks (0.35%) at pos 13.2 vs a 1.0% expectation — the biggest expected-click gap on the site. Title last changed 09-10 |
| Same page — two new `<h2>` sections (~1,100 words) | `strikingDistance`: "liquidity planning for family business succession" 158 impr @ 17.8, "which advisors are best suited to plan the sale of a family-owned company?" 101 impr @ 6.3, plus a third advisor query at 31 impr @ 7.7. Added a liquidity-planning section (four competing claims, a funding table on the page's existing invented $4M EBITDA company showing a $4.9M debt burden against $3.0M of available cash) and a seven-role advisor table. Sourced to *Connelly v. United States* (June 6, 2024) |
| **`/blog/minority-recapitalization-explained`** — title + meta rewrite | `lowCtr`: 116 impr, **0 clicks** at pos 6.7 vs a 3.0% expectation. Title last changed 09-08 |
| **New: `/blog/majority-recapitalization-explained`** — 2,184 words, 11 internal links | Highest-priority uncovered keyword in `keywords.json` (cluster 3); the term already draws impressions on the minority-recap page. Sourced to Goodwin's PE deal database (rollover in 46% of $25–500M deals in 2020 → 57% in 2023), PCE Companies, Koley Jessen, and 26 U.S.C. §§ 351/1042 — all opened before citing. Slightly over the 2,000-word cap; the overage is two numeric tables |
| `what-happens-after-pe-buys-your-company` → `/industries/restaurants` + new post | Highest-crawl-demand indexed blog page (455 impr) |
| `selling-to-pe-pros-and-cons`, `minority-recap` → new post | 242 impr @ 8.8 and the cluster-3 hub |

## Coverage

`/industries/restaurants` is still the only non-PASS URL — "Discovered, currently not indexed", unchanged since the 09-26 run added 420 words and two inbound links. It now has **7 inbound links**, more than its two indexed siblings (4 each), and ~2,400 words. Content and links are not the constraint; Google has not crawled it. I added a third strong donor rather than padding the page further. If it has not been crawled by the next cycle, this is a manual "Request indexing" in Search Console, not an on-page fix.

## Skipped

- **Rule 5 (cannibalization)** — 4 of 6 rows are brand/category terms where our own pages split impressions, and `independentbuyout.com` ranks alongside us on "independent buyout", so apparent click loss is not measurable here. The two real rows ("buyout private equity", "private equity buyout") pit `management-buyout-vs-private-equity` (11 impr @ 6.9) against `what-happens-after-pe-buys-your-company` (52 impr @ 26.3) — no action while the better-positioned page has the smaller footprint.
- **Rule 6 (decliners)** — none; every page grew.
- **Rule 3** — 8 further `lowCtr` rows left untouched: the daily cap is 2, and five of them are posts published inside the last 28 days.

## For a human

- `https://iboadvisors.com/business-valuation-calculator` (apex, no `www`) drew **298 impressions at position 30.5** in this window and appears again in the "ibo advisors" cannibalization row. The apex→www 301 was verified on 09-15, so this is likely a stale index entry — worth confirming in Search Console that the apex URL is reported as "Alternate page with proper canonical".
- `/blog/what-happens-after-a-private-equity-buyout` still draws an impression at position 1. The 301 to `/blog/what-happens-after-private-equity-buys-your-company` is already in `vercel.json` (`permanent: true`), so this is a lagging index entry and needs nothing — dropping the flag earlier runs raised.
- No Ahrefs data in the repo, so rule 7's volume/KD preference could not be applied.
