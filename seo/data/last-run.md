# Daily SEO run — 2026-09-11

No new post today (cap: 2 published in the trailing 7 days, on 09-05 and 09-08). No striking-distance
expansion was possible — both qualifying queries rank the homepage, whose body copy is off-limits. So
the run went to the audit's largest remaining defect: five posts with **zero** root-relative links to
other posts, and three industry posts with only one inbound link each. Audit: **25 warnings → 11, 0 errors.**

## GSC totals (28d: 2026-08-12 → 09-08)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 12 | 350 | 3.43% | 13.3 |
| Prior 28d | — | — | — | — |

The prior window is `null` in `gsc-latest.json`, so **no week-over-week comparison, no decliner analysis,
and no `lowCtr` list** were possible. Rules 3 and 6 could not be applied on data.

## Changes

**Internal linking (rule 8).** `healthcare-services-ma`, `restaurant-ma`, `ibo-government-contractors`,
`management-buyout-financing`, `choosing-an-ma-advisory-firm` each carried the audit WARN "0 contextual
link(s) to other posts". Added 4–6 in-prose links apiece to the PE-financing, rollover-equity, veto-rights,
IBO-explainer and alternatives posts plus the calculator — inside existing sentences, no appended link lists.

**Inbound links to the industry cluster.** `restaurant-ma`, `healthcare-services-ma` and
`ibo-government-contractors` had exactly one inbound link each (the blog index). Added a sector paragraph
to the PE-sale section of `business-exit-planning-every-option` linking all three. Each now has 2.

**Titles/metas (2, the daily max).** Not from `lowCtr` — that list is empty; these are audit WARNs where
the title is certainly truncated in the SERP.
- `/blog/ibo-government-contractors`: 126 → 60 chars, "government contractor M&A" moved to the front; meta 166 → 150.
- `/blog/restaurant-ma`: 96 → 59 chars; meta 187 → 148.

**Alt text.** Five hero images had `alt=""`. Fixed.

No `Updated` date was bumped — nothing crossed the 150-word substance threshold.

## Considered and skipped

- **Striking distance:** `"shareholder capital" business consultant` (54 impr, pos 9.1) and `what is an ibo`
  (26 impr, pos 9.7) both rank `/`. Homepage body copy is off-limits, so no expansion.
- **Cannibalization:** the same query splits apex (17 impr) / www (54 impr). Both are the homepage; the
  apex→www 301 already shipped in 19a6f1c. Self-resolving, no page edits.
- **Coverage rewrites:** `family-business-succession-planning` and `how-pe-firms-value-a-company` were both
  strengthened on 09-10 and are inside the 14-day cool-down.

## Coverage (3 of 20 not PASS)

| URL | State |
|---|---|
| `/blog/family-business-succession-planning` | Discovered — not indexed (expanded 09-10, never crawled) |
| `/blog/how-pe-firms-value-a-company` | Crawled 09-09 — not indexed (expansion landed 09-10, after the crawl) |
| `/blog/alternatives-to-selling-to-private-equity` | Discovered — not indexed (published 09-08; 11 inbound links, in sitemap) |

All three are crawl lag, not on-page defects. Re-check next run before intervening.

## For a human

1. **`what is an ibo` ranks the homepage, not `/blog/independent-buyout-explained`.** The homepage links to
   zero blog posts. A link from homepage body copy to the explainer (anchor: "what is an Independent Buyout")
   would likely move the right page into that result. I can't edit homepage body copy.
2. **Seven titles still exceed 60 chars** (`ibo-vs-pe-numbers-comparison` at 105, `business-exit-planning-every-option`
   at 90, `management-buyout-financing` at 87). The 2/day cap means ~4 more runs to clear.
3. **Flagged:** `/blog/choosing-an-ma-advisory-firm` opens with firm-level claims — "selling a company for
   $1.8 billion", "60 deals", "more than 100 transactions". Pre-existing, so left untouched, but it sits close
   to the no-deal-data rule and is worth a compliance read.
