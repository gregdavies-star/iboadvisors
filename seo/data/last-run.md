# Daily SEO run — 2026-10-02

Audit clean (0 errors, 0 warnings). Rules 3, 4, 5 and 7 fired: 3 content pages of the 4 allowed and 4 link edits. The one new post was dropped in merge resolution as the fourth write of the same topic (see Changes). `totals.previous` is populated for the first time but covers the property's first verified days, so the deltas are data accumulation, not movement; rule 6 still yields no decliners.

## GSC totals — 28 days (2026-09-02 → 09-29)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 71 | 3,563 | 1.99% | 14.0 |
| Prior 28d | 3 | 95 | 3.16% | 11.3 |

## Changes

| Change | Data point |
|---|---|
| `alternatives-to-selling-to-pe` — title/meta now carry its $42M worked comparison | `lowCtr`: 158 impr, 1.27% CTR @ 9.0 vs 3% expected; never retitled |
| `selling-to-private-equity-pros-and-cons` — "4 Pros and 5 Cons"; meta carries the $35M → $19M after-tax figure | `lowCtr`: 130 impr, 0.77% @ 6.4 vs 3% expected. Counts match its own H3s |
| ~~`family-business-succession-planning` — ~390-word H2 on the four advisor seats~~ — **dropped in merge resolution** | `strikingDistance`: "which advisors are best suited to plan the sale of a family-owned company?" **50 impr, 0 clicks @ 6.3**; page had no advisor section | **The same row was already answered by the 10-01 run**, with a 424-word section on five specialists that this branch already carries. Kept that one: it adds the hiring sequence, the sixth family-governance seat and a family-specific compensation screen. `Updated` stays October 1 — no new words landed on this page today. |
| `management-buyout-vs-private-equity` — existing outbound link re-anchored to "private equity buyout" | `cannibalization`; winner `what-happens-after-pe-buys-your-company`, 85 impr vs 19. Titles already differentiated, so no title churn |
| ~~New `/blog/recapitalization-vs-sale`~~ — **dropped in merge resolution** | Fourth write of this topic. The 09-28, 10-01 and 10-02 runs each wrote it and the 09-30 run wrote `/blog/majority-recapitalization-vs-sale`, every one of them reading a `main` without the earlier runs' unmerged work. The 09-30 post is kept. |
| ~~3 inbound links to it~~ — **dropped, not retargeted** | Both surviving pages already link `/blog/majority-recapitalization-vs-sale`, so retargeting would have doubled up; the third was on the post this branch deletes. In the alternatives post the sentence was kept and unlinked, since the §302 and §1368 mechanics it promised are not covered on the surviving post. |

## Skipped

Rule 3: the other five `lowCtr` rows are inside the 28-day cool-down (09-08 to 09-18). Rule 4's second slot: three rows are the homepage (body barred), `independent-buyout-explained` already answers "what is an ibo" in its H1, and the 20-impression row is a verbatim-quote hunt. Rule 5's remaining rows are branded or apex/`www` duplicates of ours.

## Coverage

`/industries/restaurants`, still the only non-PASS of 29, moved from "Discovered – currently not indexed" to **"URL is unknown to Google"**. It has the 09-26 expansion, 6 in-links and a fresh `lastmod`; no on-page cause remains, so a seventh link would be churn. Needs a manual Request Indexing.

## Needs a human

1. **"IBO" is ambiguous and the data shows it.** 158 impressions across five IBO-definition queries at positions 5–11, **0 clicks on all of them**. Two causes GSC cannot separate: searchers who mean "Independent Business Owner", and `independentbuyout.com` (ours) ranking page one and taking the click. Not a snippet fault — hold further spend here until one is ruled out.
2. **"Private equity buyout" still has no page** — 104 impressions across three queries, raised 09-26, unactioned. Add them to cluster 5 of `keywords.json` and the job can build the pillar next run.
3. Apex still outranks `www` on the calculator (397 impr @ 34.0 vs 93 @ 8.4) — consolidation lag, fourth week.

## Flagged

Nothing. 0 banned-phrasing matches across 35 HTML files; all 30 JSON-LD blocks parse; the approved "$1.8 billion" line intact in both places.
