# Daily SEO run — 2026-10-12

Audit clean. Run #47, fired 20:03 UTC.

## A correction to this branch's own record

Two things reported here as fact were wrong, and both are now corrected against the full run history.

**No daily run has ever been dropped.** This file previously recorded that the 09-28 run "never fired" and that GitHub's scheduler had dropped it, and on 10-12 the same conclusion was drawn again. Both were wrong. Pulling all 39 scheduled runs from 09-04 to 10-12 shows a run on **every single day**, with no gaps. The 09-28 run fired at 18:19 UTC (+7.3h) and this one fired at 20:03 UTC (+9.1h) — seventeen minutes after the 19:45 check that declared the window past. The cause in both cases was the same: a check made before the run arrived, treated as evidence that it never would.

**The fire time is drifting, and the earlier retraction of that was also wrong.** An earlier note here corrected "drifting later all week" to "high variance, not a trend", on 14 runs. With all 39 the trend is plain:

| ISO week | runs | mean lag | range |
|---|---|---|---|
| 36 | 3 | 3.0h | 2.6–3.7h |
| 37 | 7 | 3.9h | 2.8–5.2h |
| 38 | 7 | 4.1h | 3.1–5.7h |
| 39 | 7 | 4.6h | 3.8–5.7h |
| 40 | 7 | 5.6h | 4.0–7.3h |
| 41 | 7 | 6.4h | 5.1–8.4h |
| 42 | 1 | 9.1h | — |

Least-squares slope **+0.64h per week** across 39 runs; first 13 runs mean 3.9h against last 13 mean 6.1h. The cron is `0 11 * * *`, the most contended slot there is.

The operational consequence: **there is no established upper bound on the fire window, so a run must never be called dropped.** At the current slope the fire time reaches midnight UTC in roughly four weeks, which would push runs onto the following calendar day and break both the daily cadence and the GSC date windows. That is the real argument for moving the cron, and it does not depend on any run having been lost.

## GSC totals — 28 days

Unchanged in shape from 10-11: impressions in the low 4,000s, clicks around 80, position just under 13.

## Changes kept — 2 pages edited, 0 new posts

| Change | Why |
|---|---|
| **`what-happens-after-private-equity-buys-your-company`** — a 102-word caveat on the page's own rollover table, noting it ignores the preferred return that sits ahead of common equity in the waterfall | This is the gap flagged on this branch on 10-10 and never filled. The page works a rollover through two exit scenarios without mentioning the preference at all, which overstates what the stake pays. The caveat is the honest fix |
| **`selling-to-private-equity-pros-and-cons`** — a sentence noting the deal on offer is rarely a clean 100% sale | Most sponsor transactions at this size are majority recapitalizations selling 51–80% with the rest rolled, so cash at close and the second bite are two separate things to value. Consistent with the framing already verified on the recap post |

The rollover table's arithmetic was re-derived and holds: $9M × 8.0x = $72M less $16M of debt = $56M of equity, 20% = $11.2M, a 2.3x on the $4.8M rolled; and $7M × 8.0x = $56M less $16M = $40M, 20% = $8.0M, 1.7x.

## Dropped or corrected on merge

| What | Why |
|---|---|
| **New post at `/blog/majority-recapitalization-explained`** (2,733 words) | Eleventh duplicate since 09-28, and the third recap slug used — this one was already dropped from the 10-03 run, and the last two runs wrote onto the keeper's own slug instead. `majority-recapitalization-vs-sale` stays: 2,695 words, six sources |
| **Its rollover-prevalence statistic** — not carried across | The one thing it had that the keeper lacks: 46% in 2020 rising to 57% in 2023 for mid-market deals of $25M–$500M, attributed to Goodwin's private equity deal database. **goodwinlaw.com returns 403 to this environment** on its root, on a real path and on a fake path alike, so the 403 says nothing about the page and the figure cannot be checked against its source. The same numbers reached the 10-10 run through a different intermediary, which is the second-hand condition behind both of the worst errors caught in this stack. Not carried, and not asserted to be wrong either — just unverifiable from here |
| **A fourth liquidity section and a FIFTH advisor framing** on family succession | The page already has three distinct liquidity and estate sections and one six-role advisor section. The run's advisor list gave seven roles in a different order |
| **A new FAQ entry** on the same page | It introduced a second invented company ($3M of available annual cash) and an unsourced generalisation that a full-price internal sale "routinely implies debt service closer to $5 million" |
| **A Gibson Dunn commentary source on Connelly** | Redundant: the branch cites the opinion itself, by docket and date |
| **Title and meta rewrites** on family succession and minority recapitalization | Both already rewritten on this branch (10-08 and 10-06) with nothing shipped. Fifth consecutive run to propose a family-succession title rewrite |
| **A false cross-reference**, introduced by the run and then briefly by this merge | The run's caveat claimed the rollover post "goes through the preference stack in detail". That post contains no instance of "preference" or "preferred". The first repair said the recap was worked through "above", which implied this page; it is not. The sentence now describes what each target actually contains |

## Still unfilled

The preference-waterfall gap. Three runs have now circled it — 10-10 wrote a worked waterfall in a post that was dropped for other reasons, 10-10's merge noted it as a gap, and this run wrote a cross-reference asserting it was already covered. It is not covered anywhere on the site. Filling it properly means working a preference stack through one of the existing invented companies, which is a content decision rather than a merge decision.

## Needs a human

1. **Merge this branch.** Fifteen runs, 33 indexable pages, eleven duplicate posts.
2. **Move the cron off `0 11 * * *`**, on the drift evidence above rather than on any dropped run. A jittered off-hour minute, earlier in the day, buys headroom against a slope that is currently +0.64h per week.
3. **Request Indexing on `/industries/restaurants`** — never crawled.
4. **The 1,200–2,000 word guide in `DAILY_PROMPT.md`.**
5. **The `seo-on-merge` ordering fix for `lastmod`.**

## Flagged

Nothing beyond the above. Banned-phrasing scan clean; Chasen and Gleeman are Managing Partner throughout; all JSON-LD parses; both approved biography lines intact.
