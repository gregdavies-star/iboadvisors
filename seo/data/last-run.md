# Daily SEO run — 2026-09-10

17 of 20 sitemap URLs now PASS, up from 2 on 09-05. Today targeted the three that don't, plus the internal-link deficit causing them. No new post (2 already in the trailing 7 days); `lowCtr` and `decliners` were empty.

| 28d to 2026-09-07 | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| Current | 10 | 307 | 3.26% | 11.8 |
| Prior 28d | — | — | — | — |

GSC returned `previous: null` — no prior window yet. `history.jsonl` shows impressions 145 → 253 → 307 across the last three runs.

## Changes (4 content pages — the cap)

- **`how-pe-firms-value-a-company`** — the only URL at *"Crawled – currently not indexed"* (crawled 09-09: quality, not discovery, is the blocker). Added +630 words: a "Step 5" on the enterprise-value-to-cash bridge (cash-free/debt-free, working capital peg, escrow, fees) with a worked $28M hypothetical, two FAQ entries, and two newly opened sources. Title 103→50, meta 163→134. Now 2,316 words.
- **`family-business-succession-planning`** — *"Discovered – not indexed"*, 1,430 words, 0 links out. Added a 450-word section on how a family handover is funded (gift vs. seller note vs. minority recap) with a worked $23M-equity hypothetical, plus 7 links. Title 88→50, meta 189→134, hero alt. Now 1,884 words.
- **`rollover-equity-second-bite-explained`** — 7 inbound, PASS, 0 links out. Added 5 links + calculator; title 93→50, hero alt.
- **`the-broken-owner-exit-conversation`** — 0 links out. Added 6 links + calculator; title 90→52, meta 196→137, hero alt.

`alternatives-to-selling-to-private-equity` gained inbound links 4→8 and succession 3→5, all from PASS pages. Audit: 0 errors, warnings 38→25.

## Flagged (hard rule)

Two pre-existing firm claims removed: `the-broken-owner-exit-conversation` opened with *"sold one for $1.8 billion"* (a transaction size, not a homepage claim), and `how-pe-firms-value-a-company` with *"100+ deals"* (non-verbatim restatement of the homepage line). A grep for the banned patterns found nothing else; the untouched posts still deserve a human read.

## Skipped

Both `strikingDistance` queries rank the **homepage**, whose body copy is off-limits; the page that should own *"what is an ibo"* (`independent-buyout-explained`) is in cool-down until 09-19. `alternatives-to-selling-to-private-equity` is 2 days old at 2,043 words — it needs time, not edits, so it got links instead.

## Needs a human

1. **Apex/www still splits signals.** `iboadvisors.com/` drew 7 clicks / 106 impressions alongside www's 3 / 211 — the sole `cannibalization` entry. The 301 is in `vercel.json`, so either it isn't firing or Google hasn't dropped the old host; please check `curl -I https://iboadvisors.com/` against production.
2. `"shareholder capital" business consultant` — 71 impressions, pos 9, 0 clicks, almost certainly one researcher on a quoted search. It distorts the totals; don't rank-chase it.
3. Still 0 links out, long titles, empty hero alts on `choosing-an-ma-advisory-firm`, `healthcare-services-ma`, `ibo-government-contractors`, `management-buyout-financing`, `restaurant-ma`.
