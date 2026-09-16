# Daily SEO run — 2026-09-16

An internal-links-only day. Every rule that would have produced a title, meta or expansion edit is inside its cool-down, so the run spent its budget on the one uncapped lever: **`/blog/exit-planning-for-business-owners` ranks 85.3 for its own exact-match keyword** with 24 impressions and had just 2 in-body inbound links. Audit: 0 errors, 2 pre-existing warnings. Coverage improved — 21 of 22 sitemap URLs now PASS.

## GSC totals — 28 days (2026-08-17 → 09-13)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 21 | 1,161 | 1.81% | 18.3 |
| Prior 28d | — | — | — | — |

`totals.previous` is still `null` and every page row has `prev: null`, so **rule 6 (decliners) could not be run** for the fifth day running. `opportunities.decliners` is empty by construction, not by measurement.

## Changes — 3 pages, links only

| Donor page | Data point |
|---|---|
| `/blog/minority-pe-stake-board-control-veto-rights` | Joint-fewest outbound in-body post links (4) while being the #2 page by impressions (131 @ 9.8). Added links to the exit-planning guide and to the succession page. |
| `/blog/how-private-equity-actually-finances-a-buyout` | Most internal authority on the blog (15 inbound), indexed. Link placed where the page already argues the capital stack is set before exclusivity. |
| `/blog/minority-recapitalization-explained` | Joint-fewest outbound links (4), 51 impr @ 11.5. Link placed in the bullet that already raises a 5-10 year runway to a full exit. |

Exit-planning in-body inbound links: 2 → 5. No `Updated` dates bumped (each edit is under 150 words).

## Coverage

- `/blog/how-pe-firms-value-a-company` flipped to **PASS / Submitted and indexed** — the 09-10 expansion worked; no further action.
- `/blog/family-business-succession-planning` is the only non-PASS URL, and its state moved *backwards*, from "Discovered - currently not indexed" to **"URL is unknown to Google"**. Verified today: live 200, in `sitemap.xml`, canonical correct, no `noindex`, 11 inbound internal links, 1,884 words. Nothing left to fix on-page — this is crawl budget. Added an 11th inbound link and otherwise left it alone.

## Skipped, deliberately

- **Rule 3 (lowCtr)** — both rows are in cool-down: `/blog/independent-buyout-explained` (157 impr, CTR 1.27% vs 3.0% expected) had title+meta rewritten 09-15; `/blog/minority-pe-stake-board-control-veto-rights` (131 impr, 0 clicks) on 09-08. Eligible 10-13 and 10-06.
- **Rule 4 (striking distance)** — all 3 rows are the homepage or `/blog/independent-buyout-explained`. Homepage body copy is barred; the post is inside its 14-day content cool-down. Eligible 09-19.
- **Rule 7 (new post)** — cap met: 2 posts in the trailing 7 days (09-12, 09-13).
- **`/business-valuation-calculator`** — title 74 / meta 194 chars (the site's only 2 warnings), but it is not in `lowCtr`, so rule 3 does not authorize the edit. Carried forward.

## Needs a human

1. **Homepage vs. the IBO post for "what is an ibo"** (homepage 30 impr @ 9.8; post 26 @ 7.0) — repeated from 09-15 and still live. The homepage has **only two outbound internal links** (`/blog`, `/business-valuation-calculator`) and none to `/blog/independent-buyout-explained`. Both fixes are homepage body/title changes I am barred from making.
2. **Authorize the calculator title/meta rewrite** (74 → ≤60 chars, 194 → ≤155). It is a money page at position 47-72 for ~12 "business valuation calculator" variants, ~85 impressions, 0 clicks.
3. **Apex/www cannibalization is confirmed resolved** — re-verified today: `iboadvisors.com/` and its calculator both return **308** to `www`. Two of the three cannibalization rows are apex twins inside a window that ends the day the redirect shipped. Dropping this flag.

## Flagged

Nothing. A site-wide grep for the banned deal phrasings returns zero matches, and no source or instruction asked for deal specifics this run.
