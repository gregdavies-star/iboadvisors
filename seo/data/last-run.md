# Daily SEO run — 2026-11-01

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
