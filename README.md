# IBO Advisors — Marketing Site

Static marketing site for IBO Advisors ("A Private Equity outcome without the Private Equity."), migrated from HubSpot to a GitHub / Supabase / Vercel stack.

## Structure

This is a static HTML/CSS site — no build step required.

- `index.html` — single-page site (hero, mechanism, track record, team, contact/experts sections)
- `style.css`, `base.css` — styling
- `assets/` — images (hero art, founder portrait, industry icons)

This is the **dusk** hero variant. A **misty** hero variant exists as an alternate preview and can be added as a branch/second deploy if needed.

## Deploying on Vercel

No build command or output directory is needed — Vercel will serve the static files directly (`vercel.json` sets clean URLs). Import this repo into a new Vercel project and it will deploy as-is.

## Supabase

An active Supabase project (`gregdavies-star's Project`, org `IBOAdvisors`) is provisioned and ready to back future dynamic features (contact form submissions, CRM sync, blog content, etc.). No frontend code currently calls Supabase — this site is fully static today. Wire up `NEXT_PUBLIC_SUPABASE_URL` / anon key (or plain fetch calls) when a form or dynamic feature is added.
