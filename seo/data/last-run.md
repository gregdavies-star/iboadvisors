# Daily SEO run — 2026-10-15 (folded into #66)

Run #50 fired at 15:25 UTC, +4.4 hours after its 11:00 cron. Steps 1–11 succeeded; only step 12 (open a pull request) failed, as on every run while the repo setting stays off.

## The duplicate cycle is not over — it is conditional on merging

The 10-15 run wrote `/blog/seller-financing-business-sale`, the **thirteenth duplicate** of this programme, against the `/blog/seller-financing-in-a-business-sale` the 10-14 run wrote one day earlier. Same topic, slug missing "in-a".

This corrects the conclusion recorded yesterday. The 10-14 run produced no duplicate because it read a `main` that finally contained the merged stack. The 10-15 run read the same `main` — but #66 is still open, so the seller-financing ground read as uncovered again and the run took it. **The mechanism was never "the backlog"; it is that a run cannot see unmerged work.** One unmerged PR is enough to reproduce it, within a day.

## Kept from the run

- **Fresh GSC and coverage data.**
- **The keywords fix, independently identical to the 10-14 run's.** Both runs mapped `private equity buyout`, `buyout private equity` and `pe buyout` into clusters 3 and 5 and deduped the repeated cluster-3 keywords. Two runs converging on the same diagnosis from the same data is strong corroboration. 49 mappings; all four corrected invariants clean.
- **A set-off section** carried into the surviving post. Buyers negotiate the right to reduce the note by indemnity or purchase-price-adjustment claims they *assert* rather than prove, stacked on escrows already held back. All four statistics verified on SRS Acquiom's Lower Middle Market M&A page: virtually all LMM deals carry at least one escrow or holdback; the median general indemnification escrow is 12.5% of transaction value against 10% across all deals; 92% include a purchase price adjustment; nearly half carry a separate PPA escrow at a median 1.23%. The arithmetic holds — 12.5% + 1.23% + a 15% note is 28.7%, so "well over a quarter" is right.
- **A seller note / earnout / rollover comparison table**, also carried across. Its one statistic — earnouts achieving about 21 cents on the dollar — was **uncited** in the dropped version and linked only to our own earnout post. Verified at SRS Acquiom's M&A earnouts overview ("earnouts achieve about 21 cents on the dollar and are contested at least 28% of the time"), and the attribution was added rather than left resting on an internal link.

## Dropped from the run

- **`/blog/seller-financing-business-sale`**, the duplicate. The 10-14 version survives: 2,645 words against 2,343, and it cites 26 U.S.C. § 453 and § 1274A as well as § 453A, all three read in full against the statute.
- **Two link additions**, retargeted. Both runs linked the new post from `/blog/how-private-equity-actually-finances-a-buyout` and `/blog/management-buyout-financing`; the 10-14 anchors are fuller and were kept.
- A link on `/blog/earnout-in-business-sale` **auto-merged without conflicting** and pointed at the dropped slug. Retargeted. This is the failure mode that needs a positive check every time — a clean merge is not evidence of a correct one.

## Coverage — two real changes

- **All four posts from the 10-14 merge are now "Submitted and indexed"**, inside 24 hours. 32 of 33 URLs indexed.
- **`/industries/restaurants` recovered**, from "URL is unknown to Google" back to "Discovered – currently not indexed". The sequence is 10-12 discovered, 10-13 unknown, 10-14 unknown, 10-15 discovered. **The "not a transient" call recorded on 10-14 was wrong** — it was transient, over a two-day window rather than one. The underlying problem is unchanged: `lastCrawlTime` has never been returned for this URL in any inspection. Requesting indexing in Search Console remains the only lever, and no page-side work will substitute.

## Verification

Both salvaged sections verified against their primary sources, including the one claim the run left uncited. Set-off arithmetic re-derived. Both SRS URLs return 200 and a fake path on the same host returns 404, so the 200s are meaningful. Corrected keyword invariants all clean. All `jobTitle` values read "Managing Partner"; both approved biography lines present; no deal data, clients, counts, sizes, timelines or outcomes added.
