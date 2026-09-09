# Daily SEO run - 2026-09-08

The 09-05 linking pass worked: all four posts it touched are now **"Submitted and indexed"**, as is the calculator. Today repeats it on the next three uncrawled posts, with real content added rather than just links.

## GSC totals (28d: 2026-08-09 to 2026-09-05)

| Metric | Current | Prior 28d |
|---|---|---|
| Clicks | 9 | no data |
| Impressions | 253 | no data |
| CTR | 3.56% | no data |
| Position | 9.8 | no data |

Prior-window data is still null, so rule 6 (decliners) had nothing to act on.

## Changes (4 content pages - the cap - plus the new post)

- **`/` title + meta** - the only `lowCtr` entry: 157 impressions, 1.27% CTR against a 3.0% expectation at position 9.4. The title now leads with the category term (53 chars) and the description opens with "What is an IBO?", the striking-distance query at position 9.7. Body copy untouched.
- **Three not-indexed posts strengthened** (rule 2, not just resubmitted): `minority-recapitalization-explained` 1,221 → 1,646 words, `minority-pe-stake-board-control-veto-rights` 1,204 → 1,656, `how-private-equity-actually-finances-a-buyout` 1,247 → 1,688. Each gained a 425-450 word section built on real arithmetic - a worked 30% recap, the negotiable levers in a consent list, a $42M LBO stack - plus 5 contextual links, alt text, and a title cut from 91-122 chars to 50-59.
- **New post `/blog/alternatives-to-selling-to-private-equity`** - 2,043 words, 14 internal links, 4 inbound, covering three uncovered priority-1 keywords. Every number is a labelled hypothetical or a source opened this run (SBA, NCEO, Cornell §1042, Citi Wealth, Stanford GSB, GF Data). No firm or deal claims.
- **`/blog` title** lengthened (was 23 chars, no keyword); it is also not indexed.
- **`scripts/ensure-jsonld.mjs`** - bumping a post's `Updated` line also reset its `datePublished`, so refreshed posts claimed today as their publication date. Now preserved; the three posts are back to 2026-02-25, 08-15, 08-24.

Audit: 0 errors, warnings 52 → 38.

## Skipped

- **Striking distance**: both queries land on `/`, whose body copy is off-limits. `what is an ibo` is now served by the 09-05 post and today's meta.
- **Cannibalization**: still only apex vs `www.` - host duplication, no on-page fix.
- 8 posts still have 0 contextual links - two more runs at 4/day.

## Needs a human

1. **Confirm the apex → www 301 is live.** It is in `vercel.json`, but GSC still splits impressions (106 vs 157).
2. **Request indexing** for the three refreshed posts and `/blog`.
3. Is `"shareholder capital" business consultant` (65 impressions, our largest non-brand query) a real audience or one persistent searcher?
4. **Build the `/independent-buyout` pillar** - the cluster has three posts and no hub.
