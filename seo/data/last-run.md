# Daily SEO run — 2026-10-06

Audit clean (0 errors, 0 warnings). Two title/meta rewrites, one expansion covering two striking-distance queries, one cannibalization link, one new post. In merge resolution the new post was dropped as a sixth write of the same topic, one of the two title/meta rewrites was not applied, and the liquidity section was corrected (see below). `/industries/restaurants` is still the only non-PASS URL and was left alone on purpose.

## GSC totals — 28 days (2026-09-06 → 10-03)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 73 | 4,040 | 1.81% | 14.0 |
| Prior 28d | 9 | 253 | 3.56% | 9.8 |

The prior window predates most index coverage (6 pages / 26 queries vs 33 / 277), so the CTR and position "declines" are a denominator effect, and `decliners` is empty.

## Changes — 4 pages, 1 new post

| Change | Data point |
|---|---|
| `selling-to-private-equity-pros-and-cons` — title + meta | lowCtr: 182 impr, 1 click (0.55%) at 8.1 vs 3.0% expected; never rewritten |
| `minority-recapitalization-explained` — title + meta | lowCtr: 128 impr, **0 clicks** at 8.2 vs 3.0%. Title last touched 09-08 — exactly 28 days, cool-down elapsed; description never rewritten |
| `family-business-succession-planning` — +591 words in two H2s, `Updated` bumped | strikingDistance: "liquidity planning for family business succession" (129 @ 17.6) and "which advisors are best suited to plan the sale of a family-owned company?" (79 @ 6.3) — neither had a heading |
| `management-buyout-vs-private-equity` — 2 links | "private equity buyout" splits with `/what-happens-after-…`, which is titled for it and holds 85 of 106 impressions; linked on that anchor. Second link seeds the new post |
| ~~`keywords.json`~~ — **not applied** | Both keywords already point at `/blog/majority-recapitalization-vs-sale` on this branch. |
| ~~New `/blog/majority-recapitalization`~~ — **dropped in merge resolution** | Sixth write of this topic and the third at this slug. `/blog/majority-recapitalization-vs-sale` from 09-30 is already on this branch and covers the same ground. Both inbound links were unlinked rather than retargeted, since both pages already link the survivor; the prose was kept. |

## Skipped

- **Rule 2** — restaurants is now "URL is unknown to Google". Every on-page cause rule 2 lists is absent: canonical fine, indexable, 6 inbound links (PASS siblings have 4), expanded 09-26 and inside the cool-down. Discovery, not on-page.
- **Rule 3** — `/blog` (295 @ 14.9) and `alternatives-to-…` (159 @ 9.0) qualify; the cap went to bigger deficits. Five other rows are in cool-down.
- **Rule 4** — "ibo finance" and "what is an ibo" land on the homepage, whose body is off limits.

## Needs a human

1. **`what is an ibo`** — homepage (23 @ 10.3) vs explainer (26 @ 7.0). The homepage should give way; the fix is homepage body copy, so it is an owner call, not a 301.
2. **Apex still indexed** on `/business-valuation-calculator` (16 impr @ 2.1), four weeks after the `vercel.json` 301.
3. **`/industries/restaurants`** — needs a manual "Request indexing"; the API cannot do it.
4. **Stranded:** "management buyout financing" (13 @ 29.5), "exit planning for business owners" (24 @ 85.3).

## Flagged

Nothing. Banned-phrasing scan: 0 matches; 30 JSON-LD blocks parse; the approved "$1.8 billion" line is intact.

**Housekeeping:** `seo/tmp-retitle.mjs` and `seo/tmp-changelog.mjs` were deleted in merge resolution, as this run asked.

**Corrected in review:** the liquidity section said household spending of $300,000 a year *plus a $2 million reserve "on top"*, then sized the requirement at $300,000 / 4% = $7.5 million — which excludes the reserve, and every later figure followed from it. Including the reserve would have made the gap about $8.7 million pre-tax against $7 million of borrowing capacity, inverting the section's conclusion. The unused clause was dropped, keeping all of the arithmetic correct: $4.5M / 0.75 = $6.0M, and 3.0x $4M = $12M less $5M drawn = $7M.

**`selling-to-private-equity-pros-and-cons`:** its title and meta were kept as this branch already had them. This run judged the page "never rewritten" because main does not carry the 10-02 rewrite; the descriptions are close, and this branch's names the worked $35M deal that nets $19M after tax.
