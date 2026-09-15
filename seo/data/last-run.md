# Daily SEO run — 2026-09-15

Three pages edited; no new post (the 2-per-7-days cap is met by 09-12 and 09-13). The day's one real opportunity is the **"what is an IBO" acronym cluster**: ~165 impressions across 20 query variants, all at positions 5-12, **zero clicks** — a snippet problem, not a ranking problem. Audit: 0 errors, 2 pre-existing warnings.

## GSC totals — 28 days (2026-08-16 → 09-12)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 20 | 1,046 | 1.91% | 18.0 |
| Prior 28d | — | — | — | — |

The API returns no prior window (`totals.previous: null`, every page `prev: null`), so **rule 6 (decliners) could not be run**.

## Changes

| Page | Action | Data point |
|---|---|---|
| `/blog/independent-buyout-explained` | title + meta (+ og/twitter) | `lowCtr`: 152 impr, CTR 1.32% vs 3.0% expected at position 5.8. The old title led with "Independent Buyout"; searchers type "what is an ibo" (56), "whats an ibo" (16), "ibo meaning in business" (12). Title now leads with the literal query (59 chars); description opens "IBO stands for Independent Buyout" (146 chars). |
| `/blog/exit-planning-for-business-owners` | title | `audit.json` WARN: 70 chars, truncated, never changed since publication. Now 57. |
| 3 posts | link | In-prose links to the succession page (below). |

## Coverage — 2 URLs not PASS, neither re-expanded, deliberately

- `/blog/how-pe-firms-value-a-company` — "Crawled - currently not indexed", `lastCrawlTime 2026-09-09`, *before* the 09-10 expansion. Google has not seen the strengthened page yet; more words now would be churn.
- `/blog/family-business-succession-planning` — "Discovered - currently not indexed", **no `lastCrawlTime`**: never fetched, so crawl demand is the constraint, not content. Added in-prose links from `independent-buyout-explained`, `exit-planning-for-business-owners` and `how-to-sell-a-business-to-private-equity`. Inbound 7 → 10.

## Skipped

- **Striking distance** — "what is an ibo" at 6.9 on `/blog/independent-buyout-explained` is the best expansion target on the site, but the post was created 09-05, inside the 14-day cool-down. Eligible 09-19.
- **`/business-valuation-calculator`** — title 74 / meta 194 chars (WARN), but not in `lowCtr` at position 44.8, and its title/meta may only change per rule 3.

## Needs a human

1. **Homepage vs. the IBO post for "what is an ibo"** (homepage 30 impr @ 9.8; post 24 @ 6.9). The post should win, but the fix is a homepage change I am barred from making: move the homepage title off the acronym and add one in-body link to `/blog/independent-buyout-explained`.
2. ~~**The apex domain still collects impressions** - `iboadvisors.com/` (106 impr, 7 clicks) and its calculator (136 impr) appear beside their `www` twins, and are 2 of the 3 cannibalization rows. `vercel.json` has the apex→www 301; please confirm production serves 301, not 200.~~ **Confirmed and stale — no action needed.** Production was checked on 2026-09-15: `https://iboadvisors.com/` and `https://iboadvisors.com/business-valuation-calculator` both return **308** to their `www` twins. The redirect shipped in #20 on 09-13; the GSC window here (08-16 → 09-12) ends before it, so these rows clear on recrawl.
3. **The calculator sits at position 71.7** for "business valuation calculator" plus ~12 variants (~80 impr, 0 clicks). No on-page edit reaches position 70 — this is the links track in STRATEGY.md §5.
