# Daily SEO run — 2026-10-11

Audit clean, 0 errors, 0 warnings. Run #46, fired 16:28 UTC.

The run's report opens "first run since 09-26". That is what `main` looks like — its changelog ends 09-26. This is the fourteenth consecutive daily run, and all fourteen are stacked unmerged on this branch.

## GSC totals — 28 days (2026-09-11 → 10-08)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 81 | 4,176 | 1.94% | 12.9 |
| Prior 28d (08-14 → 09-10) | 17 | 738 | 2.30% | 16.4 |

First genuinely usable prior window. CTR fell because impressions grew faster than clicks, and position improved 3.5 places.

## Changes kept — 1 page edited, 0 new posts

| Change | Data point |
|---|---|
| **`family-business-succession-planning`** — a new section, "Paying the estate's bill without losing the company": 26 U.S.C. § 303 redemptions and *Connelly v. United States* | The page is the worst payer on the site: 576 impr, 2 clicks, 0.35% against 1.0% expected. This is the first run in six to add material the page did not already have, and it is the best single contribution any run has made to this branch |

This is genuinely new ground. § 303 lets a company redeem part of a decedent's stock and have the payment treated as a sale rather than a dividend, converting company cash into estate liquidity without the family losing control. *Connelly* is the 2024 decision that changed how a redemption-funded buy-sell policy interacts with estate valuation. Neither appeared anywhere on the site before today.

## Verified

**26 U.S.C. § 303**, against the statute: the quoted phrase "shall be treated as a distribution in full payment in exchange for the stock so redeemed" is verbatim; the threshold is stock exceeding 35% of the gross estate less § 2053 and § 2054 deductions, which is what "adjusted gross estate" means in practice; and the cap is the sum of death taxes and the funeral and administration expenses deductible under § 2053. All three as written.

***Connelly v. United States***, against the opinion: argued 27 March 2024, decided 6 June 2024, "Thomas, J., delivered the opinion for a unanimous Court" with no dissent or concurrence. Crown held $3 million of life insurance to redeem Michael Connelly's **77.18%** stake. The estate's analyst valued the company at **$3.86 million** and the shares at about **$3 million** ($3.86M × 0.7718 = $2.98M). The IRS valued the company at **$6.86 million** ($3.86M + $3M) and the shares at **$5.3 million** ($6.86M × 0.7718 = $5.29M), assessing **$889,914** more estate tax. The holding is quoted exactly: "Crown's contractual obligation to redeem Michael's shares did not diminish the value of those shares." Every figure and the arithmetic check.

## Dropped or corrected on merge

| What | Why |
|---|---|
| **A new post at `/blog/majority-recapitalization-vs-sale`** (2,570 words) | The tenth duplicate since 09-28, and the second day running written onto the keeper's own slug. This branch's version is 2,695 words and better structured: it sources the rollover percentage, runs three year-5 scenarios with annualised returns, and treats the tax question separately |
| **The run's four-claims opening** to its liquidity section | Restates the framing of the liquidity section already on the page |
| **Its worked figure of $5 million cash at close** | Contradicts this branch's verified $8 million on the same invented company ($4M EBITDA, $28M EV, $5M debt, $23M equity). Two cash-at-close numbers for one company is the defect class this branch keeps catching |
| **A FOURTH advisor section** | It auto-merged into a second position on the page and said *five* seats where the page says six roles. Caught by the duplicate-heading check, which flagged the advisor H2 appearing twice |
| **Title and meta rewrites** on family succession, selling-to-private-equity and management-buyout-vs-private-equity | All three were already rewritten on this branch on 10-08, for the same CTR rows, with nothing shipped. This is the fourth consecutive run to propose a family-succession title rewrite |
| **Three keyword mappings** | The run mapped `private equity buyout`, `buyout private equity` and `pe buyout` to `what-happens-after`; cluster 1 here maps all three to the pillar built for them on 10-04. Keeping both would put three keywords in two clusters with conflicting targets — the same collision as 10-08, and the third run to attempt it |
| **Three link additions** | No-ops: this branch already links the same posts from the same paragraphs |

## Coverage

`/industries/restaurants` is still the only non-PASS URL, and the run has now independently reached the same diagnosis this branch reported on 10-09: **no `lastCrawlTime` at all**, so Google has never fetched the 09-26 expansion, and with six inbound internal links this is neither an on-page nor an orphan fault. Its own words: "Request indexing in Search Console."

## Needs a human

1. **Merge this branch.** Fourteen runs, 33 indexable pages, ten duplicate posts — two of them written onto a keeper's own slug on consecutive days.
2. **Request Indexing on `/industries/restaurants`** — never crawled. Both this branch and the run now say the same thing.
3. **The 1,200–2,000 word guide in `DAILY_PROMPT.md`** — three verified posts have run over it.
4. **The `seo-on-merge` ordering fix for `lastmod`.**

The run also re-raised the apex/`www` calculator split and the two page-2 strandings (`management buyout financing`, `exit planning for business owners`). The apex ask is closed and this row is lag, not news. The strandings are real and unactioned, and they want links rather than copy.

## Worth adding later

Two citations the dropped post had and this branch's version does not: 26 U.S.C. § 302 on redemptions, and the IRS questions-and-answers page on the § 163(j) business-interest limitation. The second is the more useful — a leveraged recap's interest deductibility is a real constraint the current post does not mention. Noted rather than transplanted, since writing it properly is not a merge decision. The preference-waterfall idea from the 10-10 run still stands too.

## Flagged

Nothing factual. Banned-phrasing scan clean; Chasen and Gleeman are Managing Partner throughout; all JSON-LD parses; both approved biography lines intact.
