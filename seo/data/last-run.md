# Daily SEO run — 2026-09-20

First run since 09-17, so the new-post cap had room: one post against the highest-priority uncovered keyword, plus the one title/meta rewrite out of cool-down. Everything else in rules 3-5 is still inside its window. Audit: 0 errors, 2 pre-existing warnings, both on the calculator.

## GSC totals — 28 days (2026-08-21 → 09-17)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 36 | 1,817 | 1.98% | 17.4 |
| Prior 28d | — | — | — | — |

`totals.previous` is null for the seventh run: the property holds no data before 2026-08-18. **Rule 6 stays unusable until ~2026-10-15.**

## Changes — 4 pages + 1 new post

**`/blog/selling-to-private-equity-pros-and-cons`** — new post, 2,172 words (over the 2,000 guide; siblings run 1,814-2,128). Highest-priority uncovered keyword in `keywords.json`, with 16 impressions across "selling to private equity" variants at positions 28-31 and only the process post targeting them. A ledger with a number on each line, linking out rather than overlapping the process, alternatives and post-close posts. Five sources, all opened with WebFetch — GF Data's size premium via CapitalPad (6.7x at $3-5M EBITDA vs 8.3x above $10M), add-ons at 75.9% of Q2 2025 buyouts, NBER 26371, AlixPartners March 2026, the ~7-year hold — plus a worked hypothetical on an invented $5M EBITDA company. 13 internal links incl. the calculator.

**`/blog/what-happens-after-private-equity-buys-your-company`** — title + meta. `lowCtr`: 118 impressions, 0 clicks at position 12.4, never rewritten since publishing 09-12. New tag leads with the query family it actually ranks for ("private equity buyout"/"pe buyout", 30 impr at 20-28).

**`/blog/how-to-sell-a-business-to-private-equity`**, **`/blog/how-private-equity-actually-finances-a-buyout`**, **`/blog/alternatives-to-selling-to-private-equity`** — link: inbound links for the new post from indexed pages at positions 17, 6.0 and 10.8. No edit reached 150 words, so no `Updated` bumps. Also added the missing `covered` entry for "what happens after private equity buys your company" — that page has existed since 09-12 and rule 7 could have re-published it.

## Skipped

- **Rule 3** — other lowCtr rows in cool-down: IBO explainer (177 impr, 1.13%) eligible 10-13; veto-rights (165) and `/blog` (140) eligible 10-06.
- **Rule 4** — all three rows are the homepage (body barred) or the IBO explainer, edited 09-15 and already the direct answer.
- **Rule 5** — two of three rows are apex/www twins predating the 308.
- **Rule 2** — `/blog/family-business-succession-planning` is still the only non-PASS URL. At 2,542 words and 11 inbound links there is no on-page cause left, so no edit.

## Needs a human

1. **Calculator title/meta rewrite** (74 → ≤60; 194 → ≤155). Fourth ask; ~115 impressions across ~30 "business valuation calculator" variants at positions 55-82, 1 click. Rule 3 never fires because that traffic sits on the apex twin.
2. **Request indexing** for the succession post — "Discovered" means uncrawled.
3. **Add a buyout-terminology cluster to `keywords.json`:** "types of buyouts" (5 @ 48.8), "secondary buyout" variants (~8 @ 36-72), "what is a private equity buyout" (3 @ 26) land on `/blog` by accident.
4. **"what is an ibo"** — the explainer (26 @ 7.0) should beat the homepage (34 @ 9.7); the fix is a homepage body link, which is barred. Third ask.

## Flagged

Nothing. Banned-phrasing grep returns zero matches site-wide, new post included. `/blog/choosing-an-ma-advisory-firm` re-checked: deal counts gone, approved "$1.8 billion" line intact, flag stays dropped.
