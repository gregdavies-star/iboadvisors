# Short.io LinkedIn Link Tracking

Reference for working with IBO Advisors' Short.io account from a Claude session.
Last verified: 2026-09-14.

## Access

- **Connector:** Short.io MCP connector, installed at the claude.ai org level.
  Enable it in the chat's connector settings. If calls fail with
  "session expired", the in-chat toggle will not fix it. Disconnect and
  reconnect Short.io under claude.ai Settings > Connectors.
- **Account owner:** Cyrus Roepers (cyrus@iboadvisors.com).
- **Rate limit:** roughly 30 requests per minute across all endpoints.
  A burst of 30+ calls returns 429 and can kill the MCP session. Batch
  writes and per-link stat pulls in groups of 6 to 9 with a pause between.
- **Fallback:** Short.io REST API at `https://api.short.io` is reachable
  from the remote environment. It needs an API key. If a `SHORTIO_API_KEY`
  environment variable is present, use it directly with curl to avoid the
  connector's rate limit.
- **Windsor.ai** also has a `shortio` source, not yet connected. Useful only
  if link clicks need to be joined against LinkedIn Ads spend.

## Domain

| Field | Value |
|---|---|
| Hostname | `ibomeet.com` |
| Domain ID | `1991783` |
| Created | 2026-09-13 |
| Link count | 33 |

## What every link does

Every link redirects to the homepage with `?learn-more=1`, which auto-opens
the Learn More qualify modal (the gate in front of the HubSpot meeting
scheduler). UTM parameters ride along to GA4, the HubSpot form submission,
and the scheduler redirect. See `modal.js` around line 151 for the
auto-open logic.

Base destination:
`https://www.iboadvisors.com/?learn-more=1&utm_source=linkedin&...`

## Naming scheme

Path pattern: `info-<industry letter><article number>[a]`

| Letter | Industry |
|---|---|
| `m` | Manufacturing |
| `h` | Healthcare |
| `s` | Services |
| `c` | Construction |
| `a` | General catch-all (no specific industry) |

- Article numbers 1 to 4 per industry. Each number is a distinct LinkedIn
  article. Article titles are not stored in Short.io; the author's LinkedIn
  profile (linkedin.com/in/chasen) blocks automated access, so the mapping
  from number to title must come from the user.
- **No suffix** = organic post. UTMs: `utm_medium=social-media`,
  `utm_campaign=thought_leadership`.
- **`a` suffix** = paid LinkedIn ad variant. UTMs: `utm_medium=paid`,
  `utm_campaign=lead_gen`.
- `utm_content` always equals the path, so it can be used to match clicks
  to links in GA4 or HubSpot.

Two links fall outside the pattern:

- `/michael-li` is a byline link, `utm_campaign=byline`,
  `utm_medium=organic-social`.
- `/info` is the general in-form CTA, `utm_content=general_in-form`, paid.

## Titles and tags

On 2026-09-14 every link was given a title and tags so reports group
automatically. Title format: `<Industry> - Article <n> (<organic|paid>)`.
Tags: `[<industry>, <organic|paid>]`, plus `in-form` on `/info` and
`byline` on `/michael-li`.

## Full link inventory

| Path | Link ID | Industry | Article | Type |
|---|---|---|---|---|
| info-m1 | link_8m9x_034OGKgEuHZxqY6SU7s8Aw | Manufacturing | 1 | organic |
| info-m2 | link_8m9x_034OGKgGxEwUZmnk4U7SBT | Manufacturing | 2 | organic |
| info-m3 | link_8m9x_034OGKgH3DzTHjw8WrFU2l | Manufacturing | 3 | organic |
| info-m4 | link_8m9x_034OGKgH9Q2wtgVYQxEsaY | Manufacturing | 4 | organic |
| info-m1a | link_8m9x_034OGOR8vfbvAkJMIhCzvg | Manufacturing | 1 | paid |
| info-m2a | link_8m9x_034OGORCL9w9qqEMoQ6Qpy | Manufacturing | 2 | paid |
| info-h1 | link_8m9x_034OGKgGf3mZiscJNUVO2Y | Healthcare | 1 | organic |
| info-h2 | link_8m9x_034OGKgHXSfTy6ObpK7mvr | Healthcare | 2 | organic |
| info-h3 | link_8m9x_034OGKgHRR9IpUiFvn9r51 | Healthcare | 3 | organic |
| info-h4 | link_8m9x_034OGKgHvjEBUpZQvfjMmQ | Healthcare | 4 | organic |
| info-h1a | link_8m9x_034OGORC97SAxWFTXzn8S3 | Healthcare | 1 | paid |
| info-h2a | link_8m9x_034OGORCvKQ6IEd50OtYsX | Healthcare | 2 | paid |
| info-s1 | link_8m9x_034OGKgE1zMpF2NtwsYzyV | Services | 1 | organic |
| info-s2 | link_8m9x_034OGKgFUh6zGGivq8NbK2 | Services | 2 | organic |
| info-s3 | link_8m9x_034OGKgEK6GxlEcWZsBL1N | Services | 3 | organic |
| info-s4 | link_8m9x_034OGKgFaaILagFF42Waft | Services | 4 | organic |
| info-s1a | link_8m9x_034OGOR9Voc4UOzQzXwxUV | Services | 1 | paid |
| info-s2a | link_8m9x_034OGOR97jhQK04vQvd8ph | Services | 2 | paid |
| info-c1 | link_8m9x_034OGKgBsxaSAz1MXCdvwA | Construction | 1 | organic |
| info-c2 | link_8m9x_034OGKgEDztrJIhFJd9mJ6 | Construction | 2 | organic |
| info-c3 | link_8m9x_034OGKgDppPuBYqfOTv1Di | Construction | 3 | organic |
| info-c4 | link_8m9x_034OGKgFIaONKiO4W6T1jQ | Construction | 4 | organic |
| info-c1a | link_8m9x_034OGOR8jbC72gJCpMEdki | Construction | 1 | paid |
| info-c2a | link_8m9x_034OGOR9Jks9Zl92ecd7mL | Construction | 2 | paid |
| info-a1 | link_8m9x_034OGKgC51vBm3Lrdwq2Rf | General | 1 | organic |
| info-a2 | link_8m9x_034OGKgB0Z4ftw1wPtdxVt | General | 2 | organic |
| info-a3 | link_8m9x_034OGKgBClK2Jl1wsgyGZH | General | 3 | organic |
| info-a4 | link_8m9x_034OGKgBz39DICmuavj2aQ | General | 4 | organic |
| info-a1a | link_8m9x_034OGORDJg2BIwuSosXYYM | General | 1 | paid |
| info-a2a | link_8m9x_034OGORDVbloJNuCMQRIkj | General | 2 | paid |
| info-a3a | link_8m9x_034OS31Ppk6z2TQuCT33zL | General | 3 | paid |
| michael-li | link_8m9x_034OGQZLFXIgRvwzJYiEwl | Byline | - | organic |
| info | link_8m9x_034OFjYQH3xmhhdU4swnmb | General in-form CTA | - | paid |

Short URLs are `https://ibomeet.com/<path>`.

## Pulling click data

**Cheapest full picture (1 call):** `top-column-statistics` on the domain
with `column=path`, `period=total`, `limit=50`. Returns total clicks per
path. Filter out `/*` and `/` (see bot caveat below).

**Per-link with human/bot split:** `link-statistics` with `period=total`
and `skipTops=true`. One call per link. Returns `totalClicks` and
`humanClicks`. Batch in groups of 6 to 9 to stay under the rate limit.

**Domain rollup:** `domain-statistics` with `period=total`. Gives totals,
referrer, country, browser, and UTM breakdowns. Headline numbers are
polluted by bot traffic.

**Known broken:** passing `include: {human: "1"}` to `top-column-statistics`
returns 400. The `path_404` column also returns 400 on this domain.

## Bot traffic caveat

The domain headline count is dominated by scanner traffic. As of
2026-09-14 the domain showed about 1,547 total clicks, but roughly 950 hit
the wildcard path `/*` and 94 hit the bare root `/`. Nearly all of that is
from a Seoul data center and US cloud IPs, not people. Only about 52 clicks
were on actual article links. Always report per-path numbers and drop
`/*` and `/`.

## Click snapshot, 2026-09-14 (first 21 hours)

| Group | Clicks | Detail |
|---|---|---|
| General catch-all | 32 | a4 = 15, a3 = 13, a1 = 2, a2 = 2 |
| Byline (michael-li) | 10 | |
| Construction | 5 | c4 only |
| Healthcare | 3 | h4 only |
| Services | 2 | s1 only |
| Manufacturing | 0 | |
| All paid `a` variants | 0 | |
| In-form CTA (`/info`) | 0 | |

Human share on sampled links: a4 14/17, a3 12/15, michael-li 9/9.

Observations at that time:

- Article 4 was the top or only performer in every industry with clicks.
- Paid variants had zero clicks. Either the lead-gen campaign had not
  launched or the ads were pointing elsewhere.
- Referrers confirmed LinkedIn (web, Android app, and `lnkd.in` wrapper).

## Related

- `modal.js` handles the `learn-more` query param and the GA4
  `learn_more_autoopen` event.
- Windsor.ai is connected to the IBO Advisors LinkedIn Ads account
  (id 520373404) and Meta Ads account (id 853631823929860) for spend data.
