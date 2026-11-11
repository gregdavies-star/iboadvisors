# Daily SEO run — 2026-11-11

All 40 sitemap URLs return `PASS` for the second day running; `/industries/restaurants` keeps the crawl it got on 11-09. One new post plus three inbound links, no title or meta rewrites. Audit clean: 40 pages, 0 errors, 0 warnings.

## GSC totals (28 days to 2026-11-08 vs prior 28)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 80 | 5,830 | 1.37% | 11.0 |
| Prior | 78 | 3,918 | 1.99% | 11.9 |

Impressions +49%, position +0.9, clicks +2 — new impressions land at 10–20 and dilute CTR before earning clicks.

## Changes

| Page | Change | Data point |
|---|---|---|
| `/blog/private-equity-replace-founder-ceo` | new post, 1,860 words | Rule 7: one post in the trailing 7 days (11-06), slot open. Highest-priority uncovered keyword was cluster-5 "private equity and founder CEO replacement". Three sources opened this run: NBER w30899 (71% of 192 $1B+ US buyouts changed CEO, >75% of replacements external), AlixPartners 2026 (turnover spikes at year two), Spencer Stuart — plus a hypothetical $60M deal showing a $9M spread between good-leaver and bad-leaver clauses. The post says only 4% of the NBER sample were unaffiliated private companies. |
| Three donors | link | Rule 7 + 8: `what-happens-after-private-equity-buys-your-company`, `selling-to-private-equity-pros-and-cons`, `minority-pe-stake-board-control-veto-rights`, each on a sentence that already raised CEO replacement and had nowhere to send the reader. |

## Skipped

**Rule 3** — 11 of 13 `lowCtr` rows are inside the 28-day cool-down. `selling-to-private-equity-pros-and-cons` already leads with its exact query, so a rewrite is churn; `family-business-succession-planning` is retitled on the open 11-10 branch and this run stayed off it; the `sell-a-business-but-keep-control` row is the URL you 301'd on 10-30. **Rule 4** — two rows rank `/blog`; "ibo finance" is homepage copy; `majority-recapitalization-vs-sale` was edited 11-03; `types-of-buyouts` already answers its query under an H2. **Rule 5** — the loser in each non-brand row is the blog index, which already links the winner. **Rule 6** — none.

## For a human

1. **Second run raising this: `/blog` absorbs generic buyout demand.** It is Google's pick for "owner buyout" (34 impressions, position 11.7), "buyout companies" (36, 22.3), "corporate buyouts" (36, 20.6) and "internal buyout services" (21, 33.6) — ~160 impressions, one click, on an index page. A dedicated post is the fix, but the term is not in `keywords.json`, so it needs your word first.
2. **The 11-10 PR is unmerged.** It carries the family-business retitle and the only inbound link for `/blog/quality-of-earnings-report`, the site's inbound floor at 5.

## Flagged

Standing rule 5 (audit pending your approval), re-verified on disk: `minority-recapitalization-explained` holds the one direct claim ("you keep majority ownership, board control, and operating authority"). New to the list, `majority-recapitalization-vs-sale` quotes "you stay in control" and then says the consent list decides whether that is true. Three more phrase it as the owner's question: `selling-to-private-equity-pros-and-cons`, `what-happens-after-private-equity-buys-your-company`, `rollover-equity-second-bite-explained`. Reported, not edited. Nothing asked for deal specifics.
