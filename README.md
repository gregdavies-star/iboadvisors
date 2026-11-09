# IBO Advisors — Marketing Site

Static marketing site for IBO Advisors ("A Private Equity outcome without the Private Equity."), migrated from HubSpot to a GitHub / Supabase / Vercel stack.

## Structure

This is a static HTML/CSS site — no build step required. The only server code is the Vercel serverless functions in `api/`, sharing `api/_scheduler.js` (not a route: the leading underscore keeps Vercel from deploying it): `partner-availability.js` and `partner-book.js` back `/partnerschedule` (Michael's personal link, partner as guest); `availability.js` (GET `/api/availability`) and `book.js` (POST `/api/book`) back the public booking page `/book`, offering only :00/:30 starts and routing by EBITDA band (`$10M - $20M` and `$20M+` book Michael's own link, everything else the Michael/Darren round robin). They need `IBO_HUBSPOT_SERVICE_KEY` (HubSpot private app token with `scheduler.meetings.meeting-link.read`) in the Vercel project. Optional: the `crm.objects.contacts.read` scope lets `/api/book` route a known contact on the EBITDA band stored in HubSpot (without it, it routes on the band the page sends); `IBO_BOOK_SLUG_MICHAEL` and `IBO_BOOK_SLUG_TEAM` override the two `/book` scheduling-page slugs (defaults `michael-chasen/ibo-discussion` and `michael-chasen/discussing-the-ibo`), e.g. to point a preview deployment at test pages. `npm run test:scheduler` runs their unit tests (fake HubSpot, no network).

- `index.html` — single-page site (hero, mechanism, track record, team, contact/experts sections)
- `book/` — the on-site booking page `/book` (noindex): our own month-grid picker over `/api/availability` and `/api/book` (:00/:30 starts, routed by EBITDA band to Michael's link or the Michael/Darren round robin), asking inline only for details the hand-off did not carry, then an IBO-styled confirmation with the booked host, the optional pre-call note, and a post of the meeting attribution to HubSpot
- `partnerschedule/` — orphan page for referral partners to book a client onto Michael's calendar (see CLAUDE.md)
- `style.css`, `base.css` — styling
- `assets/` — images (hero art, founder portrait, industry icons)

This is the **dusk** hero variant. A **misty** hero variant exists as an alternate preview and can be added as a branch/second deploy if needed.

## Deploying on Vercel

No build command or output directory is needed — Vercel will serve the static files directly (`vercel.json` sets clean URLs). Import this repo into a new Vercel project and it will deploy as-is.

## SEO tooling

No dependencies - Node 18+ only. Strategy and the daily job's rules live in `seo/`.

```
npm run seo:sitemap     # regenerate sitemap.xml with real <lastmod> from the pages on disk
npm run seo:jsonld      # insert/refresh JSON-LD structured data on every indexable page
npm run seo:audit       # on-page audit (titles, descriptions, canonicals, links, word counts)
npm run seo:check       # CI form of the above - fails if derived files are stale or the audit has errors
npm run seo:new-post -- --slug <slug> --title "..." --description "..." --image <asset>   # scaffold a post
npm run gsc:submit      # (re)submit the sitemap to Search Console   (needs GSC_ACCESS_TOKEN or GSC_SERVICE_ACCOUNT_JSON)
npm run gsc:pull        # trailing 28d vs prior 28d -> seo/data/gsc-latest.json
npm run gsc:inspect     # URL Inspection for every sitemap URL -> seo/data/gsc-coverage.json
npm run ahrefs:pull     # Ahrefs metrics/keywords/backlinks -> seo/data/ahrefs-latest.json (needs AHREFS_API_KEY)
```

`.github/workflows/seo-daily.yml` runs the pulls, then Claude Code (per `seo/DAILY_PROMPT.md`), and opens a PR for review. `.github/workflows/seo-on-merge.yml` re-submits the sitemap after a merge deploys. After adding or editing any page by hand, run `npm run seo:jsonld && npm run seo:sitemap` before committing.

## Supabase

An active Supabase project (`gregdavies-star's Project`, org `IBOAdvisors`) is provisioned and ready to back future dynamic features (contact form submissions, CRM sync, blog content, etc.). No frontend code currently calls Supabase — this site is fully static today. Wire up `NEXT_PUBLIC_SUPABASE_URL` / anon key (or plain fetch calls) when a form or dynamic feature is added.
