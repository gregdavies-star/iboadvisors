# Daily SEO run — 2026-10-08

Audit clean (0 errors, 0 warnings). A real prior window finally exists: impressions up 13.8x, clicks up 7.6x, position 15.6 → 13.7.

The run's own report opened "first run since 09-26". That is what `main` looks like, not what has happened: this is the twelfth daily run since 09-26, and eleven of them are stacked unmerged on this branch. Because every run reads `main`, each one re-reads the same cluster-3 keywords as uncovered and the same pages as never rewritten. This run wrote a seventh majority-recapitalization post for that reason.

## GSC totals — 28 days (2026-09-08 → 10-05)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 76 | 4,222 | 1.80% | 13.7 |
| Prior 28d | 10 | 307 | 3.26% | 11.8 |

CTR fell because impressions grew into page-2 positions, not because snippets got worse. **No decliners** (rule 6).

## Changes kept — 4 pages edited, 0 new posts

| Change | Data point |
|---|---|
| **`family-business-succession-planning`** — title + meta rewritten around liquidity; two pieces added to the existing advisor section | Biggest CTR gap on the site: **503 impr, 2 clicks (0.40%) vs 1.0% expected at 13.5**. The 09-10 title cool-down expired today. Targets "which advisors are best suited to plan the sale of a family-owned company?" (88 impr @ **6.3**) and the integrated tax/estate query (24 @ 7.8) |
| **`management-buyout-vs-private-equity`** — 456-word MBO/MBI/BIMBO/LBO/secondary-buyout comparison table, plus the rule-5 link out | Rule 2: the only **"Crawled – currently not indexed"** URL. 2,300 words and 8 inbound links, so differentiation, not thinness. Serves "leveraged buyout vs management buyout" (2 @ 22.0) and two sibling comparisons |
| **`selling-to-private-equity-pros-and-cons`** — title now leads with the head phrase; meta carries "advantages and disadvantages" **and** the worked figure | **211 impr, 1 click (0.47%) vs 3.0% expected at 8.1**. No title rewrite has ever shipped here — the 10-01, 10-02 and 10-06 rewrites are all still unmerged on this branch |
| **`what-happens-after-private-equity-buys-your-company`** — two links added, both retargeted | Rule 8: the partial-sale post had **1 inbound link**, the site floor, on 46 impr @ 6.6 |

`keywords.json`: acted on the 09-26 recommendation — "private equity buyout"/"buyout private equity"/"pe buyout" (**121 impr, 0 clicks**) were in no cluster on `main`. This branch already maps all three to the pillar built for them on 10-04, so the run's duplicate mapping was removed. 46 covered mappings, no keyword in two clusters, every mapped URL resolves.

## Dropped or corrected on merge

| What | Why |
|---|---|
| **New post `/blog/majority-recapitalization-explained` (3,047 words)** — dropped | The **seventh** majority-recap duplicate across 09-28 → 10-08, at the fourth slug. `/blog/majority-recapitalization-vs-sale` on this branch already covers the same ground: majority vs minority vs leveraged recap, recap vs sale, the worked $5M-EBITDA example, the rollover-percentage point and the tax treatment |
| **The run's competing 430-word advisor section** on family succession — dropped, two pieces carried across | It replaced the 10-01 section under the same H2. Kept the 10-01 version (472 words, positioned after the § 6166 paragraph it references, with the $4.6M-vs-$11.6M cost-of-delay arithmetic tied to the page's own invented company) and carried over the two things it lacked: the integrated-firm answer and the four questions that sort advisors. The role count is consistent at five plus a facilitator in the section and in the FAQ |
| **The table row "Employee buyout / IBO — a trust holding the company for its employees"** — split into two rows | Two sections below, the same page describes the Independent Buyout as trust-financed with existing leadership continuing and no sponsor on the board. Conflating it with an ESOP misdescribed the firm's own structure |
| **Three link targets** | Two pointed at `/blog/sell-part-of-your-business-keep-control`, which this branch deletes, and two at the dropped recap post. Retargeted to `/blog/sell-a-business-but-keep-control` and `/blog/majority-recapitalization-vs-sale` |
| **A link added to `/blog/types-of-buyouts`** from the new taxonomy section | The 456-word taxonomy table would otherwise compete with the taxonomy pillar this branch adds. The section is comparison-framed and keeps its own queries; the pillar keeps the list queries |

## Skipped

Rule 3 capped at 2 — `independent-buyout-explained` and `minority-pe-stake…` stay in cool-down to 10-13/10-16. Rule 4's other rows are homepage queries (body copy barred). 3 of 6 rule-5 rows are apex/`www` duplicates of our own pages.

## Needs a human

1. **`/industries/restaurants` went from "Discovered" to "URL is unknown to Google"** despite the sitemap, 6 inbound links and a 09-26 expansion. Its identical siblings are indexed. Needs a manual Inspect + Request indexing, not another edit. Unchanged since 10-07.
2. **Apex still outranks `www` on the calculator** — 397 impr @ 34.0 vs 122 @ 7.7. The 301 is right; this is consolidation lag, and GSC's 28-day window means a correct fix cannot show before roughly 11-01. The apex ask is closed; this row is stale, not new.
3. **`/blog`: 316 impr, 0 clicks** on "buyout companies" (@23.1) and "types of buyouts" (@48.3). The run's own conclusion — "a listing page can't win these, they want a pillar" — is already built on this branch: `/blog/types-of-buyouts` and `/blog/private-equity-buyout-explained`. This is the clearest argument yet for merging.
4. **The 1,200–2,000 word guide in `DAILY_PROMPT.md`.** Two verified posts have now run over it (10-07 at 2,562 words, this run at 3,047 before it was dropped as a duplicate). Either raise the guide or have runs trim deliberately.
5. **`/blog/the-broken-owner-exit-conversation` has no `covered` entry** in `keywords.json`, on this branch, on `main` and on the run's branch. That is the gap class that produced the 09-21 duplicate. Left alone here rather than widening this merge, but it is a one-line guard.

## Flagged

The conflated ESOP/IBO table row, above — the one factual defect in this run's output. Everything else verified: no numeric or sourced claims in the new taxonomy section; the $35M/$19M figure re-derived from the page's own table ($5M × 7.0x = $35.00M, 70% cash = $24.50M, earnout $3.50M × 0.21 = $0.735M, 23.8% on $25.235M = $6.006M, $19.23M in hand = 54.9% of headline); banned-phrasing scan clean across all changed files; all JSON-LD parses; both approved biography lines untouched; Managing Partner title intact.
