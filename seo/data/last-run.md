# Daily SEO run — 2026-10-18

First run since the 16-run stack merged (PR #56), so the job is finally reading a `main` that matches the live site: no duplicate post proposed, no shipped edit re-proposed.

One new post, one title/meta rewrite, four internal links. Audit clean — 34 indexable pages, 0 errors, 0 warnings.

## GSC totals — 28 days (2026-09-18 → 10-15)

| | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 80 | 3,766 | 2.12% | 11.2 |
| Prior 28d | 36 | 1,817 | 1.98% | 17.4 |

## Changes

- **New post: `/blog/dividend-recapitalization`** (2,233 words). The highest-priority uncovered keyword left in `keywords.json`; nothing shipped in the trailing 7 days. Worked on one invented $6M-EBITDA company: an $18M facility at 3.0x, $13.1M distributed, and the covenant arithmetic that leaves **7.7% of EBITDA headroom** before a 3.25x test breaks. Every source opened and quoted directly: GF Data via Middle Market Growth, Dechert and Capstone/PitchBook on 2025 recap volume, 11 U.S.C. § 548(a)(1), IRS Topics 404/409/559. Three inbound links added.
- **Title + meta: `/blog/sell-a-business-but-keep-control`.** `lowCtr`: 141 impressions, 0 clicks at position 7.3 against an expected 3.0%, never rewritten since publication. New copy uses the "sell part of a business" wording its own queries carry.
- **Link on `/blog`.** The index is absorbing queries its children should own — "buyout companies" 32 impressions at 23.5, "types of buyouts" 11 at 48.8 while `/blog/types-of-buyouts` sits at 4.0 on one impression. Added a hero sentence routing both families to the dedicated pages.

## Considered and skipped

- **All six `strikingDistance` rows.** Three sit on `/blog/family-business-succession-planning`, edited 10-13, inside the 14-day cool-down; three sit on the homepage, where body copy is off limits. On those three, `independentbuyout.com` is ours and ranks page one, so zero clicks at position 4 is likely the click landing on our own domain rather than a snippet fault.
- **A second `lowCtr` rewrite.** `minority-recapitalization-explained`, `management-buyout-vs-private-equity` and `selling-to-private-equity-pros-and-cons` are all inside the 28-day title cool-down. The calculator row is driven by brand at position 1.7; its real queries sit at 59-75, which a title cannot fix.
- **`private equity buyout` cannibalization.** Both losing pages already link the winner with that anchor.

## Coverage

`/industries/restaurants` is the only non-PASS URL, back to "Discovered – currently not indexed". Not thin: 2,709 words, correct canonical, 7 inbound links. **Request indexing in Search Console** — third run to reach this.

No deal data, clients, counts or results added; banned-phrasing scan clean; all `jobTitle` values read "Managing Partner".
