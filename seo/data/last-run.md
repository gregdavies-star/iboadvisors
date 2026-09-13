# Daily SEO run — 2026-09-12

Cleared four of the five posts flagged as orphaned on 09-10 (four is the cap) and published the priority-2 post the keyword map has been missing. `lowCtr` and `decliners` were empty; both `strikingDistance` queries rank the homepage, whose body copy is off-limits. Audit warnings 25 → 11, 0 errors.

| 28d to 2026-09-09 | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 16 | 527 | 3.04% | 16.2 |
| Prior 28d | — | — | — | — |

GSC still returns `previous: null`. Per `history.jsonl`, impressions have run 145 → 253 → 307 → 527 and pages with impressions 6 → 22 over four runs.

## New post

**`/blog/what-happens-after-private-equity-buys-your-company`** — 2,050 words, on an uncovered priority-2 keyword STRATEGY.md names as intercept demand. Covers the 100-day plan, debt service on a made-up $6M-EBITDA company, CEO turnover, the consent list, monitoring fees, add-ons, hold length, and a hypothetical rollover waterfall. Every citation was opened first, led by two SEC releases on accelerated monitoring fees (Blackstone 2015, American Infrastructure Funds 2023) and NBER WP 26371. Nine internal links out, including all three unindexed URLs.

## Changes (4 content pages — the cap)

Each had 0 contextual links out, an over-length title, and an empty hero alt.

- **`choosing-an-ma-advisory-firm`** — 6 links + calculator; title 78→58, meta 158→140.
- **`healthcare-services-ma`** — 6 links + calculator; title 78→56, meta 162→146.
- **`ibo-government-contractors`** — 5 links + calculator; title 126→60 (the longest on the site), meta 166→142.
- **`management-buyout-financing`** — 6 links + calculator; title 87→52; 1,324→1,437 words.

## Flagged (hard rule)

`choosing-an-ma-advisory-firm` opened with *"selling a company for $1.8 billion… 60 deals… more than 100 transactions"*. Removed; the judgment behind it kept as general knowledge. A grep for the banned patterns now returns nothing across all HTML.

## Skipped

Three URLs remain unindexed — `alternatives-to-selling-to-private-equity` and `family-business-succession-planning` (*Discovered*), `how-pe-firms-value-a-company` (*Crawled*). All were touched 09-08/09-10 and are inside the 14-day cool-down, so they got inbound links from PASS pages instead. `restaurant-ma` is the last orphan; it leads next run.

## Needs a human

1. **Apex/www.** `iboadvisors.com` still sits beside `www` in the sole `cannibalization` entry, but that data predates the apex 301 (commit `19a6f1c`). Check `curl -I https://iboadvisors.com/` on production; if it 301s, this clears on recrawl.
2. `"shareholder capital" business consultant` — 54 impressions at position 9.1, 0 clicks. It inflates the totals; don't rank-chase it.
3. `/business-valuation-calculator` — title 74, meta 194, 19 inbound links. Rule 3 allows a rewrite only on a `lowCtr` entry and it has none; approve one and next run takes it.
