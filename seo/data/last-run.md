# Daily SEO run — 2026-09-29

Audit was already clean (0 errors, 30 indexable pages), so the budget went to rules 3 and 7. Rules 4, 5 and 6 each produced a defensible no-action, detailed below. One new post, one title/meta rewrite, three inbound links — 4 content pages edited, at the cap.

## GSC totals — 28 days (2026-08-30 → 09-26)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 60 | 3,020 | 1.99% | 14.5 |
| Prior 28d | — | — | — | — |

`totals.previous` is still null, so **rule 6 yields no decliners** (~2026-10-15).

## Changes

| Change | Data point |
|---|---|
| **`alternatives-to-selling-to-private-equity`** — title + meta, og/twitter matched | Only `lowCtr` row outside cool-down: 149 impr, 2 clicks (1.34%) at 8.9 against 3.0% expected, never rewritten since publication 09-08. Keyword moved to the front; brand suffix dropped to fit 59 chars |
| **New: `/blog/earnout-in-business-sale`** — 2,113 words, 12 internal links, 7 sources all opened before citing | Cluster-3 `earnout in business sale`. Earnouts appear 58 times across 15 pages; no page targets the term |
| `rollover-equity-second-bite-explained` → new post | Joint-highest in-body inbound (8), already has an earnout section |
| `how-to-sell-a-business-to-private-equity` → new post | 82 impr @ 16.5; its Earnouts bullet cites the same SRS Acquiom data |
| `what-happens-after-private-equity-buys-your-company` → new post | Biggest page (355 @ 12.0); its value-creation plan is what an earnout is measured against |

## Skipped

- **Rule 3** — three rows in cool-down: `/blog` (09-08), explainer (09-15), veto rights (09-18).
- **Rule 4** — nothing eligible. Three rows are the homepage (body barred); the explainer answers "what is an ibo" in its opening; `family-business-succession-planning` (25 impr @ 6.6) is 12 days past a content edit, **eligible 10-01**. The fourth, `"search funds keep offering a proven path to ownership"` (20 impr @ 7.4), is a navigational search for the Stanford GSB article we cite — not ours to win.
- **Rule 5** — four of six rows are apex/`www` duplicates of our own domain, or the brand term. The one genuine pair (`buyout private equity` / `private equity buyout`) already complies: titles distinct, loser already links winner.
- **Rule 7 pick** — `majority recapitalization` and `recapitalization vs sale` rank higher in cluster 3 but would restate three existing posts; that overlap caused the 09-21 duplicate.

## Coverage

`/industries/restaurants` is the only non-PASS URL and has regressed to **"URL is unknown to Google"**, no crawl time. No on-page fault: 200, indexable, canonical correct, in the sitemap, 6 inbound links, +420 words on 09-26; both identical-template siblings were indexed 09-26. Reads as crawl latency on a page first published 09-25, so nothing was bolted on. If still unknown on 10-02, request indexing manually.

## Needs a human

1. **Conflicting earnout stats.** `rollover-equity-second-bite-explained` says 27% of earnouts pay nothing (Glacier Lake citing SRS Acquiom); the new post says 41%, verbatim from SRS Acquiom's own page. Irreconcilable. I did not overwrite sourced copy — pick one and I will align the other.
2. **~26 impressions at positions 30-72 landing on `/blog`** for `types of buyouts` and four `secondary buyout` variants. Added both terms to cluster 3 as uncovered.
3. **Apex still outranks `www`** on the calculator and `"shareholder capital" business consultant` — 301 correct, consolidation lag.
4. **Stranded past page 2:** `management buyout financing` (80 @ 22.1), `exit planning for business owners` (45 @ 62.5), `business valuation calculator` (64 @ 70.3).

## Flagged

Nothing. Banned-phrasing scan: 0 matches across 35 HTML files, all JSON-LD parses, both approved "$1.8 billion" lines intact. The new post's only specificity is public record plus an explicitly invented $6M EBITDA company.
