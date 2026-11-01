# Daily SEO run — 2026-11-01

> **Fold note (added when this run was folded into `claude/seo-work-qcfmfg`).**
> — **Third consecutive run to write `/blog/quality-of-earnings-report`**, which has been on the open
> branch since 10-29. The 2,596-word draft was dropped, along with its card, its `keywords.json` entry and
> two of its three links. **Salvaged into the keeper**, after the filing was checked on EDGAR: Oil-Dri
> Corporation of America's revolving credit agreement with **BMO Bank N.A.**, Ninth Amendment of October 7,
> 2026, whose Consolidated EBITDA clause (s) adds back "adjustments reflected in any quality of earnings
> report prepared by a nationally or regionally recognized accounting firm" with no cap - a second,
> unrelated lender corroborating the Limbach/PNC point the keeper already made. Two notes on the citation:
> the lender is BMO and the underlying agreement dates from January 27, 2006, neither of which the draft
> named; and the exhibit *index* in that 8-K misdates the Ninth Amendment as April 16, 2024 while the 8-K
> body gives the October 7, 2026 event date, so the body is what the citation follows. One paragraph on
> which months the working capital average is drawn from was salvaged too. The keeper is now 3,011 words.
> — **Kept whole: the `/blog/exit-planning-for-business-owners` correction.** It had called a QoE
> "essentially a financial audit", which is wrong and is live in production. Good catch by the run.
> — **Dropped: both retitles.** `/blog/types-of-buyouts` keeps the 10-31 wording - this run's title names
> the acronyms its own meta already lists. `/blog/private-equity-buyout-explained` keeps the 10-29 title:
> this is the third independent retitle proposal for that page and the second to lead with the definitional
> family rather than the conceded head term, which corroborates the decision; but "Meaning" earns its place
> for the position-8 "pe buyout meaning" query, and this run's "Debt, Price, Payout" drops it.
One new post (quality of earnings), two title/meta rewrites, three inbound links. Clicks and impressions up on the prior window; average position improved two places.

| Window | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| 10-02 → 10-29 | 73 | 4,285 | 1.70% | 11.8 |
| 09-04 → 10-01 | 69 | 3,843 | 1.80% | 13.8 |

## Changes

- **New post `/blog/quality-of-earnings-report` (rule 7).** No post in the trailing 7 days; QoE was the highest-value uncovered cluster-4 keyword. 2,596 words. Three sources, each opened today: SEC non-GAAP C&DIs 100.01/100.04 (verbatim); Oil-Dri's Ninth Amendment of 7 Oct 2026 on EDGAR, which adds back "adjustments reflected in any quality of earnings report" inside its Consolidated EBITDA definition; GF Data via ACG (7.4x with a sell-side QoE vs 7.0x without, 360 deals since Q3 2024). Worked example is an invented $4.2M-EBITDA distributor. No fee or timeline figures — only vendor blogs publish them.
- **`/blog/types-of-buyouts` title + meta (rule 3).** 428 impressions, 0.93% CTR at 9.2 vs 3.0% expected; never rewritten. The title now names the structures the variant queries use (LBO, MBO, MBI, ESOP, recap, IBO).
- **`/blog/private-equity-buyout-explained` title + meta (rule 3).** 418 impressions, 0.48% at 16.0 vs 1.0%; never rewritten. Head terms sit at 25–47 and no title fixes that, so it leads with the definitional family already on page one ("what is a pe buyout", 8.3) and carries the page's own 46-cents-on-the-dollar figure.
- **Three links into the new post** from `how-pe-firms-value-a-company`, `exit-planning-for-business-owners` (which called a QoE "essentially a financial audit" — corrected) and `adjusted-ebitda-add-backs`.

## Considered and skipped

- **`strikingDistance`:** both large rows already have dedicated H2s on `/blog/family-business-succession-planning`. "types of buyouts" and "owner buyout" point at pages edited 10-26, inside cool-down; "independent buyout" and "ibo finance" land on homepage body copy, off limits.
- **`lowCtr`:** four rows were retitled 10-25, inside cool-down; two more are retired URLs that 301 in `vercel.json`, so their impressions are historical.
- **`cannibalization`:** three of four rows are `/blog` outranking its own children, and the 10-26 run already widened the index's hero anchor.

No deal-data flags this run.

## Coverage

35 of 36 pass. `/industries/restaurants` holds at "Discovered – currently not indexed" with no crawl recorded — Google has not fetched it, so more content cannot be the lever. Audit: 0 errors, 0 warnings.

## For a human

1. **Request indexing for `/industries/restaurants`.** Nothing on-page is left to do.
2. **`/blog/how-pe-firms-value-a-company` cites "29.4% of management-adjusted EBITDA" to an AI-content marketing site**, plus two more claims of the same class. Worth replacing — it is the most-linked page on the site.
3. **"SDE vs EBITDA" is the last uncovered cluster-4 keyword.** Recommend closing it as out of scope: SDE is used below ~$1M of EBITDA.
