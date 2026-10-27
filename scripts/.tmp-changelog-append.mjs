import { appendFileSync } from 'node:fs';

const rows = [
  {
    date: '2026-10-27',
    url: '/blog',
    action: 'link',
    reason:
      'Rule 2: /industries/restaurants is still the only non-PASS sitemap URL (NEUTRAL, "Discovered - currently not indexed") after four expansions since 09-25. The page is not thin and is differentiated from /blog/restaurant-ma, so the untried lever is a link from a frequently-crawled page: /blog is the joint-most-linked URL on the site (35 in-links) and carried zero links to /industries. The hero intro now points at all three industry pages.',
  },
  {
    date: '2026-10-27',
    url: '/blog/alternatives-to-selling-to-private-equity',
    action: 'link',
    reason:
      'Rule 8: /industries/healthcare-services held 5 inbound in-body links, second-lowest on the site. This donor (19 in-links) already named the 5.0x-8.5x healthcare band as plain text next to a linked restaurant band; the anchor now matches the page that publishes it.',
  },
  {
    date: '2026-10-27',
    url: '/blog/business-exit-planning-every-option',
    action: 'link',
    reason:
      'Rule 8: /industries/government-contractors had 4 inbound in-body links, the lowest of any indexable page. The donor sector paragraph priced only the restaurant band though it names all three sectors; it now carries the 4.5x-7.5x GovCon band and the set-aside recertification point behind it.',
  },
  {
    date: '2026-10-27',
    url: '/blog/minority-pe-stake-board-control-veto-rights',
    action: 'link',
    reason:
      'Rule 8: /blog/dividend-recapitalization had 5 inbound in-body links. The donor (21 in-links, second-strongest post) already listed a dividend recapitalization unlinked among the four no-outside-equity structures - the one that trades a consent list for a covenant package, which is this page own subject.',
  },
];

appendFileSync(
  new URL('../seo/data/changelog.jsonl', import.meta.url),
  rows.map((r) => JSON.stringify(r)).join('\n') + '\n'
);
console.log('appended', rows.length);
