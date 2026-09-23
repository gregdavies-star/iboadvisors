# Daily SEO run — 2026-09-23

Coverage is clean for the first time: **24/24 sitemap URLs PASS**, so yesterday's indexing ask is closed. Rules 3, 4, 5 and 7 are all blocked again — every `lowCtr` row is inside its 28-day cool-down, both actionable `strikingDistance` rows are the homepage, and the new-post cap is full (09-19, 09-21). Budget went to rule 8: four inbound links that lift the site floor from 4 to 5. Audit: **0 errors, 0 warnings**.

## GSC totals — 28 days (2026-08-24 → 09-20)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 43 | 2,055 | 2.09% | 16.9 |
| Prior 28d | — | — | — | — |

`totals.previous` is still null, so **rule 6 yields no decliners** (~2026-10-15).

## Changes — 4 link edits

| Donor → target | Data point |
|---|---|
| `how-private-equity-actually-finances-a-buyout` → `ibo-government-contractors` | Target at 4 in-body inbound, the site floor, while ranking 4.0. Donor has the most internal authority (16 in). New bullet: FAR 31.205-20 makes ordinary acquisition interest unallowable. |
| `rollover-equity-second-bite-explained` → `choosing-an-ma-advisory-firm` | Target 5 in, cluster-8 hub, 5 impr at 8.0. Donor 14 in / 7 out. |
| `business-exit-planning-every-option` → `the-broken-owner-exit-conversation` | Target 5 in, thinnest post (1,197 words). Donor already said "the two that generate a fee for the advisor" — anchored in place, 0 words added. |
| `how-pe-firms-value-a-company` → `exit-planning-for-business-owners` | Target 5 in and ranking **85.3** on its own covered keyword. Donor 15 in / 9 out. |

None added 150 words, so no `Updated` bumps and no sitemap `lastmod` change.

## Skipped

- **Rule 3** — all 4 rows in cool-down: `what-happens-after-pe` (182 impr, rewritten 09-20), IBO explainer (180, 09-15), veto rights (170, 09-18), `/blog` (161, 09-08).
- **Rule 4** — 2 of 3 rows are the homepage (body barred); the third is `what is an ibo` on the IBO explainer, which already answers it in the H1 and first section.
- **Rule 5** — apex/www rows clear on recrawl. `what is an ibo` again needs a homepage body edit.

## Needs a human

1. **`what is an ibo`**, 64 impr, 0 clicks (repeat). The explainer at 7.0 should beat the homepage at 9.8; one homepage link to `/blog/independent-buyout-explained` is the fix and only a human can add it.
2. **Apex is still the indexed calculator.** `iboadvisors.com/business-valuation-calculator` holds 186 impressions at ~70; the `www` copy holds 5. Check GSC's duplicate/canonical report — the 301 verified 09-15 has not consolidated.
3. **Two covered keywords stuck off page 1** with no rule firing: `exit planning for business owners` (24 impr, 85.3) and `management buyout financing` (71 impr across variants, 28-30). Both need a content decision, not a link.

## Flagged

Nothing. Banned-phrasing scan: zero matches across all HTML.
