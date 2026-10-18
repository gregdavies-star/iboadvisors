# Daily SEO run — 2026-10-18 (folded into #66)

Run #53 fired at 14:12 UTC. Steps 1–11 succeeded; only step 12 (open a pull request) failed.

## No duplicate today — but the cause is not fixed

For the first time in four days the run did not re-take ground already on this branch. It wrote `/blog/dividend-recapitalization`, which is genuinely uncovered: no dividend-recap page exists, and the only existing treatment is a route inside `/blog/sell-a-business-but-keep-control`.

**This is a reprieve, not a resolution, and the distinction matters because the same call was made too confidently on 10-14.** `main` has not moved, #66 is still unmerged, and `seller financing in a business sale` is *still* the highest-priority uncovered keyword in cluster 3 on `main` — still sitting ahead of `dividend recapitalization explained` in the same list. The run's own changelog says it picked dividend recap because that "was the highest-priority uncovered keyword", which is **incorrect**. It skipped the seller-financing keyword without recording why. Nothing on `main` — not `keywords.json`, not the changelog, not `history.jsonl`, not `last-run.md` — accounts for the skip. So the exposure is unchanged and tomorrow's run may take it again.

## Kept

- **`/blog/dividend-recapitalization`**, 2,233 words, 7 sources. The best-sourced post any run has produced. Every numeric and legal claim was checked against its source:
  - **11 U.S.C. § 548** — verified in full. Heading "Fraudulent transfers and obligations"; the 2-year look-back in (a)(1); "received less than a reasonably equivalent value in exchange for such transfer"; and all four conditions including insolvency, "an unreasonably small capital", and debts beyond the debtor's ability to pay. The post's quotations are accurate.
  - **Lucky Bucks** — real and independently corroborated beyond the cited source. Trive Capital's July 2021 $200 million dividend recap; a prepackaged Chapter 11 in Delaware in June 2023; noteholders alleging the dividend was a fraudulent transfer that left the company insolvent; a settlement the judge refused to approve; litigation still live. Properly attributed to Capstone Partners rather than asserted as fact.
  - **Dechert** — "dividend recapitalization volume reached US$22.4 billion, a sharp increase from US$14.0 billion"; "leveraged loans account for 91% of the total volume of sponsored dividend recapitalizations"; "Average pricing on a recapitalization-related bond deal has dropped to 7.36% in 2025, down from 8.38% in 2024". All exact.
  - **PitchBook via Capstone** — "grew 11% YOY to $74.3 billion in 2025", "after rising 326% YOY in 2024", "dropped 54.5% YOY to $11 billion in Q1 2026", from PitchBook LCD's April 2026 leveraged loan volume report. All exact, and the post's "PitchBook data cited by Capstone Partners" is the right attribution.
  - **GF Data via Middle Market Growth** — historical average total debt 3.7x; senior "climbed from 2.7x in Q1 2025 to 2.8x in Q4 2025"; platform total debt "bottomed out in 2025 at 3.2x". All exact.
  - **Capstone on solvency opinions** — the three pro forma tests and the "risk mitigation and governance protection" framing, both verbatim.
- **Three inbound links** to the new post, from `sell-a-business-but-keep-control`, `types-of-buyouts` and `alternatives-to-selling-to-private-equity`.
- **A hero routing sentence on `/blog`** (Rule 5): the index absorbs generic buyout queries its child pages should own — "buyout companies" at 32 impressions/position 23.5, "types of buyouts" at 11/48.8 while `/blog/types-of-buyouts` sits at 4.0. The sentence routes both families to the dedicated pages.
- Fresh Search Console and coverage data.

## Corrected on merge

- **Two window over-attributions** in the new post. Dechert labels the 91% leveraged-loan share and the 7.36%/8.38% bond pricing by *calendar year*, not by the 1 January to mid-February window the post had them attached to. Both detached and relabelled. The Middle Market Growth page does not state an enterprise-value range for GF Data's contributed set, so the post's "deals from roughly $10 million to $250 million" parenthetical was removed — true of GF Data's universe generally, but not something that page says.
- **A second title and meta rewrite of `/blog/sell-a-business-but-keep-control`.** The 10-16 run already rewrote both on this branch for the same low-CTR row; the 10-18 run, unable to see that, rewrote the original again. The 10-16 version was kept.

## Coverage

32 of 33 URLs indexed. `/industries/restaurants` holds at "Discovered – currently not indexed" with no `lastCrawlTime` — a fourth day since it recovered on 10-15. Requesting indexing in Search Console remains the only lever.

## Verification

Six sources checked against the originals, including one statute read in full and one named bankruptcy case corroborated independently of the source that cited it. Every figure held. This is a marked contrast with 10-16, when a precise comparative statistic turned out to rest on a report that appears not to exist — the difference is that this run's sources name their own primary data and the attribution chains survive being followed.
