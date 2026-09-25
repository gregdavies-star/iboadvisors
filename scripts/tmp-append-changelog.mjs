import fs from 'node:fs';

const entries = [
  {
    date: '2026-09-25',
    url: '/blog/minority-pe-stake-board-control-veto-rights',
    action: 'link',
    reason: "Rule 8: /blog/restaurant-ma (51 impr at 7.2, best-performing industry post) and /blog/healthcare-services-ma (19 impr at 16.1) were both at the site floor of 5 in-body inbound links. Donor is 15 in / 7 out with 175 impressions, and its capital-expenditure consent hypothetical is the same mechanic both targets describe. One new paragraph carries both links and restates only what each target already sources - the restaurant roll-up playbook and the healthcare MSO structure. +101 words, no Updated bump.",
  },
  {
    date: '2026-09-25',
    url: '/blog/independent-buyout-explained',
    action: 'link',
    reason: "Rule 8: /blog/ibo-government-contractors and /blog/selling-to-private-equity-pros-and-cons were both at the site floor of 5 in-body inbound links. Donor is the site's strongest indexed post (188 impressions at position 5.6, 14 in / 9 out) and linked neither. The GovCon link follows the leverage paragraph (FAR 31.205-6(q) and CAS 415 against 31.205-20, all sourced on the target); the pros-and-cons link sits in \"Where an IBO doesn't fit\" beside the strategic-premium sentence. +125 words, no Updated bump.",
  },
  {
    date: '2026-09-25',
    url: '/blog/how-pe-firms-value-a-company',
    action: 'link',
    reason: 'Rule 8: /blog/management-buyout-vs-private-equity was at the floor of 5 in-body inbound and drew zero GSC impressions in the window despite being indexed (PASS) since 09-19. Donor is 15 in / 9 out and its closing paragraph already names a management buyout as pricing off the same normalized EBITDA; the link adds the 4x-6x versus 6.4x-8.3x spread the target sources. +46 words, no Updated bump.',
  },
  {
    date: '2026-09-25',
    url: '/blog/how-private-equity-actually-finances-a-buyout',
    action: 'link',
    reason: 'Rule 8: /blog/management-buyout-financing holds 73 impressions at position 23.6 - the highest-impression blog page no rule can fire on, since position >20 excludes it from strikingDistance - and had 7 in-body inbound links. Donor carries the most internal authority on the blog (16 in / 10 out) and did not link it; placed in the paragraph contrasting which structures put leverage on the company. +56 words, no Updated bump.',
  },
];

fs.appendFileSync(
  'seo/data/changelog.jsonl',
  entries.map((e) => JSON.stringify(e)).join('\n') + '\n'
);

const lines = fs.readFileSync('seo/data/changelog.jsonl', 'utf8').trim().split('\n');
lines.forEach((l, i) => {
  try {
    JSON.parse(l);
  } catch {
    throw new Error('bad JSON on line ' + (i + 1));
  }
});
console.log('changelog.jsonl: ' + lines.length + ' lines, all parse OK');
