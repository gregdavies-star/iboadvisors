import fs from 'node:fs';

const rows = [
  {
    date: '2026-10-21',
    url: '/industries/restaurants',
    action: 'expand',
    reason:
      'URL Inspection verdict NEUTRAL, "Discovered - currently not indexed", 0 impressions in the 28-day window while both sibling industry pages are indexed (govcon 43 imp / pos 4.2, healthcare 37 imp / pos 11.3). The page already carries 7 inbound internal links, so the gap is perceived value, not discovery. Added a ~560-word h2 on the three four-wall ratios a buyer tests before accepting restaurant EBITDA - prime cost, occupancy cost as a share of sales, and the gap between restaurant-level margin and company EBITDA - plus a matching FAQ entry and FAQPage JSON-LD question. Every figure verified by WebFetch against the Texas Roadhouse FY2025 Form 10-K already cited on the page: food and beverage 35.0% of restaurant and other sales in FY2025 against 33.4% in FY2024, labor 33.3% against 33.1%, rent 1.6%, restaurant margin 15.5% against 17.1%. The 40M-dollar-sales illustration is explicitly arithmetic on a made-up group. Reviewed date moved September to October 2026 on ~670 added words.',
  },
  {
    date: '2026-10-21',
    url: '/blog/what-happens-after-private-equity-buys-your-company',
    action: 'title',
    reason:
      'Cannibalization: three pages competed on "buyout private equity" (47 imp) and "private equity buyout" (34 imp), and this page led its title with the exact head term /blog/private-equity-buyout-explained targets. It sits at 26.1 and 20.7 on those two queries while ranking 3.8 on its own query, "what happens when a private equity firm buys your company". Retitled to lead with its own intent and hand the head term to the explainer. Last title change was 2026-09-20, outside the 28-day cool-down.',
    before: 'Private Equity Buyout: What Happens Years 1-7 | IBO Advisors',
    after: 'What Happens After Private Equity Buys Your Company',
  },
  {
    date: '2026-10-21',
    url: '/blog/alternatives-to-selling-to-private-equity',
    action: 'link',
    reason:
      'Cannibalization follow-through: the designated winner for "private equity buyout" (/blog/private-equity-buyout-explained) had only 5 inbound internal links and sits at 47.7 and 11.4 on the two head queries. Added a contextual link from the site\'s most-linked post (19 inbound) using the query as anchor text.',
  },
  {
    date: '2026-10-21',
    url: '/blog/selling-to-private-equity-pros-and-cons',
    action: 'link',
    reason:
      'Same cannibalization follow-through: a second contextual link into /blog/private-equity-buyout-explained, from a page with 267 impressions at position 8.6 in the same query family.',
  },
];

fs.appendFileSync('seo/data/changelog.jsonl', rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
console.log('appended', rows.length);
