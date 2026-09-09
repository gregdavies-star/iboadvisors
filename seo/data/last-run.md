# Daily SEO run - 2026-09-09

**17 of 19 sitemap URLs are now "Submitted and indexed"**, up from 1 four days ago.
So today went at the homepage's CTR gap and the two URLs still outside the index.
Audit clean: 0 errors, warnings 52 → 49.

## GSC totals (28d: 2026-08-10 to 2026-09-06)

| Metric | Current | Prior 28d |
|---|---|---|
| Clicks | 10 | no data |
| Impressions | 281 | no data |
| CTR | 3.56% | no data |
| Position | 9.6 | no data |

`totals.previous` is `null` again, so rule 6 (decliners) had nothing to compute.

## Changes

- **Homepage title + meta** - the only page clearing rule 3 (185 imp, CTR 1.62% vs 3.0% expected at pos 9.2). The old title held neither "independent buyout" nor "IBO", yet *what is an ibo* (21 imp, pos 9.7) and *independent buyout* (5, pos 5.8) land here. Now `Independent Buyout (IBO): Sell Without Private Equity` (53 chars) + a 147-char description answering that query. Brand suffix dropped from the title; `og:site_name` and JSON-LD carry it and *ibo advisors* sits at pos 1.1.
- **`/blog/family-business-succession-planning`** - rule 2, "Discovered, currently not indexed", never crawled, 0 contextual links out. Added 450 words on how a family transfer actually gets funded (worked hypothetical, 26 USC §453). Words 1,430 → 1,879; out-links 0 → 4; inbound 2 → 5; hero alt filled; `Updated` bumped so sitemap `lastmod` prompts a recrawl.
- **New post `/blog/what-happens-after-private-equity-buys-your-company`** - 1,969 words, 9 internal links, 6 sources each opened directly (SEC's 2015 $39M Blackstone monitoring-fee action; AlixPartners - 65% of firms see CEO turnover in the hold, 86% firm-driven; add-ons 72.9% of 2025 buyouts; 6.0-year median hold). Other numbers are an invented $8M-EBITDA/8.5x example. No firm or deal claims.

## Skipped

- **Rule 4:** both striking-distance queries are the homepage (body copy off-limits), and `independent-buyout-explained` already targets *what is an ibo*.
- **Rule 5:** the one entry is the apex-vs-www host split, not two pages.
- **Title-length WARNs on 17 pages:** no CTR data justifies a rule-3 rewrite yet.
- **Cluster-1's leftover keywords** share intent with the hub `/`, so the new post took the priority-2 keyword instead of manufacturing cannibalisation.

## Coverage

`/blog/how-pe-firms-value-a-company` ("Crawled, currently not indexed") was recrawled today at 03:47, after the 2026-09-05 link pass - left alone; inbound rose 5 → 7. Recheck next run.

## Needs a human

1. **Apex → www 301 still isn't effective:** `iboadvisors.com/` took 106 imp / 7 clicks against `www`'s 185 / 3.
2. **`ensure-jsonld.mjs` sets `datePublished` = `dateModified` = the `Updated` line**, so a refresh rewrites the publish date. Split them.
3. **Request indexing** for the succession post and `how-pe-firms-value-a-company`.
4. **Build the `/independent-buyout` pillar** - the homepage now targets the category term.
5. 11 posts still have 0 contextual links and empty hero alt: three more runs at 4/day.
