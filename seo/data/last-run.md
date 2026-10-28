# Daily SEO run — 2026-10-28

One new post plus its three inbound donors — the full four-page cap. Every `lowCtr` row with a real snippet fault is inside its 28-day cool-down, and the `strikingDistance` rows are already answered on the page, so the new-post slot was the only lever that moved.

| Window | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| 09-28 → 10-25 | 74 | 4,072 | 1.82% | 12.3 |
| 08-31 → 09-27 | 62 | 3,206 | 1.93% | 14.5 |

## Changes

- **New post: `/blog/sde-vs-ebitda`, 1,901 words (rule 7).** One post shipped in the trailing 7 days, so the cap was open. "SDE vs EBITDA" is the highest-priority uncovered keyword in `keywords.json` (cluster 4), and it beats the other cluster-4 gap, "quality of earnings report", which the 10-22 add-backs post already covers in substance. Three sources, all opened and quoted: SBA 7(a) (`$5 million` maximum, "changes of ownership"), GF Data via ACG (7.3x TTM adjusted EBITDA, 80 Q1 2026 transactions), SEC non-GAAP C&DI 100.01 on recurring operating expenses. The worked company is invented and labelled as such; its 3.0x SDE quote is explicitly made up, because no reliable public SDE dataset exists at this size — the post says so rather than borrowing a blog's number.
- **`/blog/adjusted-ebitda-add-backs` → new post (rules 7, 8).** Its FAQ already answered the SDE question in three sentences with nowhere to send the reader. 7 in-links.
- **`/blog/how-pe-firms-value-a-company` → new post.** Strongest page on the site (26 in-links); its normalization step said above-market owner comp is added back without naming the measure that adds back all of it.
- **`/blog/choosing-an-ma-advisory-firm` → new post.** 9 in-links, last touched 09-22. Its "$3M+ EBITDA vs Main Street broker" FAQ now carries the earnings-measure tell.

No deal-data flags this run.

## Considered and skipped

- **8 of 10 `lowCtr` rows** were retitled 10-11 to 10-25. Of the two out of cool-down, `/blog/how-pe-firms-value-a-company` ranks 52–66 on accounting-firm valuation terms and `/blog/dividend-recapitalization` sits at 30 on its own head term — both ranking problems, not snippet faults.
- **`/blog/sell-part-of-your-business-keep-control` (150 impr, pos 7.4)** is a 301 to `/blog/sell-a-business-but-keep-control` in `vercel.json`. There is no page to retitle; the live target was rewritten 10-19.
- **All 3 `strikingDistance` rows** are `/blog/family-business-succession-planning`, now out of cool-down — but it already carries `<h2>Liquidity planning for family business succession</h2>` and `<h2>Which advisors are best suited to plan the sale of a family-owned company?</h2>` verbatim. Rule 4's precondition is not met.
- **Cannibalization:** brand rows won by the homepage at 1.0–3.6; buyout rows addressed 10-21 and 10-26.
- **Decliners:** the one row is apex `iboadvisors.com` going 7 clicks → 0. That is the apex→www 301 consolidating, not a loss.

## Coverage

34 of 35 indexed. `/industries/restaurants` holds at "Discovered — currently not indexed". Yesterday's unmerged branch added the first `/blog` → `/industries` links; nothing further is available on-page. Audit: 0 errors, 0 warnings, 37 indexable pages.

## For a human

1. **Request indexing for `/industries/restaurants`** in Search Console. Five expansions and a link pass have not moved it; this is now crawl priority.
2. **Split `/blog/family-business-succession-planning`** (4,938 words, 2 clicks on 491 impressions). Two of its three striking-distance queries are advisor-selection intent trapped inside a succession post.
3. **Branch `seo/daily-1793117895` (10-27) is still unmerged** and carries four link edits. Today's donors were chosen to avoid it, but the changelog and `last-run.md` will conflict.
4. No `ahrefs-latest.json` in the repo, so rule 7's volume/KD preference ran unweighted again.
