# Daily SEO run - 2026-09-05

First run with GSC data. The bottleneck isn't titles or CTR - Google has indexed exactly one URL: **16 of 18 sitemap URLs are "Discovered - currently not indexed" or "URL unknown to Google"**, and all 16 blog posts had **zero contextual links to another post**. Today went at that, plus the priority-1 keyword we already get impressions for and have no page for.

## GSC totals (28d: 2026-08-06 to 2026-09-02)

| Metric | Current | Prior 28d |
|---|---|---|
| Clicks | 7 | no data |
| Impressions | 145 | no data |
| CTR | 4.83% | no data |
| Position | 9.9 | no data |

Prior-window data is null on this pull, so rules 3, 4 and 6 had nothing to act on - `lowCtr`, `strikingDistance` and `decliners` are all empty.

## Changes

- **New post `/blog/independent-buyout-explained`** - "What Is an Independent Buyout (IBO)?", 1,775 words, 10 internal links, 3 inbound. Data point: 24 impressions this window across *what is an ibo / whats an ibo / what is ibo in business / independent buyout / independent buyout (ibo)*, all landing on the homepage at positions 5.8-10.5, with no page targeting them. Specificity comes from a made-up $8M EBITDA worked example plus four sources opened directly (26 U.S.C. §1042 via Cornell, NCEO, IRS NIIT, Capital Pad on hold periods). No firm or deal claims.
- **Internal linking pass on 4 posts** (the cap): `business-exit-planning-every-option`, `exit-planning-for-business-owners`, `how-pe-firms-value-a-company`, `ibo-vs-pe-numbers-comparison`. Each went from 0 to 3-6 contextual links plus a calculator link, aimed at the three URLs Google has never crawled - `/business-valuation-calculator`, `/blog/how-private-equity-actually-finances-a-buyout`, `/blog/minority-pe-stake-board-control-veto-rights` - which now have 7, 5 and 5 inbound links.
- **Hero alt text** filled on those 4 posts. Audit: 0 errors, warnings 60 → 52. No `Updated` dates bumped; every edit added well under 150 words.

## Skipped

- **Title/meta rewrites**: 17 of 19 pages exceed 60 chars, but no page clears rule 3's ≥100 impressions + CTR gap. Not guessing.
- **Cannibalization**: the only entry is `iboadvisors.com/` vs `www.iboadvisors.com/` on *"shareholder capital" business consultant* (17 impressions each). Host duplication, not two pages - no on-page fix applies.

## Needs a human

1. **Verify the apex → www 301 is live.** `vercel.json` has it; GSC still splits impressions across both hosts.
2. **`/blog/what-is-an-independent-buyout` is 301'd to `/blog` in `vercel.json`** - the exact-match slug for today's post, so I used `independent-buyout-explained`. If that redirect is a leftover, worth reclaiming.
3. **Request indexing for `/business-valuation-calculator`** - unknown to Google despite 7 internal links.
4. **Build the `/independent-buyout` pillar**; today's post is the cluster's draft centre.
5. 12 posts still have 0 contextual links and empty alt text - three more runs at 4/day.
