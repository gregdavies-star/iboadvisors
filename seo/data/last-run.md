# Daily SEO run — 2026-10-16 (folded into #66)

Run #51 fired at 15:04 UTC. Steps 1–11 succeeded; only step 12 (open a pull request) failed.

## A fourteenth duplicate, on the same slug, two days running

The run wrote `/blog/seller-financing-business-sale` again — the identical slug to the 10-15 duplicate, against the `/blog/seller-financing-in-a-business-sale` that has now sat unmerged in #66 for three days. This is the predicted outcome and it is now a measured, repeating daily cost: **every day this PR stays open, the next run retakes the same ground.** The surviving post (3,197 words, 8 sources) beats this one (2,152 words, 3 sources).

## A claim that could not be verified, and was removed

The run's `/blog/types-of-buyouts` edit carried: *"22 percent of lower-middle-market MBOs closed between 2019 and 2021 traded below 1.0x invested equity at exit, against 15 percent of comparable sponsor-led LBOs."* Cited to CT Acquisitions, which in turn attributes it to a **"PitchBook 2025 Lower Middle Market Distress Report."**

No such report appears in PitchBook's own research index, on their site, or anywhere on the open web. The only place the statistic exists is the CT Acquisitions page itself. PitchBook's actual published lower-middle-market findings point the other way: their Q1 2026 US PE Middle Market work reports that lower-middle-market deals carried *a nearly identical number of poor outcomes and fewer outright losing deals* than the upper middle market, at a 39% pooled gross IRR and 3.3x TVPI — the best of any size band. **Unverifiable and possibly contradicted, so not carried.**

**This needs a wider look.** `ctacquisitions.com` is cited on **13 live pages**, carrying load-bearing statistics: rollover prevalence at "70–85% of U.S. lower-middle-market PE buyouts as of 2026, up from about 55% in 2019"; earnout payout rates by length ("12-month earnouts pay out 68% on average, 36-month only 41%"); rollover share "commonly 15–30%"; and the LBO capital structure split on `/blog/how-private-equity-actually-finances-a-buyout`. Having caught this source attributing a precise comparative figure to a report that appears not to exist, none of those should be treated as verified. Reviewing them is a separate piece of work, flagged rather than started.

## Kept from the run

- **Two CTR fixes**, which is the right target given that the bottleneck is click-through rather than ranking:
  - `/blog/sell-a-business-but-keep-control` title and meta — 116 impressions, **0 clicks at position 7.2**, never title-edited. The new title leads with the query wording that the 301'd URL actually ranks for.
  - `/blog` title and meta — 333 impressions, 1 click (0.30%) at position 18.7. The index ranks for buyout demand, and the new copy names buyouts and recapitalizations instead of "Exit Planning & M&A Insights".
- **The 11 U.S.C. § 510(a) subordination point**, carried into the surviving post. Verified verbatim: *"a subordination agreement is enforceable in a case under this title to the same extent that such agreement is enforceable under applicable nonbankruptcy law."* The survivor had no mention of bankruptcy or of subordination's statutory basis at all, so this fills a genuine gap in its own argument.
- **Fresh GSC and coverage data.**

## Dropped or corrected

- The duplicate post.
- Two link additions, retargeted; this branch already links the survivor from both donors with fuller anchors.
- The duplicate's worked § 453A interest-charge example was **not** carried: it runs on a different invented company with a $5 million note, and the surviving post's note is deliberately sized *below* the $5,000,000 threshold — which is the point its own section makes.
- A **false cross-reference** introduced by the run: `/blog/types-of-buyouts` claimed the seller-financing post "works that charge through on a hypothetical". It does not, by design. Reworded to what the post actually does.

## Coverage

32 of 33 URLs indexed. `/industries/restaurants` holds at "Discovered – currently not indexed" with no `lastCrawlTime`, stable since it recovered on 10-15. Requesting indexing in Search Console remains the only lever.

## Verification

11 U.S.C. § 510(a) read against the statute. The PitchBook attribution chased to the named report and to PitchBook's own published middle-market findings; CT Acquisitions' root and a fake path tested (200 and 404), so the page content is real — the problem is what it rests on. Corrected keyword invariants clean, 49 mappings. All `jobTitle` values read "Managing Partner"; both approved biography lines present; no deal data, clients, counts, sizes, timelines or outcomes added.
