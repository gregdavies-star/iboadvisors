# IBO Advisors — SEO strategy

Owner-facing summary. The daily job (`.github/workflows/seo-daily.yml`, rules in `DAILY_PROMPT.md`) executes the tactical layer; this document is the why and the roadmap.

## 1. Positioning

IBO Advisors is creating a category: the **Independent Buyout** - private-equity-level liquidity and valuation for a $3M+ EBITDA owner, without selling to private equity. Search demand for "independent buyout" is near zero today, so the strategy has two tracks that run in parallel:

1. **Own the category term.** Every page should define and link to the IBO so that when the term takes off (LinkedIn, podcasts, referrals), we are the definitive result. Cheap, no competition, compounding.
2. **Intercept the adjacent demand.** Owners never search "independent buyout"; they search *"how to sell my business to private equity"*, *"minority recapitalization"*, *"EBITDA multiples by industry"*, *"what happens after PE buys your company"*. That demand is real, high-intent, and dominated by PE firms, brokers, and generic finance sites - most of it written by marketers, not deal people. Our edge is depth, specificity (real capital-structure math), and a point of view the incumbents cannot copy (we are not selling to PE).

Voice: plain, direct, numbers-first, written by someone who has been in the room. No hype. Every post ends by connecting the topic to the IBO and inviting a conversation.

## 2. Site architecture (where we are → where to go)

Today: a homepage, a calculator, a flat blog of 15 posts, and two `noindex` pages (`/approach`, `/track-record`).

Recommended structure (pillar → cluster), built incrementally:

| Pillar page (new, static) | Cluster posts it links to and is linked from |
|---|---|
| `/independent-buyout` - the definitive "What is an Independent Buyout" page (2,500+ words, FAQ schema, comparison table vs PE / MBO / ESOP / strategic sale) | IBO vs PE numbers, how PE finances a buyout, rollover equity, minority stake control, broken exit conversation |
| `/exit-options` - every way to take money off the table, with a decision framework | exit planning, every option, succession planning, MBO financing, minority recap |
| `/business-valuation-calculator` (exists) + `/ebitda-multiples-by-industry` (new) | how PE values a company, industry M&A posts, adjusted EBITDA, QoE |
| `/industries/<x>` (start with the three we have posts for) | restaurant, healthcare services, government contractors → then HVAC, dental/DSO, IT services, manufacturing, construction, logistics |

Also: **index `/track-record`** (it is the strongest E-E-A-T asset on the site and is currently `noindex, nofollow` - decide whether that was deliberate), and add an **author page** for Michael Chasen (bio, credentials, deal history, LinkedIn) that every post's byline links to. Google's reviewer guidelines weight "who wrote this" heavily for financial topics (YMYL).

## 3. Content engine

**Cadence:** 2 new posts/week for the first 90 days (the daily job caps itself at 2 per trailing 7 days), then 1/week plus refreshes. Quality over volume - a 1,500-word post with real numbers and sources outranks three thin ones and is what earns links.

**Priority order** is in `keywords.json`: category → exit options → deal structures → valuation → PE-control/objection content → succession → industries → advisor selection. Refresh the volume/KD columns from Ahrefs Keywords Explorer and re-rank quarterly.

**Programmatic opportunity:** the calculator already encodes EBITDA multiples by industry. Publish that data as `/ebitda-multiples/<industry>` pages (20-40 pages, each with a real paragraph of commentary, a range table, and a calculator CTA). "[industry] EBITDA multiple" queries are numerous, specific, and mostly answered badly today.

**Refresh rules (the daily job):** 28-day window; title/meta rewrites when CTR is <60% of the expected CTR for the position and ≥100 impressions; content expansion for queries at positions 4-20; cannibalization resolved by consolidation and internal links, never by deletion. Cool-downs: 28 days per title/meta, 14 days per content edit.

## 4. Technical foundation

Done in this change set:
- `sitemap.xml` regenerated from disk with real `<lastmod>` (Google ignores `changefreq`/`priority`; `lastmod` is what triggers recrawls) - `scripts/build-sitemap.mjs`.
- `Organization` / `Person` / `WebSite` / `BlogPosting` / `BreadcrumbList` / `Blog` JSON-LD on every indexable page - `scripts/ensure-jsonld.mjs`.
- Apex `iboadvisors.com` → `www` 301 (both hosts were serving 200, splitting signals) - `vercel.json`.
- `/meet` (linked from every post, was a 404) now redirects to the HubSpot scheduling page.
- Audit that fails on missing canonical / multiple H1 / orphan pages - `scripts/seo-audit.mjs`.

Still to do (needs your accounts):
- **GA4** property + tag (the site only has the Google Ads tag `AW-18411360561`). Link GA4 ↔ Search Console ↔ Ads.
- **Search Console** verification (see the checklist you were given) and the service account for the API.
- **Bing Webmaster Tools** - import the site from Search Console (one click). Bing powers ChatGPT search and Copilot answers; it is free traffic nobody competes for.
- Core Web Vitals check in PageSpeed Insights after the JSON-LD lands (expect green - the site is static and already ships WebP).

## 5. Authority (links and mentions)

Content alone will not beat PE firms with DR 60+ domains. Link plan, in order of ROI:

1. **Digital PR around the calculator and original data.** "Lower-middle-market EBITDA multiples 2026" as a downloadable report with a chart → pitch to Axial, Divestopedia, Middle Market Growth (ACG), Exit Planning Institute, Business Brokerage Press, and the CPA/wealth-advisor trade press.
2. **Expert-quote platforms:** Qwoted, Featured (ex-Terkel), Help a B2B Writer, and HARO successors. Michael answers 3-5 M&A/exit questions a week; each hit is a DR 40-80 link.
3. **Podcast guesting** (exit planning, family business, CPA practice-growth shows). Every episode page links back. Repurpose into posts.
4. **Referral-partner content:** co-written guides with CPAs, wealth advisors, and M&A attorneys who serve $3M+ EBITDA owners. They get content; we get links from trusted domains and warm referrals.
5. **Directories that matter:** Axial, Crunchbase, Clutch (M&A), local Chambers, Exit Planning Institute member directory, ACG chapter.
6. **LinkedIn distribution** (already the source of the posts): each post goes out as a native LinkedIn article that links to the canonical on the site.

Use Ahrefs weekly: Site Explorer → Content Gap against 5 competitors (e.g. Axial, Generational Equity, Benchmark International, Raincatcher, a regional PE-advisory firm); Link Intersect for domains linking to 2+ of them and not us; Alerts for new backlinks and brand mentions (unlinked mentions → ask for the link).

## 6. Measurement and cadence

| Window | Used for |
|---|---|
| Daily (28d vs prior 28d, 3-day lag) | The job's decisions: CTR rewrites, expansions, cannibalization, new posts |
| Weekly (human, 15 min) | Review the daily PRs; scan Ahrefs Rank Tracker for the `keywords.json` list; approve/deny recommendations |
| Monthly | GSC 3-month vs prior 3-month by page; Ahrefs Site Audit; refresh `keywords.json` volumes; prune/merge underperformers |
| Quarterly | Re-rank clusters, decide the next pillar/programmatic build, review link-building pipeline |

KPIs (in order): qualified leads from organic (modal submissions with EBITDA ≥$3M - tag the source), calculator completions from organic, clicks on money pages, then impressions/queries on target clusters, then indexed pages and referring domains. Expect 3-6 months before organic clicks move meaningfully on a new domain authority profile; the first 60 days are about getting everything indexed and the pillars live.

## 7. Tool stack

- **Google Search Console** (required) - source of truth; API feeds the daily job.
- **GA4** (required) - conversions; link to GSC.
- **Ahrefs** (have) - Keywords Explorer, Content Gap, Site Audit, Rank Tracker, Alerts; API feeds the job if the plan includes API units.
- **Bing Webmaster Tools** (free) - second index, AI search surfaces.
- **PageSpeed Insights / Rich Results Test** (free) - CWV and schema validation.
- Optional later: Screaming Frog (bulk crawl), a rank-tracking add-on for local/regional terms, Qwoted/Featured subscriptions for expert quotes.
