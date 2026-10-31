# Daily SEO run — 2026-10-31

One new post on the highest-priority uncovered keyword, two title/meta rewrites, two inbound links.
Clicks and impressions both up on the prior window; average position 13.8 → 12.1.
Audit: 0 errors, 0 warnings across 36 indexable pages.

| Window | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| 10-01 → 10-28 | 72 | 4,206 | 1.71% | 12.1 |
| 09-03 → 09-30 | 69 | 3,681 | 1.87% | 13.8 |

## Changes

- **New post `/blog/quality-of-earnings-report` (rule 7), 2,052 words.** Top uncovered keyword in `keywords.json` (Valuation, priority 4); no page targets it, one new post in the trailing 7 days. Covers the EBITDA bridge, proof of cash and the working-capital peg, with a worked bridge on an invented $38M-revenue manufacturer and the Delaware Supreme Court's limit on what a post-closing true-up can fix (*Chicago Bridge & Iron v. Westinghouse*). Every source was opened before citing.
- **`/blog/types-of-buyouts` title + meta (rule 3).** 386 impressions at 9.6, 3 clicks — 0.78% against 3.0% expected; never rewritten. Brand suffix dropped for a specific promise; the meta's "who ends up in control" is gone per standing rule 5.
- **`/business-valuation-calculator` title + meta (rule 3).** 105 impressions at 9.3, 0 clicks; last changed 2026-09-17. Its visible queries are "business valuation calculator ebitda" variants, so EBITDA is now in the title. og/twitter aligned.
- **Two links in (rule 8)** from `/blog/how-pe-firms-value-a-company` (26 inbound, already had a QoE section) and `/blog/adjusted-ebitda-add-backs`.

## Considered and skipped

- **`strikingDistance`:** all three live rows are `/blog/family-business-succession-planning`, which already has an H2 answering each query almost verbatim — rule 4's condition is not met. "ibo finance" lands on the homepage, body off limits.
- **`/blog/private-equity-buyout-explained`, `/blog/dividend-recapitalization`:** top queries at positions 47 and 29. Rank, not snippet.
- **The two `keep-control` URLs in `lowCtr`** are 301s to `/blog/alternatives-to-selling-to-private-equity`.
- **Cannibalization** on "types of buyouts" was resolved 10-26 via the `/blog` hero anchor; the homepage wins the brand queries.
- No deal-data flags this run.

## Coverage

35 of 36 indexed. `/industries/restaurants` is still "Discovered – currently not indexed", no crawl recorded, after four rounds of padding — 3,939 words, 10 inbound links. Nothing left to fix on-page.

## For a human

1. **Request indexing for `/industries/restaurants`** — the only remaining lever.
2. **Two standing-rule-5 phrases left in place** pending sign-off on the audit: `/blog/types-of-buyouts` ("a holding company the owner controls … without handing the company to anyone") and `/blog/family-business-succession-planning` ("without the family losing control", on a § 303 redemption).
3. **"private equity accounting firm valuation"** drew 43 impressions at positions 52–66 across two variants with no page targeting it. PE roll-ups of CPA firms may be worth a post.
