# Daily SEO run — 2026-10-10

Audit clean, 0 errors, 0 warnings. Run #45, fired 16:03 UTC.

The run's report opens "first run since 09-26". That is what `main` looks like — its changelog ends 09-26. This is the thirteenth consecutive daily run, and all thirteen are stacked unmerged on this branch.

## GSC totals — 28 days (2026-09-10 → 10-07)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 76 | 4,160 | 1.83% | 13.2 |
| Prior 28d | 16 | 527 | 3.04% | 16.2 |

`totals.previous` is populated at last, so rule 6 has a real baseline from the next pull.

## Changes kept — 2 pages edited, 0 new posts

| Change | Data point |
|---|---|
| **`independent-buyout-explained`** — a 329-word "What does IBO mean in business?" disambiguation section plus an FAQ entry | The acronym cluster is page-one with no clicks: `what is an ibo` 43 impr @ 8.3, `ibo meaning in business` 27 @ 11.2, `ibo finance` 28 @ 4.9. This is the first run to separate Independent Buyout from **institutional buyout** and from **Independent Business Owner**, which is the standing positioning question on these terms. It answers it by disambiguation rather than denial, which is the right call |
| **`minority-recapitalization-explained`** — the majority-recap comparison paragraph rewritten and linked | 136 impr, 0 clicks at 7.9 against a 3.0% expectation. The run's paragraph is sharper on the point that matters — same word, opposite answer on who controls the board — and it carries the inbound link |

## Dropped or corrected on merge

| What | Why |
|---|---|
| **A new post at `/blog/majority-recapitalization-vs-sale`** (1,966 words) | The ninth duplicate since 09-28, and the first written straight onto the keeper's own slug — an add/add conflict. This branch's version is 2,695 words with six sources against five, and its year-5 table runs three scenarios with annualised returns while correctly modelling that a weaker business repays less debt. The run's single version got exactly that wrong (below) |
| **A third liquidity section and a fourth advisor section** on family succession | The page already carries two deliberately distinct liquidity sections and a six-role advisor section. The run's advisor framing said *five* functions where the page says six. Nothing in either section was absent from the page |
| **The run's title and meta rewrites** on family succession and minority recapitalization | This branch rewrote both on 10-08 and 10-06 for the same CTR rows and neither has shipped. A third unshipped rewrite gives Google nothing to measure |
| **One over-firm claim** in the kept IBO section | The cited source says a leveraged buyout "can be considered as a type of" institutional buyout; the copy said it "is simply" one. Narrowed to match |
| **The rollover-equity paragraph** | Dropped in favour of the branch's existing one, which links the same post and makes the same structural point more sharply. No link lost |

## A correction to this branch's own work

The kept IBO section settles a question I got wrong on 10-08. On that date I split a taxonomy row on `management-buyout-vs-private-equity` that read "Employee buyout / IBO — a trust holding the company for its employees", on the reasoning that the Independent Buyout is *not* an employee trust.

That reasoning was wrong. This firm's own canonical page defines an Independent Buyout as "a sale of your company to a trust held for the benefit of your own employees", and the structure runs on § 1042, which requires the buyer to be an employee stock ownership trust or an eligible worker-owned cooperative. The IBO **is** an employee-trust structure.

The two-row split still stands — the types-of-buyouts pillar lists ESOP and IBO as separate structures, and the real distinction is sponsor-level leverage and pricing with no fund on the cap table, not the absence of an employee trust. But the IBO row was describing it wrongly, so it now reads "A trust for the company's own employees, with the leadership already in place continuing to run it / Sponsor-level leverage and pricing, with no fund on the cap table and no exit clock".

## Verified

Corporate Finance Institute, on institutional buyout: "a controlling interest (at least 51%)" purchased by "an institutional investor such as a venture capital firm, private equity firm, or a financial institution", and "a direct opposite of a management buyout" — all faithful to the source. The one over-firm claim was narrowed as above. The page is a 2019 definitional reference, which is appropriate for terminology rather than a statistic.

The dropped post's arithmetic was re-derived and one figure does not hold. Its premise is sound ($6M EBITDA at 7.0x = $42M; $21M debt and $21M equity; a $8.4M roll is 40% of the equity layer; sponsor preferred $12.6M accruing at 8% reaches $18.5M over five years; $51M of exit equity less that leaves $32.5M of common, and 40% is $13.0M; the $8.4M alternative at 6% reaches $11.2M). But its closing claim — "flat EBITDA and the same preference leaves you roughly $7 million" — only works if the preference is *not* accrued. Carried through consistently at $18.5M, flat EBITDA leaves about $4.6M. The error understates the risk the passage is trying to demonstrate. Noted rather than repaired, since the post itself was dropped.

This branch's own year-5 table was re-checked and holds: $11M at 7.0x less $14M debt gives $63.0M and 30% is $18.9M, +17.6% a year; $8M at 6.5x less $18M gives $34.0M and $10.2M, +4.0%; $6.5M at 6.5x less $22M gives $20.3M and $6.1M, −6.3%.

## Worth adding later

The dropped post's one genuinely better idea was a **worked preference waterfall** — showing the sponsor's liquidation preference eating the exit equity before the rolled stake sees a dollar. This branch's post names the preference as a term to settle but does not work it through. It could not be carried across as written, because the two posts use different invented companies ($8M of EBITDA here, $6M there), and fabricating the arithmetic on this page's company is not a merge decision. Worth a deliberate addition after the merge.

## Coverage

`/industries/restaurants` is still the only non-PASS URL of 29, still "URL is unknown to Google", and the inspection still returns **no last-crawl time at all**. The run reached the same conclusion independently — on-page is clean, both identical siblings are indexed, no fault left to fix — and also declined to edit it. A manual URL Inspection and Request indexing is the only lever.

## Needs a human

1. **Merge this branch.** Thirteen runs, 33 indexable pages, nine duplicate posts written because every run reads a `main` that lacks the stack. One of them has now landed on the keeper's own slug.
2. **Request Indexing on `/industries/restaurants`** — never crawled.
3. **The 1,200–2,000 word guide in `DAILY_PROMPT.md`** — three verified posts have run over it.
4. **The `seo-on-merge` ordering fix for `lastmod`.**
5. The run re-raised `buyout private equity` / `private equity buyout` / `pe buyout` (121 impr, 0 clicks) as unactioned. It is actioned on this branch: `/blog/private-equity-buyout-explained` was built for it on 10-04 and all three keywords are mapped to it. The run cannot see that from `main`.

## Flagged

Nothing beyond the two items above. Banned-phrasing scan clean; Chasen and Gleeman are Managing Partner throughout; all JSON-LD parses; both approved biography lines intact.
