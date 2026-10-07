# Daily SEO run — 2026-10-07

First run with a non-null prior window. (The report said "first run since 09-26"; runs have fired daily, bar 10-05, whose job was cancelled before pushing a branch.) Audit was already clean, so the budget went to the two indexing problems, the biggest unanswered query on the site, and one new post. 4 content pages edited, 1 new post, 0 title/meta rewrites.

## GSC totals — 28 days (2026-09-07 → 10-04)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 72 | 4,113 | 1.75% | 14.0 |
| Prior 28d | 10 | 281 | 3.56% | 9.6 |

The prior window is the Search Console verification ramp, not a real baseline — 281 impressions against 4,113. **Rule 6 yields no decliners** and the CTR/position "declines" are a wider crawl, not a loss. A usable comparison arrives around 2026-11-01.

## Changes

| Change | Data point |
|---|---|
| **`management-buyout-vs-private-equity`** — +380 words on how each structure is taxed: installment method under §453, the §453A interest charge on the page's existing $10.5M seller note (52.4% × $2.1M × the 7% Q4-2026 rate ≈ $77K in year one), ordinary-income coupon | **"Crawled – currently not indexed"** (crawled 10-01) despite 142 impr @ 11.2. Rule 2 wants weight, not a resubmit |
| Same page → link to `what-happens-after-private-equity-buys-your-company`, anchor "private equity buyout" | Rule 5: that family splits 63+43 impr; the winner's title already leads on the phrase |
| **`family-business-succession-planning`** — +310 words, "Liquidity planning for family business succession" **(kept; the 10-06 run's near-identical section was removed in merge resolution)** | 140 impr @ 17.7, zero clicks — the largest unanswered query on the site. The page never used the phrase. Both runs had answered it, under headings differing only by ", in sequence", and on different household-spending premises ($600k here, $300k there), so keeping both would have contradicted the page. |
| **New: `/blog/types-of-buyouts`** — LBO, MBO, MBI, secondary, ESOP, leveraged recap, IBO; 2,291 words, 13 internal links, 8 sources all opened | "buyout companies" 14 @ 23.1, "types of buyouts" 9 @ 48.4, "secondary buyout" 3 @ 59.3 and six more **currently land on `/blog`** — no page targets them |
| `independent-buyout-explained` and `how-private-equity-actually-finances-a-buyout` → the new post | The two strongest indexed blog pages (244 impr @ 5.5; 19 in-body inbound) |

`keywords.json`: the three new cluster-3 keywords are kept and mapped to the new post, and "types of buyouts" was moved out of cluster 2 so it is not registered twice. "private equity buyout" stays on `/blog/private-equity-buyout-explained`, the pillar built for it on 10-04, rather than the page this run chose — it picked `what-happens-after` only because main does not carry the pillar. 46 covered keys, none in more than one cluster.

## Skipped

- **Rule 3 — no rewrites.** The biggest row, `family-business-succession-planning` (461 impr, 2 clicks @ 13.6), was rewritten 2026-09-10 and is **one day inside its 28-day cool-down; it is eligible 10-08** and should be first in tomorrow's queue. Of the other ten rows, four are in cool-down, and the rest are pages whose impressions are dominated by the brand query "ibo advisors", where the homepage legitimately takes the click (1.1, 56% CTR).
- **Rule 4 — second slot unused.** Three of the remaining rows are the homepage (body copy barred); "what is an ibo" @ 7.0 is already answered in the explainer's title and first line.
- **`/industries/restaurants`** is still "Discovered – currently not indexed". It got +420 words and two inbound links 11 days ago; giving that time rather than stacking more.

## Needs a human

1. **The new post ran over the 1,200–2,000 word guide** in `DAILY_PROMPT.md`, as the run flagged itself. Left at full length: every claim in it is verified against its cited source and the arithmetic re-derived, so trimming would mean cutting checked content to hit a number. Raise the guide or trim deliberately — an owner call either way.
2. **"IBO" means *institutional* buyout in standard PE usage,** and ~110 impressions/month arrive on "ibo meaning in business", "what is an ibo in business", "whats an ibo". Addressing the ambiguity head-on would serve those searchers but cuts against the category we are building. Positioning call, not a job call.
3. **Calculator: apex still outranks `www`** — 64 impr @ 70.3 on `iboadvisors.com/business-valuation-calculator` against the www page. The 301 is correct; this is consolidation lag.
4. **Stranded past page 2:** `exit planning for business owners` (24 @ 85.3) and `management buyout financing` (13 @ 29.5 on its exact-match term) — both have pages, neither moves.

## Flagged

Nothing. Banned-phrasing scan: 0 matches across 31 HTML files; 30 JSON-LD blocks parse; all 24 `jobTitle` values read "Managing Partner". The approved "$1.8 billion" line is intact.
