# Daily SEO run — 2026-10-30

One new post (the cluster-4 gap next to the add-backs piece), two title/meta rewrites on pages that had never had one, two inbound links. Audit clean.

| Window | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| 09-30 → 10-27 | 72 | 4,091 | 1.76% | 12.3 |
| 09-02 → 09-29 | 71 | 3,563 | 1.99% | 14.0 |

## Changes

- **New post `/blog/sde-vs-ebitda` (rule 7).** 1,982 words. Highest-priority uncovered keyword in `keywords.json` (cluster 4). Last post that actually shipped was 10-22, eight days ago — the 10-23/10-24 changelog lines are duplicates of it, superseded on merge. One invented landscaping company carried through both metrics ($1,535,000 SDE vs $1,355,000 adjusted EBITDA, $180,000 apart), then both multiples applied to show the larger number earning the smaller price. Sources: IBBA/M&A Source Market Pulse Q1 and Q2 2026, BizBuySell Q3 2026, GF Data via Mercer Capital, SBA 7(a) and SOP 50 10 8.1, 26 U.S.C. § 162(a)(1), SEC non-GAAP C&DIs — each opened before citing. Two of them are syndicated reprints of the Market Pulse press releases; IBBA's own results pages are password-protected and its highlights PDFs are image-only.
- **`/blog/private-equity-buyout-explained` title + meta (rule 3).** 338 impressions, 2 clicks (0.59%) at 17.0 against 1.0% expected; no title/meta change on record. Queries are definitional, so the meta now opens with the definition.
- **`/business-valuation-calculator` title + meta (rule 3).** 103 impressions, **0 clicks at position 8.6** against 3.0% expected — the biggest page-one gap on the site. Last rewritten 09-17. Title/meta only; body untouched.
- **Two inbound links to the new post (rules 7, 8)** from `/blog/adjusted-ebitda-add-backs` (its SDE FAQ) and `/blog/how-pe-firms-value-a-company` (the owner-compensation add-back bullet).

## Considered and skipped

- **`strikingDistance`:** all three usable rows are `/blog/family-business-succession-planning`, which already answers each query in a dedicated section — including a paragraph on integrated tax/estate/succession firms. Position, not coverage, is the constraint. "ibo finance" lands on the homepage (body off limits).
- **`lowCtr`:** the other seven rows are inside the 28-day cool-down.
- **Cannibalization:** "buyout companies" / "types of buyouts" was addressed on 10-26; the brand and "independent buyout" rows are won by the homepage.
- **Decliners:** none. **Audit:** 0 errors, 0 warnings.

No deal-data flags this run.

## Coverage

35 of 36 PASS. `/industries/restaurants` is still "Discovered – currently not indexed" with no crawl recorded. At 4,796 words and 8 inbound links after four expansions, there is nothing on-page left to fix; it was not touched today.

## For a human

1. **Request indexing for `/industries/restaurants` in GSC.** Fifth run with no other lever.
2. **`/business-valuation-calculator` at 8.6 with 0 clicks of 103 impressions** is worth a human look at the live SERP — if a rich result or AI overview is sitting above it, no title fixes that.
3. **`/blog/private-equity-buyout-explained`** has had six link passes and sits at 17.0; consider whether it should absorb `/blog/types-of-buyouts` traffic or whether the two need a 301 decision.
