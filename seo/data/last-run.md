# Daily SEO run — 2026-10-01

Audit clean (0 errors, 0 warnings); one sitemap URL still awaiting a crawl. Four content pages edited and one new post, under rules 3, 4, 5 and 7. First window with prior-period data, but the prior 28 days hold 40 impressions, so rule 6 yields nothing.

## GSC totals — 28 days (2026-09-01 → 09-28)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 67 | 3,399 | 1.97% | 14.2 |
| Prior 28d | 1 | 40 | 2.50% | 13.6 |

The prior window is GSC onboarding, not a baseline. Unusable until ~2026-10-29.

## Changes

| Change | Data point |
|---|---|
| `alternatives-to-selling-to-private-equity` — title + meta | `lowCtr`: 158 impr, 1.27% vs 3.0% expected at pos 9.0; never retitled since 09-08, and the description lacked the query wording |
| `selling-to-private-equity-pros-and-cons` — title + meta | `lowCtr`: 109 impr, 0.92% vs 3.0% at pos 6.2; never retitled since 09-21. New title carries the page's real counts (4 pros, 5 cons) |
| `family-business-succession-planning` — 340-word h2 on the advisory team, `Updated` bumped | `strikingDistance`: "which advisors are best suited to plan the sale of a family-owned company?", 43 impr at 6.3, 0 clicks; the page named no advisor type |
| `management-buyout-vs-private-equity` — rule-5 link | "buyout private equity" (57) and "private equity buyout" (41) split with `what-happens-after-private-equity-buys-your-company`, which wins on 50 and 33 of them. Linked from the loser's first mention, query as anchor |
| **New `/blog/majority-recapitalization`** — 2,143 words, 13 internal links, 4 inbound | Top uncovered keyword (cluster 3), plus "leveraged recapitalization" and "recapitalization vs sale". Worked $5M-EBITDA hypothetical sourced to GF Data via Capital Pad, CT Acquisitions, 26 U.S.C. §721 and §163(j) |

Two reversible deviations: the alternatives title drops `| IBO Advisors` to fit "What Each Pays" in 60 chars; the rule-5 loser keeps its title, since that title is its exact covered keyword and it outranks the winner on both queries.

## Skipped

- **Rule 3** — five `lowCtr` rows in 28-day cool-down (09-08 to 09-18).
- **Rule 4** — three rows are the homepage (body barred); the explainer already answers "what is an ibo"; the 20-impression row is the exact title of a Stanford paper we cite, so that traffic wants the paper.
- **Rule 5** — four of seven rows are apex/`www` duplicates of our own domain.

## Coverage

`/industries/restaurants`, the only non-PASS of 29, now reports "URL is unknown to Google" instead of "Discovered – currently not indexed". It has the 09-26 expansion and six inbound links already, so this is crawl latency. No edit; recheck next run.

## Needs a human

1. **~124 impressions, no page, no keyword entry:** "buyout private equity" (57 @ 23.9), "private equity buyout" (41 @ 18.7), "pe buyout", "equity buyout". Raised 09-26, unactioned — no rule reaches it until it is in cluster 5.
2. **"business valuation calculator"** — 64 impr at position 70.3 on our best commercial term, and apex still outranks `www` on that page (397 impr @ 34.0 vs 85 @ 8.8). Needs links; the 301 is right and consolidation is lagging.
3. **"what is an ibo"** — 72 impr, 0 clicks; `independentbuyout.com` (ours) also ranks page one, so the click may land where this property cannot see it.

## Flagged

Nothing. Banned-phrasing scan: 0 matches; all JSON-LD parses; the approved "$1.8 billion" lines intact in both places.
