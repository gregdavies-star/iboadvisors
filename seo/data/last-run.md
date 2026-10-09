# Daily SEO run — 2026-10-09

Audit clean, 0 errors. Run #44, fired 17:15 UTC.

The run's report opens "thirteen days since the last run". That is what `main` looks like — its changelog ends 09-26. This is the twelfth consecutive daily run, and all twelve are stacked unmerged on this branch. Because every run reads `main`, each one re-reads the same keywords as uncovered and the same pages as never rewritten. That is why this run wrote a second types-of-buyouts post and a third advisor section on the same page.

## GSC totals — 28 days (2026-09-09 → 10-06)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 80 | 4,337 | 1.84% | 13.6 |
| Prior 28d | 12 | 350 | 3.43% | 13.3 |

The prior window is history filling in, not a baseline. Rule 6 returned 0 decliners and stays uninformative until about November.

## Changes kept — 2 pages edited, 0 new posts

| Change | Data point |
|---|---|
| **`family-business-succession-planning`** — a second liquidity section, "What the handover can actually pay at close" (472 words), plus an independent-valuation role added to the existing advisor list | 538 impr / 2 clicks @ 13.3 against a 1.0% expectation, the site's biggest CTR gap. The new section serves `liquidity planning for family business succession` (156 impr @ 17.7) from the deal side rather than the family-need side |
| **`what-happens-after-private-equity-buys-your-company`** — one link added | Rule 5: this page and `management-buyout-vs-private-equity` split the buyout-type queries. It now links the types-of-buyouts pillar; the MBO page already did from 10-08 |

`keywords.json`: five of the run's six buyout keywords mapped to `/blog/types-of-buyouts` — item 1 of the 09-26 human list, which no rule could otherwise reach. 48 mappings.

## Dropped or corrected on merge

| What | Why |
|---|---|
| **New post `/blog/types-of-buyouts-explained` (2,725 words)** — dropped | Duplicate of `/blog/types-of-buyouts` on this branch (2,856 words): same seven structures, same side-by-side comparison, same worked example. Its one distinct section, "Private equity buyout", is the subject of `/blog/private-equity-buyout-explained`, which this branch also carries. Second duplicate of this post in three days, and the eighth duplicate overall since 09-28 |
| **The run's third advisor section** on family succession — dropped, one role carried across | It covered the same ground as the existing 472-word section: six roles, the integrated-firm question, the each-specialist-optimises-their-own-piece failure mode, a screening question. Kept the existing section and added the one role it genuinely lacked — an independent valuation firm, now proposed by two consecutive runs. The list is six roles; the section and the FAQ were both updated to match |
| **The run's title and meta rewrites** on family succession and minority recapitalization — dropped | This branch rewrote both on 10-08 and 10-06 respectively, for the same CTR rows, and neither has shipped. Rewriting an unshipped title twice in three days gives Google nothing to measure |
| **Four link targets** | All pointed at the dropped post. Retargeted to `/blog/types-of-buyouts` |
| **One keyword mapping** | The run mapped `private equity buyout` to its new post; cluster 1 on this branch already maps it to `/blog/private-equity-buyout-explained`. Added would have put one keyword in two clusters with conflicting targets |

## Verified

The one new cited claim: lower-middle-market deals in the $25M–$50M enterprise-value band carried **4.0x total debt and 3.4x senior debt** through the first nine months of 2025. Confirmed against the cited page, which sources it to GF Data's Q3 2025 ESOP Advisor report, Tables 3–4. That page also warns that senior debt is a component of total debt rather than an additional amount; the section uses 3.4x alone and does not stack the two, which is correct.

Its arithmetic re-derives: $4M EBITDA × 7.0x = $28M enterprise value; less $5M existing debt = $23M equity; 3.4x × $4M = $13.6M senior capacity; less the existing $5M = $8.6M of new borrowing; about $8M of cash at close against $23M of value, leaving $15M in a note. The two liquidity sections share one invented company and do not contradict each other.

## Coverage

`/industries/restaurants` is still "URL is unknown to Google", and the inspection returns **no last-crawl time at all** — Google has never fetched it. That is why its six inbound links have not helped: links cannot promote a URL that was never crawled. The run reached the same conclusion from the other direction (fetched live 200, correct canonical, no on-page cause) and also declined to churn it. A manual Inspect and Request Indexing is the only lever.

`management-buyout-vs-private-equity` remains the one "Crawled – currently not indexed" URL; the 10-08 taxonomy section on this branch is the differentiation attempt.

## Needs a human

1. **Merge this branch.** Twelve runs, 33 indexable pages. It is the only fix for the duplicate cycle, which has now produced eight duplicate posts.
2. **Request Indexing on `/industries/restaurants`** — never crawled, as above.
3. **Calculator stranded on page 7:** `business valuation calculator` (61 impr @ 70.3) plus five variants at 62–73. Title and meta were rewritten 09-17; this needs links, not copy. Note the standing rule that the homepage does not link it.
4. **`exit planning for business owners` at 85.3** — covered keyword, same authority diagnosis.
5. **The 1,200–2,000 word guide in `DAILY_PROMPT.md`** — three verified posts have now run over it.
6. **Next-post candidate from the run:** a $40M carve-out MBO query ranking at 7.8 with no page on carve-outs. Worth a decision once the stack is merged, not before — an unmerged stack is what produces the duplicates.

## Flagged

Nothing factual. Banned-phrasing scan clean; Chasen and Gleeman are Managing Partner everywhere; all JSON-LD parses; both approved biography lines intact.

One process note: the changelog union had to be redone with semantic dedup. The 10-08 fold re-serialised that file, so its lines no longer byte-match the merge base and a string-based union silently duplicated about 160 entries. Future unions on this file must compare parsed objects, not strings.
