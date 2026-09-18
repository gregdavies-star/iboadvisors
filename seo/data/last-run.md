# Daily SEO run — 2026-09-18

A CTR day: the veto-rights post is the site's largest zero-click page and its cool-down finally cleared, so rule 3 took it. The rest is internal links into the three thinnest-linked targets, plus a `keywords.json` fix that would otherwise have produced a duplicate post. Audit: 0 errors, 2 pre-existing warnings, both on the calculator.

## GSC totals — 28 days (2026-08-19 → 09-15)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 30 | 1,537 | 1.95% | 17.9 |
| Prior 28d | — | — | — | — |

`totals.previous` is null — the property holds no data before 2026-08-18, so **rule 6 cannot run until ~2026-10-15** and `decliners` is empty for that reason. `history.jsonl` since 09-14: clicks 24 → 30, impressions 1,299 → 1,537.

## Changes — 4 pages

**`minority-pe-stake-board-control-veto-rights`** — title + meta. Top `lowCtr` row: 164 impr, 0 clicks @ 10.4 vs expected 1.0%, never rewritten. Query family is "private equity minority investments" (9), "minority stake" (3), "minority stake meaning" (3) — wording the old tag ("Minority Stake, Majority Say") never used. New: *Private Equity Minority Stake: The Veto List* (59 chars); description opens on "a minority stake in private equity" (142). og:/twitter: match.

**`how-private-equity-actually-finances-a-buyout`** + **`what-happens-after-private-equity-buys-your-company`** — links to `business-exit-planning-every-option`, the priority-2 hub, at 3 in-body inbound on 4 impressions. Donors hold 15 in-links and the freshest crawl on the site (09-18 11:54). The second also gives `how-to-sell-a-business-to-private-equity` a fourth.

**`how-pe-firms-value-a-company`** — link to `ibo-government-contractors` (3 inbound, ranking 3.7), in the sector-spread paragraph that already links the other industry posts.

No edit reached 150 words, so no `Updated` bumps. **`keywords.json`**: mapped the 09-12 post to its own exact-match cluster-2 and cluster-5 keywords.

## Skipped

- **Rule 3** — IBO explainer (173 impr, 1.16%) rewritten 09-15, eligible 10-13. `/blog` index (120 impr, 0 clicks @ 13.9) left alone: its impressions are brand plus long-tail buyout terms the posts should win, so retargeting the hub buys cannibalization.
- **Rule 4** — 2 of 3 rows are the homepage (body barred); the third is the explainer, in cool-down and already the direct answer.
- **Rule 5** — all 3 rows are apex/www twins; the 308 shipped 09-13, this window starts 08-19, so they clear on recrawl.
- **Rule 7** — cap met: 2 posts in the trailing 7 days.

## Coverage

21 of 22 PASS. `family-business-succession-planning` is still "Discovered - currently not indexed", `lastCrawlTime: null`. On-page is exhausted: 2,542 words, 11 inbound, `lastmod 2026-09-17`, returns 200, robots allows.

## Needs a human

1. **Authorize the calculator title/meta rewrite** (74 → ≤60; 194 → ≤155) — the only warnings left; ~130 impressions across ~30 "business valuation calculator" variants at positions 65-75, 1 click. The Never list gates this on rule 3, which doesn't fire. Fourth ask.
2. **Request indexing** for the succession post.
3. **Supporting content for the calculator** — position ~70 on exact-match is a content gap, not a snippet one: the page has no article body. Six uncovered valuation keywords sit in `keywords.json`; STRATEGY.md §2 proposes `/ebitda-multiples-by-industry`. Worth the next new-post slot.
4. **301 `/blog/what-happens-after-a-private-equity-buyout`** → `.../what-happens-after-private-equity-buys-your-company`: a live 404 drawing 1 impression at position 1.
5. **"what is an ibo"** — the explainer (26 impr @ 7.0) should outrank the homepage (32 @ 9.7), but the homepage has one outbound internal link and none to it. Barred; unchanged from 09-17.

## Flagged

Nothing. A grep for every banned phrasing across all HTML returns zero matches. `choosing-an-ma-advisory-firm` re-checked per the carried-forward-flag rule: deal counts still gone, approved "$1.8 billion" line intact — flag stays dropped.
