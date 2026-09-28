# Daily SEO run — 2026-09-28

One new post on majority recapitalization — the highest-priority uncovered keyword now that clusters 1 and 2 are fully covered. Four link edits: two to lift `/blog/sell-part-of-your-business-keep-control` off the site floor, two to seed the new post. No title/meta rewrites and no expansions: every candidate was inside a cool-down or blocked by the homepage rule.

## Search Console (28 days, 2026-08-29 → 2026-09-25)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 57 | 2,794 | 2.04% | 14.9 |
| Prior 28 | — | — | — | — |

The pull returned `previous: null`, so nothing here is a trend claim and **rule 6 (decliners) could not run**.

## Changes

| Page | Action | Why |
|---|---|---|
| `/blog/majority-recapitalization` | **New post** | Rule 7 (1 post in trailing 7d). Cluster-3, uncovered. Recap intent already lands here: "minority recapitalization" 10 impr @21.6, "minority recap" 6 @9.0, "majority recapitalization" 1 @35.0. 2,100 words, 13 internal links, 5 sources all opened with WebFetch. |
| `/blog/rollover-equity-second-bite-explained` | Link | Rule 2. Target unknown to Google on 1 in-body inbound. Donor has the freshest crawl on the site (09-27), 17 in / 11 out. |
| `/blog/what-happens-after-private-equity-buys-your-company` | Link | Rule 2. Second inbound for the same target; donor crawled 09-26. |
| `/blog/minority-recapitalization-explained` | Link | Rule 8. Cluster-3 hub, 88 impr @9.4 — the minority/majority pairing. |
| `/blog/business-exit-planning-every-option` | Link | Rule 8. Option 2 said "some or all of the company" and never named the "some" case. |

Audit: 30 indexable pages, **0 errors, 0 warnings**. Sitemap 30 URLs.

## Skipped

- **Rule 3.** All four low-CTR pages fail the 28-day cool-down: `/blog` (09-08), `independent-buyout-explained` (09-15), `minority-pe-stake…` (09-18), `alternatives-to-selling…` (title written at publication, 09-08).
- **Rule 4.** Three of five striking-distance rows are the homepage (body copy off-limits). The fourth ("what is an ibo" on `independent-buyout-explained`, 26 impr @7.0) already answers the query in its title, meta and opening paragraph. The fifth is a quoted exact-phrase query.
- **Rule 5.** All four cannibalization rows are ours: three apex-vs-`www` pairs the 301 already handles, plus "what is an ibo" splitting the homepage and the post — the only lever there is a homepage edit, which is barred.

## Coverage

- `/industries/restaurants` — still "Discovered, currently not indexed", and `lastCrawlTime` is **empty: Google has never fetched it**. It carries 7 inbound links against 4 for each indexed sibling and was expanded 420 words on 09-26. No on-page fix helps an uncrawled URL, so it got one more contextual link and no churn.
- `/blog/sell-part-of-your-business-keep-control` — "unknown to Google", published 09-26. Normal lag, but it had 1 in-body inbound. Now 4.

## For a human

1. `/industries/restaurants` likely needs a manual **Request Indexing** in Search Console; the job has done everything it can twice.
2. Zero clicks on the IBO acronym cluster (~185 impressions, positions 5–11) is most likely `independentbuyout.com` taking the click — our domain, invisible to this property. Confirm there before treating it as a snippet fault.
3. Nothing flagged under the no-deal-data rule.
