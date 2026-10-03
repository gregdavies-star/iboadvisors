# Daily SEO run — 2026-10-03

Rule 1 clean (0 errors, 0 warnings, 30 pages). `/industries/healthcare-services` slipped to "Crawled – currently not indexed", so rule 2 took first call on the budget and rules 3, 4 and 7 took the rest. Both caps hit exactly: 4 content pages, 1 new post.

## GSC totals — 28 days (2026-09-03 → 09-30)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 67 | 3,513 | 1.91% | 14.1 |
| Prior 28d | 7 | 145 | 4.83% | 9.9 |

First non-null prior window, but it covers the fortnight the site was still being indexed. Deltas against it are noise for ~2 more weeks.

## Changes

| Change | Data point |
|---|---|
| **`/industries/healthcare-services`** — 480 words on revenue multiples (`margin × EBITDA multiple`, conversion table across the 5.0x–8.5x band, home-based-care note); FAQ into body + JSON-LD | Only non-PASS URL of 29, and its **top query is "revenue multiples healthcare"** (5 @ 20.0) — a term the page never used |
| `what-happens-after-pe-buys` → healthcare page | 405 impr @ 11.8, strongest blog page; its add-on paragraph already names a healthcare platform |
| **`alternatives-to-selling-to-private-equity`** — title + meta; snippet now names all seven routes | 158 impr @ 9.0, **CTR 1.27% vs 3% expected**; only `lowCtr` row out of cool-down |
| **`family-business-succession-planning`** — 400 words on the five advisory roles and their sequencing | "which advisors are best suited to plan the sale of a family-owned company?" — **50 impr @ 6.3, zero clicks**, unanswered. Uses the post's own $23M hypothetical: 20% gifted now costs $4.6M of exclusion, $11.6M in twelve years |
| **New: `/blog/majority-recapitalization-explained`** — 2,422 words, 15 internal links, 2 inbound, 6 sources (§721, §351, §368(c), Topic 409, GF Data, Porte Brown) | First uncovered cluster-3 keyword; we rank **35** for it today on the minority-recap page. Spine: rolling 30% leaves 30% of a $23.0M levered stub, not of the $42M company sold |

## Skipped

- **Rule 3** — 6 of 7 rows in cool-down (`/blog` 09-08, explainer 09-15, succession 09-10, veto rights 09-18, minority recap 09-08; pros-and-cons published 09-21).
- **Rule 5** — page cap reached. Two brand rows are apex/`www` duplicates of ours; `what is an ibo` splits the homepage (40 @ 10.0) and the explainer (26 @ 7.0), and homepage body copy is barred.
- **Rule 6** — the lone decliner is apex `iboadvisors.com/` (2 clicks vs 5): the 301 consolidating, not content.

## Needs a human

1. **`private equity buyout` / `buyout private equity`** (104 impr): `what-happens-after` (52 @ 26.3, 33 @ 20.3) vs `management-buyout-vs-private-equity` (11 @ 6.9, 8 @ 12.0). Both mapped to `what-happens-after` in `keywords.json` — its title was rewritten 09-20 for exactly this — but the rule-5 link didn't fit the cap. **First item tomorrow.**
2. **`/industries/restaurants` regressed** to **"URL is unknown to Google"** despite the 09-26 expansion and two new inbound links. Nothing on-page explains it; likely an inspection-API artefact. Worth one manual "Request indexing".
3. **Apex still outranks `www` on the calculator** — 397 @ 34.0 vs 93 @ 8.4. Consolidation lag.
4. **`what is an ibo`** — 66 impr, 0 clicks across two of our pages. `independentbuyout.com` is ours and ranks page one, so the click may land where this property cannot see it.

## Flagged

Nothing. Banned-phrasing scan: 0 matches across 35 HTML files; all JSON-LD parses. Every figure added today is an explicitly invented hypothetical or links to a source opened this run.
