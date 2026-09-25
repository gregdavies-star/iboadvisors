# Daily SEO run — 2026-09-25

Rules 1–2 clean: 0 audit errors, 24/24 sitemap URLs PASS. Rules 3–7 all blocked — every `lowCtr` row is in its 28-day cool-down, every `strikingDistance` row is the homepage or already answered, and the new-post cap is full (09-19, 09-21). Budget went to rule 8: six links from four donors, lifting the in-body inbound floor from 5 to **6 across every post**.

## GSC totals — 28 days (2026-08-26 → 09-22)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 51 | 2,276 | 2.24% | 16.1 |
| Prior 28d | — | — | — | — |

`totals.previous` is still null, so **rule 6 yields no decliners** (~2026-10-15).

## Changes — 4 pages edited, 6 links added

| Donor → target | Data point |
|---|---|
| `minority-pe-stake-veto-rights` → `restaurant-ma` **+** `healthcare-services-ma` | Both at the floor of 5 inbound (51 impr @ 7.2; 19 @ 16.1). Donor 15 in / 7 out; its capex-consent hypothetical is the mechanic both targets already source. |
| `independent-buyout-explained` → `ibo-government-contractors` **+** `selling-to-pe-pros-and-cons` | Both at the floor of 5. Donor is the strongest indexed post (188 impr @ 5.6) and linked neither. |
| `how-pe-firms-value-a-company` → `management-buyout-vs-private-equity` | Floor of 5, and **0 impressions** since publishing 09-19 despite PASS. |
| `how-private-equity-finances-a-buyout` → `management-buyout-financing` | 73 impr at **23.6** — the biggest impression pool no rule reaches, since position >20 excludes it from `strikingDistance`. Donor 16 in / 10 out. |

Each link restates only what its target already sources. No edit added 150 words: no `Updated` bumps, no `lastmod` change.

## Skipped

- **Rule 3** — all 3 rows in cool-down: IBO explainer (09-15), `/blog` (09-08), veto rights (09-18).
- **Rule 4** — 3 of 4 rows are the homepage (body barred); the 4th is `what is an ibo` on the explainer, answered in its H1.
- **Rule 5** — 2 of 3 rows are apex/www duplicates; the third needs a homepage body edit.

## Needs a human

1. **`what is an ibo`** — 64 impr, 0 clicks (explainer 26 @ 7.0, homepage 38 @ 9.8). `independentbuyout.com` also ranks page one here, so the click may land on our own domain where GSC cannot see it — **not** a snippet fault. In-remit fix remains one homepage link to the explainer.
2. **Apex is still the indexed calculator** — 371 impr @ 36.1 against `www`'s 43 @ 10.6. The `vercel.json` 301 is correct (re-verified today), so this is consolidation lag; check GSC's duplicate/canonical report.
3. **Stranded past page 2, no rule can fire:** `management buyout financing` (73 impr, 23.6), `exit planning for business owners` (44, 63.7).
4. **`family-business-succession-planning`** — 2,542 words, 13 inbound, indexed, **zero impressions**. Targeting problem, not a link problem.

## Flagged

Nothing. Banned-phrasing scan: 0 matches across 29 HTML files. The approved "$1.8 billion" line is intact in both places; the deal counts cut on 09-12 are still gone, so that flag stays dropped.
