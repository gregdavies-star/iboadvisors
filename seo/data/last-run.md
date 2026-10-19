# Daily SEO run — 2026-10-19 (folded into #66, with main merged in)

Run #54 fired at 17:16 UTC. Steps 1–11 succeeded; only step 12 failed.

## main moved, and the merge exposed a defect it could not fix

PR #67 landed: every visible full-name input loses its `name` attribute and gains `data-split-name`, with `tracking.js` mirroring the split into hidden `firstname` / `lastname` fields at submit. Without it HubSpot's forms collector wrote the whole full name into First Name.

The merge brought that onto all 38 pages that exist on `main`. **It could not reach the two posts that exist only on this branch.** `blog/dividend-recapitalization` and `blog/seller-financing-in-a-business-sale` were written by daily runs from a template predating #67, so both still carried `name="fullName"` and `name="name"` with no `data-split-name`. Shipped that way, the collector would have mangled names on exactly those two pages while the other 38 were fixed. Both now carry `main`'s markup verbatim.

**The general lesson: a post a run creates before a template change carries the old furniture, and a clean merge never reveals it.** Worth a positive check on every future base merge.

I also nearly reported this backwards. My first check looked for visible `firstname`/`lastname` inputs and for the text "Full name", and concluded the change had been dropped on all 40 pages. It had not — #67 keeps the visible label and adds no visible fields. The real defect was two pages, not forty.

## A sixteenth duplicate — on the surviving slug itself

The run wrote `/blog/seller-financing-in-a-business-sale`, the same path as the post already on this branch: the first add/add of this series. This branch's version wins at 3,388 words and 9 sources against 2,242 and 4.

## Kept — including a correction to our own copy

- **The IBBA / M&A Source Market Pulse survey, which corrects a claim this post was making.** Since 10-15 the post has asserted that "no broad public dataset reports seller-note prevalence the way SRS Acquiom reports earnouts". That was wrong, and the run found the counter-example. Verified verbatim at the release: "completed by 255 Business Brokers and M&A Advisors", "Respondents completed 181 transactions this quarter", "sellers received 83% to 92% cash at close on average", and seller financing "accounted for less than 10% of most deals in Q2, somewhat below trend". The sentence now reports those figures and limits the no-dataset claim to deals above the survey's up-to-$50M range.
- **A second filed subordination agreement** (2006; borrower, junior investor and Silicon Valley Bank), which shows the *junior* side's protections where the 10-17 exhibit showed the senior side's. Verified verbatim: a blockage notice runs 180 days for a payment default and 120 days for any other event of default; "no Standstill Period shall be in effect for more than 180 days during any 365 Day Period"; "there must be a consecutive 185-day period in any 365 Day Period during which no Standstill Period is in effect"; and an exhibit stating "There shall be no prepayment of the Subordinated Indebtedness." The run paraphrased the second as "in each 365-day period"; the agreement says "in any", and the agreement's wording was used.
- Fresh Search Console and coverage data.

## Dropped

- The duplicate post, and link additions this branch already carries.
- **A third consecutive rewrite of `/blog/sell-a-business-but-keep-control`'s title and meta.** 10-16, 10-18 and 10-19 have each rewritten it; the latter two were rewriting the shipped original because neither could see the 10-16 version on this branch. The 10-16 version was kept.

## Coverage

32 of 33 URLs indexed. `/industries/restaurants` holds at "Discovered – currently not indexed" with no `lastCrawlTime` — a fifth day since it recovered on 10-15.

## Verification

Two new sources checked against the originals; both verified verbatim, and one of them overturned a claim this branch had been carrying for four days. The form-collector change verified positively across every page that has a full-name input: none still carries a `name` attribute, none is missing `data-split-name`, and `tracking.js` is identical to `main`'s.
