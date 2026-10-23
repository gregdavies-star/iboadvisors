# Daily SEO run — 2026-10-23

First clean run since #66 merged on 10-21: no unmerged branch, so no duplicate post this time. One new post, two title/meta rewrites, three inbound links, and a keyword-map fix that closes the loop which produced seventeen duplicates.

| Window | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| 23 Sep – 20 Oct | 77 | 4,000 | 1.92% | 11.4 |
| Prior 28 days | 51 | 2,276 | 2.24% | 16.1 |

Impressions up 76%, clicks up 51%, average position up 4.7 places. CTR fell because the new impressions arrive at positions 10–25.

## Changed

- **New post — `/blog/adjusted-ebitda-add-backs`** (rule 7; one post shipped in the trailing 7 days). Highest-priority genuinely uncovered keyword once cluster 4's mis-mapping is fixed. 2,412 words, four sources, all opened: the SEC's non-GAAP C&DIs (100.01–100.04, 100.06); Gen Digital's credit agreement on EDGAR — twelve "plus" clauses, run-rate savings capped at 30% of Consolidated EBITDA, a "big four" QoE named as the evidence standard; GF Data via ACG (360 deals, 7.4x with a sell-side QoE vs 7.0x without); St. Louis Fed WP 2022-029. Worked example is an invented $5M-EBITDA contractor. **Not used:** S&P's add-back studies (spglobal.com 403s) and the "22% of add-backs rejected" figure that advisory blogs attribute to SRS Acquiom but SRS Acquiom does not publish.
- **`/blog/what-happens-after-private-equity-buys-your-company`** — title + meta. 300 impressions, 1.33% CTR at position 9.4 against 3.0% expected. Also rule 5: the old title led with "Private Equity Buyout", which `/blog/private-equity-buyout-explained` should own; the new one leads with this page's own query.
- **`/ebitda-multiples-by-industry`** — title + meta, never changed before. 339 impressions, 0.59% at position 16.6.
- **Three inbound links** to the new post, from `/blog/how-pe-firms-value-a-company` (26 in-links), `/ebitda-multiples-by-industry`, and `/blog/dividend-recapitalization` (3 in-links, the site's thinnest).
- **`seo/keywords.json`** — mapped three cluster-4 keywords that pages already target but the map read as uncovered.

## Considered and skipped

- **Striking distance (4 rows).** Three are `/blog/family-business-succession-planning` (158, 101 and 31 impressions), last content-edited 10-13 — inside the 14-day cool-down. The fourth is "ibo finance" on the homepage, whose body copy is off limits.
- **Five lowCtr rows** inside the 28-day title cool-down. `/blog/how-pe-firms-value-a-company` was outside it but skipped: its logged queries are "private equity accounting firm valuation" at position 66.6 and 52.1 — topical drift, not a snippet fault.
- **The single decliner** is the apex `iboadvisors.com`, 7 clicks to 0. That is the apex→www 301 consolidating, not a loss.
- **Cannibalization on "ibo advisors" / "independent buyout".** The homepage wins all three at positions 1.1–3.6. No action.

## Coverage

32 of 33 PASS. `/industries/restaurants` has slipped from "Discovered – currently not indexed" to **"URL is unknown to Google"**. It is in `sitemap.xml`, carries 7 inbound links from every natural donor including `/blog/restaurant-ma`, and has been expanded twice (09-26, 09-27). On-page levers are exhausted.

## For a human

1. **Request indexing** for `/industries/restaurants` in Search Console. Nothing else will move it.
2. "Private equity accounting firm valuation" and its variant drew 30 impressions at positions 52–67 against `/blog/how-pe-firms-value-a-company`. That is an industry page we do not have — a cluster-7 candidate alongside the HVAC and dental entries.

No 301s proposed. Nothing flagged under the no-deal-data rule.
