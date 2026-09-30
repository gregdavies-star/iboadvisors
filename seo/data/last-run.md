# Daily SEO run — 2026-09-30

Audit clean; the one non-PASS URL was already strengthened on 09-26, so rules 1–2 need nothing.
Rule 3 had one row out of cool-down, rule 5 two real rows behind four apex/`www` duplicates, rule 6 no prior-window data.
The rest of the budget went to rule 7.

## GSC totals — 28 days (2026-08-31 → 09-27)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 62 | 3,206 | 1.93% | 14.5 |
| Prior 28d | — | — | — | — |

`totals.previous` is null, so **rule 6 yields no decliners**. Since 09-23: 53→62 clicks, 2,422→3,206 impressions, 15.6→14.5.

## Changes — 4 pages edited, 1 new post

**`alternatives-to-selling-to-pe` — meta rewritten.** `lowCtr`: 157 impr, 2 clicks (1.27%) at 9.1 vs 3.0% expected; the only one of four rows out of cool-down. Title kept — it already leads with the covered keyword and fills 58 of 60 characters. New meta promises what the page has: seven routes costed at close on one $6M EBITDA company.

**`management-buyout-vs-private-equity` — link re-anchored (rule 5).** "buyout private equity" (49 @ 26.3 vs 4 @ 6.8) and "private equity buyout" (31 @ 20.3 vs 6 @ 11.7) split with `what-happens-after-pe-buys-your-company`, which wins on impressions and intent; the link now carries the query as anchor. Title/H1 kept — both lead with "Management Buyout".

**New: `/blog/majority-recapitalization-vs-sale`.** Top uncovered keyword in `keywords.json` (cluster 3); "majority recapitalization" currently lands on the *minority* recap page at position 35. 1,959 words of prose, 12 internal post links, calculator link, 7 sources all opened before citing (IRC §§721/351/368(c), IRS Topic 409 and NIIT, Bain 2026, Capital Pad/GF Data). Angle: a 30% roll is 30% of post-close *equity*, so the worked $8M EBITDA / 7.0x / 3.5x example banks 85% of EV while calling the seller a 30% owner. Inbound links from `minority-recapitalization-explained` (cluster-3 hub, absorbing the query) and `rollover-equity-second-bite-explained` (17 inbound vs 11 outbound).

## Skipped

- **Rule 2:** `/industries/restaurants` still "Discovered – currently not indexed", but gained 420 words and two links on 09-26 and now has 6 inbound. Re-expanding inside the 14-day cool-down won't move a decision Google hasn't revisited.
- **Rule 3:** three rows in cool-down — `/blog` 09-08, `independent-buyout-explained` 09-15, `minority-pe-stake-veto-rights` 09-18.
- **Rule 4:** all six rows blocked — three homepage (body barred), three edited inside 14 days.
- **Rule 5:** four of six rows are apex/`www`/anchor duplicates of our own domain.

## Needs a human

1. **~80 impr, no page, no keyword entry:** `ibo meaning in business` (25 @ 11.2), `whats an ibo` (22 @ 8.8), `what is an ibo in business` (16 @ 8.8), `independent buyout (ibo)` (16 @ 2.5). A `/independent-buyout` pillar (STRATEGY.md §2) absorbs these; the 09-26 flag on `buyout private equity` is still open.
2. **Calculator ranks nowhere on its own term** — 64 impr @ 70.3, plus six variants (~55 impr) at 65–76.
3. **Apex/`www` still splitting** on the calculator, 16 impr @ 2.1. The 301 is correct; consolidation lag.
4. **`what is an ibo`** — 72 impr, 0 clicks over two of our pages. `independentbuyout.com` is ours and also ranks page one, so the click may land where GSC cannot see it here.

## Flagged

Nothing. 0 banned-phrase matches across 34 HTML files; 29 JSON-LD blocks parse; the "$1.8 billion" line intact in both places. Audit: 30 pages, 0 errors, 0 warnings.
