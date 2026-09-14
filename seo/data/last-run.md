# Daily SEO run — 2026-09-14

First real `lowCtr` entry since GSC came online, so rule 3 ran on data rather than audit warnings.
No new post — three in the trailing 7 days, over the cap. Audit: **0 errors, 3 warnings → 2**.

## GSC totals (28d: 2026-08-15 → 09-11)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 19 | 913 | 2.08% | 16.8 |
| Prior 28d | — | — | — | — |

`totals.previous` is still `null`, so `decliners` is empty and **rule 6 did not run**, fourth time running.

## Changes

**Title + meta (rule 3)** — `/blog/independent-buyout-explained`, the only `lowCtr` entry: 129 impressions,
2 clicks, **CTR 1.55% vs 3.0% expected at position 5.7**. Demand is exact-string — `what is an ibo`
(19 impr, pos 7.1), `ibo meaning in business` (9), `whats an ibo` (6) — which the old tag never matched
head-on. Now `What Is an IBO? Independent Buyout Explained` (59 chars); meta rewritten to 150 chars opening
with the definition; og/twitter updated. No prior title/meta change here, so the cool-down was clear.

**Title (audit WARN)** — `/blog/exit-planning-for-business-owners` 70 → 57 chars, the blog's last truncation
warning. Low expected effect: it sits at **position 85.1** for its own query, so ranking, not CTR, is its
problem.

**Links (rule 8)** — the three industry posts had **2 inbound each**, thinnest on the site. Linked all three
in-prose from two indexed donors (`what-happens-after-private-equity-buys-your-company`,
`alternatives-to-selling-to-private-equity`), plus one to `how-to-sell-a-business-to-private-equity`.
Industry posts now 4 inbound each. +125 words, so **no `Updated` bump**.

## Considered and skipped

- **Striking distance:** both qualifying queries (`"shareholder capital" business consultant`, 54 impr /
  pos 9.1; `what is an ibo`, 30 impr / pos 9.8) rank `/`, whose body copy is off-limits.
- **Expanding `independent-buyout-explained`:** inside its 14-day cool-down (published 09-05). Revisit
  after 09-19 — the "what is an IBO" family is ~95 site-wide impressions, mostly positions 5–10, zero clicks.
- **Calculator title (74) / meta (194):** not in `lowCtr`, so rule 3 does not license it.

## Coverage (2 of 22 not PASS, down from 3)

`alternatives-to-selling-to-private-equity` is now indexed. `how-pe-firms-value-a-company` was last crawled
**09-09, before** its 09-10 expansion. `family-business-succession-planning` reads "URL is unknown to
Google" despite a correct canonical, a sitemap entry, and 7 inbound links from 6 indexed pages. Crawl lag,
not a page defect.

## For a human

1. **Homepage → blog link**, anchor "what is an Independent Buyout", to `/blog/independent-buyout-explained`.
   `/` absorbs ~48 impressions of IBO-definition demand at pos 9–10 and converts none; the explainer ranks
   better (7.1) on the same queries. Outside my remit.
2. **Calculator title and meta** — needs sign-off to touch.
3. **Flagged, unchanged:** `choosing-an-ma-advisory-firm` still carries "$1.8 billion", "60 deals",
   "more than 100 transactions". Needs a compliance read.
