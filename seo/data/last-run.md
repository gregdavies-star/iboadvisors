# Daily SEO run — 2026-09-21

First run since 09-17, and the first with the new-post window open again (last post 09-13). Rules 3, 4 and 5 are all blocked — cool-downs, the homepage body bar, or the apex/www twins — so the budget went to one new post plus the three inbound links it needed. Audit: 0 errors, 2 pre-existing warnings, both on the calculator.

## GSC totals — 28 days (2026-08-22 → 09-18)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 40 | 1,923 | 2.08% | 17.3 |
| Prior 28d | — | — | — | — |

`totals.previous` is still null — the property holds no data before the current window starts, so **rule 6 produces no decliners until ~2026-10-15**. Clicks +67% and impressions +48% against the 09-14 pull, but that is window fill, not growth.

## Changes — 1 new post, 3 link edits

**`/blog/selling-to-private-equity-pros-and-cons`** — new post, 1,912 words. Highest-priority uncovered keyword in `keywords.json` (cluster 2). GSC already shows 16 impressions across `selling to private equity` (9 @ 28.6), `selling your business to private equity` (3 @ 31), `selling private equity` (3 @ 29.7) and `selling business to pe` (1 @ 34) with no page serving the evaluative intent — the existing posts cover process and post-close, not the decision. Differentiated by a worked after-tax ledger: a made-up $5M-EBITDA company at 7.0x becomes $19.23M in hand, 55% of the $35M headline. Every figure is public record or invented arithmetic; all 7 sources opened with WebFetch (GF Data Q3 2025, CapitalPad's GF Data size ladder, Bain PE Outlook 2026, SRS Acquiom deal terms via PE Professional, AlixPartners survey, IRS Topic 409, IRS NIIT). 14 internal links including the calculator.

**`/blog/how-to-sell-a-business-to-private-equity`**, **`/blog/what-happens-after-private-equity-buys-your-company`**, **`/blog/alternatives-to-selling-to-private-equity`** — link. Three inbound links for the new post from the indexed pages that rank on the adjacent queries (61, 146 and 72 impressions). All three placed inside existing sentences; none reached 150 words, so no `Updated` bumps.

Bookkeeping: `what happens after private equity buys your company` was never added to `covered` after the 09-12 publish — fixed, so the job cannot re-publish it.

## Skipped

- **Rule 3** — all 4 `lowCtr` rows blocked. IBO explainer rewritten 09-15 (eligible 10-13); veto-rights post and `/blog` 09-08 (eligible 10-06). The fourth, the post-buyout page, is a position problem, not a title one: its real queries (`private equity buyout`, `buyout private equity`) sit at 20-28, where no title earns clicks.
- **Rule 4** — 2 of 3 rows are the homepage (body barred); the third is the IBO explainer, inside its 14-day content cool-down and already the direct answer.
- **Rule 2** — `/blog/family-business-succession-planning` is still the only non-PASS URL ("Discovered — currently not indexed"). It is now the longest post on the site at 2,542 words with 12 inbound links; it was expanded 09-17, inside cool-down. Nothing on-page is left to fix — it has not been crawled.

## Needs a human

1. **Authorize the calculator title/meta rewrite** (74 → ≤60 chars; 194 → ≤155). Fourth ask, and the largest single gap: 173 impressions across 38 valuation-calculator variants at an average position of 68, 0 clicks. Rule 3 never fires because the page has no CTR problem at that depth — but the metadata is the only lever the job is allowed to pull.
2. **Request indexing** for the succession post in Search Console. On-page work is exhausted.
3. **`what is an ibo`** (64 impressions, 0 clicks) — the explainer at position 7.0 should win over the homepage at 9.8, but the homepage carries one outbound internal link and none to it. Body copy is barred; a human adding that link is the whole fix.

## Flagged

Nothing. The banned-phrasing grep returns zero matches across all HTML. `/blog/choosing-an-ma-advisory-firm` re-checked: deal counts gone, the approved "$1.8 billion" line intact — that flag stays dropped.
