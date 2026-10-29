# Daily SEO run — 2026-10-29

One new post, one expansion, two links. The valuation cluster's last high-intent keyword is now covered; every `lowCtr` row but one is cool-down-locked, and the one that is free has a position problem, not a snippet problem.

| Window | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| 09-29 → 10-26 | 73 | 4,073 | 1.79% | 12.3 |
| 09-01 → 09-28 | 67 | 3,399 | 1.97% | 14.2 |

## Changes

- **New post `/blog/quality-of-earnings-report` (rule 7), 2,179 words.** Highest-priority uncovered keyword in `keywords.json` (cluster 4); one distinct new post in the trailing 7 days, so under the cap. Anchored on the Limbach Holdings / PNC credit agreement of 9 Sep 2026, read on EDGAR: it lets a lender take a QoE *instead of* audited financials above $15M of target revenue, and exempts QoE-evidenced add-backs from the 15%-of-EBITDA cap the merely-asserted ones share. Worked EBITDA bridge on an invented company; $455,000 of struck adjustments priced at GF Data's 6.8x and 3.4x senior leverage. 10 internal links out, 4 in.
- **`/blog/family-business-succession-planning` +344 words (rule 4).** "which advisors offer integrated tax, estate, and business succession planning for multi-generation family businesses?" — 28 impressions at **8.1**, answered only in an unheaded paragraph. Added it verbatim as an H2, plus a four-model provider table and the four dated documents that make "integrated" mean something. `Updated` bumped; last content edit 10-13, outside cool-down.
- **Two inbound links (rules 7, 8)** from `/blog/adjusted-ebitda-add-backs` and `/blog/how-pe-firms-value-a-company`, both placed on paragraphs that already discuss QoE work.

## Considered and skipped

- **`lowCtr`: 7 of 8 rows cool-down-locked** (retitled 10-12 to 10-25). The 8th, `/blog/dividend-recapitalization`, is free but its head term "dividend recapitalization" sits at position **30** (38 impr) — 0 clicks on 145 impressions is noise at a 1% expected CTR, and no title fixes page 3.
- **`/blog/sell-part-of-your-business-keep-control` (150 impr, 7.4)** is a 301 in `vercel.json`; Google is still indexing the dead URL. Nothing on-page to rewrite.
- **`strikingDistance`:** the two bigger family-business rows already have exact-match H2s. "ibo finance" (pos 5) lands on the homepage, body off-limits. "owner buyout" expanded 10-26.
- **`cannibalization`:** all six rows are brand/category terms the homepage already wins at 1–3.5, or were handled 10-25/10-26. `independentbuyout.com` is ours and absorbs some of these clicks — not a snippet fault.
- **`decliners`:** the single row is apex `iboadvisors.com` (6 → 0 clicks). That is the apex→www 301 consolidating, not a loss.

## Coverage

35 of 36 sitemap URLs PASS. `/industries/restaurants` is still NEUTRAL, "Discovered - currently not indexed"; expanded 10-21 and 10-24 with two inbound links added. No further on-page lever — it needs crawl time.

## For a human

- **43 impressions at positions 52–66** on "private equity accounting firm valuation" and "private equity and accounting firm valuations", with no page targeting them. CPA-firm roll-ups are not in `keywords.json`; worth adding to cluster 7.
- **"industry multiples database"** — 66 impressions at 44.5 on `/ebitda-multiples-by-industry`. A downloadable version of that table is the digital-PR asset in STRATEGY.md §5.

**Flagged:** nothing this run.
