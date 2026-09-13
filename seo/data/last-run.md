# Daily SEO run — 2026-09-13

One new post filling the highest-priority uncovered keyword, two truncated titles/metas rewritten, and
links added to reach the site's only 0-inbound post. Audit: **11 warnings → 7, 0 errors.**

## GSC totals (28d: 2026-08-14 → 09-10)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 17 | 738 | 2.30% | 16.4 |
| Prior 28d | — | — | — | — |

`totals.previous` is `null` again, so **no `lowCtr` and no `decliners` lists exist**. Rules 3 and 6 could
not be applied on data for the third run running.

## Changes

**New post (rule 7)** — one published in the trailing 7 days, so the cap allowed one.
`/blog/how-to-sell-a-business-to-private-equity`, 1,980 words: first uncovered keyword in the priority-2
cluster, and GSC shows ~33 impressions on adjacent process queries (`management buyout`, `management buyout
funding`, `types of buyouts`) with nothing targeting the PE-sale process. Stage-by-stage timeline, then a
$6M-EBITDA hypothetical walking $40.8M of headline enterprise value down to ~$28.6M of cash at close.
12 internal links; four sources opened with WebFetch (PCE, Bain, GF Data via Capital Pad, SRS Acquiom).

**Titles/metas (2, the daily max)** — not from `lowCtr` (empty); audit WARNs where truncation is certain.
`ibo-vs-pe-numbers-comparison` 105 → 52 chars, meta 168 → 139, now leading with its priority-1 keyword.
`business-exit-planning-every-option` 90 → 60, meta 161 → 148.

**Links** — `/blog/exit-planning-for-business-owners` had **zero** in-body inbound links and ranks at
position 85.8 for its own exact-match query; linked from the cluster hub. The new post got two inbound
links from indexed pages. No `Updated` date bumped.

## Considered and skipped

- **Striking distance:** both qualifying queries (`"shareholder capital" business consultant`, pos 9.1;
  `what is an ibo`, pos 9.8) rank `/`, whose body copy is off-limits.
- **Cannibalization:** `what is an ibo` splits `/` (30 impr, 9.8) and `independent-buyout-explained`
  (9 impr, 7.2). The explainer should win; the fix is a homepage link I can't make. The other splits are
  apex vs www, self-resolving via the shipped 301.
- **`independent-buyout-explained`:** the "IBO meaning" family is ~74 impressions at ~pos 9, our biggest
  on-topic pool — but the post is inside its 14-day cool-down. **Expand after 09-19.**

## Coverage (3 of 20 not PASS, unchanged)

`family-business-succession-planning` and `alternatives-to-selling-to-private-equity`: Discovered, never
crawled. `how-pe-firms-value-a-company`: crawled 09-09, before its 09-10 expansion. All three already have
4–11 in-body inbound links and 1,884–2,316 words, so rule 2's remedy is spent. Crawl lag, not a page defect.

## For a human

1. **Homepage → blog link**, anchor "what is an Independent Buyout", to `/blog/independent-buyout-explained`.
   Highest-value change available and outside my remit.
2. **Calculator title (74) and meta (194 — longest on the site).** Only rule 3 licenses touching it.
3. **Flagged, unchanged from 09-11:** `choosing-an-ma-advisory-firm` still carries "$1.8 billion", "60 deals",
   "more than 100 transactions". Kept per "keep and flag"; needs a compliance read.
