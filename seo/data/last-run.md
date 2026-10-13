# Daily SEO run — 2026-10-13

First run since 09-26 and the first with a populated prior window: clicks nearly quadrupled, average position improved 5.8 places. The budget went to the page carrying both the biggest CTR gap and three striking-distance queries, plus one more title fix and the cluster-3 post. Audit clean: 0 errors, 0 warnings, 30 indexable pages.

## GSC totals — 28 days (2026-09-13 → 10-10)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 78 | 3,974 | 1.96% | 12.2 |
| Prior 28d | 20 | 1,046 | 1.91% | 18.0 |

## Changes — 4 pages edited, 1 new post

| Change | Data point |
|---|---|
| **`family-business-succession-planning`** — title + meta | `lowCtr`: 577 impr, 2 clicks (0.35%) at pos 13.2 vs 1.0% expected, the biggest gap on the site. Last touched 09-10 |
| Same page — two H2s (~860 words): the liquidity-planning sequence with debt-capacity arithmetic, and which advisors a family-owned company needs | Three `strikingDistance` queries on one page: liquidity planning for family business succession (158 impr, 17.8), which advisors are best suited to sell a family-owned company (101, 6.3), the integrated tax/estate variant (31, 7.7). Sourced to GF Data via Capital Pad, 15 U.S.C. § 78o(b)(13) |
| **`selling-to-private-equity-pros-and-cons`** — title + meta | `lowCtr`: 244 impr, 1 click (0.41%) at pos 8.8 vs 3.0%. Never title-edited |
| **New: `/blog/majority-recapitalization`** — 1,798 words, 9 internal links, a three-scenario preference waterfall on an invented $5M EBITDA company | Cluster 3's highest-priority uncovered keyword. Sourced to GF Data via Capital Pad, 26 U.S.C. § 721 |
| `minority-recapitalization-explained` and `management-buyout-vs-private-equity` → the new post | Cluster-3 hub (112 impr, 6.1); the page already pricing a 20% rollover (143 impr, 11.2) |
| `management-buyout-vs-private-equity` → `what-happens-after-private-equity-buys-your-company`, anchor "private equity buyout" | Rule 5: winner holds 52+33 impressions and the query in its title since 09-20; this page holds 11+10 |

## Skipped

- **Rule 3** — `/blog` (335 impr, pos 16): the lost CTR is the brand query the homepage already converts at pos 1.1, not a title fault. `independent-buyout-explained` (111 impr, 0 clicks, pos 5.0): our own independentbuyout.com also ranks page one, so the click may land where GSC cannot see it. Calculator and `minority-pe-stake` in cool-down.
- **Rule 4** — homepage rows barred from body edits; the `"search funds…"` quoted-phrase query (20 impr) is too thin for a section. **Rule 5** — differentiating the loser's title/H1 would be a 5th content page. **Rule 6** — `decliners` empty.

## Coverage

`/industries/restaurants`, the only non-PASS URL, moved from "Discovered – currently not indexed" to **"URL is unknown to Google"**. It is in the sitemap, canonical is right, it was expanded on 09-26, and it has 6 inbound internal links against 4 each for its two indexed siblings — not an on-page fault, so no budget went to it. **Human action: request indexing in Search Console.**

## Needs a human

1. **~165 impressions, 0 clicks, no page:** `buyout private equity` (63 @ 22.9), `private equity buyout` (43 @ 18.3), `buyout companies` (25 @ 23.4), `pe buyout` (15 @ 28.5). Flagged 09-26, still not in `keywords.json`, and two pages split it. A definitional "types of buyouts" pillar is the fix.
2. Apex and www both still appear for the calculator. The 301 is correct; consolidation lag.
3. The new post has 2 in-body inbound links, one below the site floor; tomorrow should add one.

## Flagged

Nothing. Banned-phrasing scan: 0 matches across all HTML. No firm-level claims added; every number in the new post is either invented and labelled as such or linked to a source opened this run.
