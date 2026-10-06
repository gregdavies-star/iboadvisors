import { appendFileSync } from "node:fs";

const rows = [
  {
    date: "2026-10-06",
    url: "/blog/selling-to-private-equity-pros-and-cons",
    action: "title",
    reason: "opportunities.lowCtr: 182 impressions, 1 click (0.55%) at position 8.1 against a 3.0% expectation; title/description never rewritten since publication 2026-09-21, so no cool-down.",
    before: "Selling to Private Equity: Pros and Cons | IBO Advisors",
    after: "Selling to Private Equity: 4 Pros, 5 Cons | IBO Advisors",
  },
  {
    date: "2026-10-06",
    url: "/blog/selling-to-private-equity-pros-and-cons",
    action: "meta",
    reason: "Same lowCtr row. New copy leads with the ranking query wording ('pros and cons of selling to private equity') and the 4/5 count the H3s actually deliver.",
    before: "The real advantages and costs of selling to private equity: what the multiple buys you, and what the debt, escrows and seven-year hold take back.",
    after: "The pros and cons of selling to private equity, counted: 4 advantages the multiple and the capital buy, and 5 costs in the debt, the escrow and the hold.",
  },
  {
    date: "2026-10-06",
    url: "/blog/minority-recapitalization-explained",
    action: "title",
    reason: "opportunities.lowCtr: 128 impressions, 0 clicks at position 8.2 against a 3.0% expectation. Title last changed 2026-09-08, exactly 28 days ago, so the cool-down has elapsed.",
    before: "Minority Recapitalization Explained | IBO Advisors",
    after: "Minority Recapitalization: Sell 30%, Keep 70% | IBO Advisors",
  },
  {
    date: "2026-10-06",
    url: "/blog/minority-recapitalization-explained",
    action: "meta",
    reason: "Same lowCtr row; the description had never been rewritten. New copy states the 20-49% range and points at the arithmetic section rather than listing topics.",
    before: "What a minority recapitalization is, how it compares to a full sale or an Independent Buyout, and when partial liquidity makes sense for owners.",
    after: "A minority recapitalization sells 20-49% of your company for cash while you keep the majority and the board. What a 30% slice really pays, after discounts.",
  },
  {
    date: "2026-10-06",
    url: "/blog/family-business-succession-planning",
    action: "expand",
    reason: "Rule 4: two strikingDistance queries on one page - 'liquidity planning for family business succession' (129 impr at 17.6) and 'which advisors are best suited to plan the sale of a family-owned company?' (79 impr at 6.3), neither answered under its own heading. Added 591 words in two H2 sections; last content edit 2026-09-17, outside the 14-day cool-down.",
  },
  {
    date: "2026-10-06",
    url: "/blog/management-buyout-vs-private-equity",
    action: "link",
    reason: "Rule 5: 'private equity buyout' / 'buyout private equity' split between this page (10 impr at 11.4, 11 at 6.9) and /blog/what-happens-after-private-equity-buys-your-company (33 at 20.3, 52 at 26.3). The latter is titled for the query and wins on impressions, so added a link to it with 'private equity buyout' as the anchor. Loser's title/H1 already differentiated on 'management buyout vs'.",
  },
  {
    date: "2026-10-06",
    url: "/blog/majority-recapitalization",
    action: "new-post",
    reason: "Rule 7: 0 new posts in the trailing 7 days. Highest-priority uncovered keywords in keywords.json are cluster 3's 'majority recapitalization' and 'recapitalization vs sale'; GSC already shows impressions on 'majority recapitalization', \"what's the difference between a partial and a full recapitalization?\" and 'what is the difference between selling my company and doing a recap' with no page targeting them. 2,084 words, 10 internal links, sourced to 26 U.S.C. 351/368(c)/721, 78 FR 17766 and GF Data via Capital Pad.",
  },
  {
    date: "2026-10-06",
    url: "/blog/minority-recapitalization-explained",
    action: "link",
    reason: "Rule 8 + first in-body inbound link for the new post, from the cluster-3 hub whose 'what a minority recap is' section already contrasts the other recap structures.",
  },
  {
    date: "2026-10-06",
    url: "/blog/management-buyout-vs-private-equity",
    action: "link",
    reason: "Second in-body inbound link for the new post; its worked 'private equity deal' example (sponsor buys control, owner rolls 20%) is a majority recapitalization by another name.",
  },
  {
    date: "2026-10-06",
    url: "/seo/keywords.json",
    action: "fix",
    reason: "Added 'majority recapitalization' and 'recapitalization vs sale' to cluster 3's covered map now that /blog/majority-recapitalization targets them. 'leveraged recapitalization' left uncovered - the new post defines it but does not target it.",
  },
];

for (const r of rows) appendFileSync("seo/data/changelog.jsonl", JSON.stringify(r) + "\n");
console.log("appended " + rows.length);
