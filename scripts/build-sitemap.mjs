#!/usr/bin/env node
// Regenerates sitemap.xml from the pages on disk.
//
// - Every index.html becomes a URL unless it carries <meta name="robots" content="noindex">.
// - <lastmod> is the date Google actually uses (changefreq/priority are ignored by Google, so
//   they are omitted). For blog posts it is the "Updated <date>" shown on the page; for
//   everything else it is the last git commit that touched the file.
//
// Usage: node scripts/build-sitemap.mjs [--check]   (--check exits 1 if sitemap.xml is stale)
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, listPages, isBlogPost, isNoindex, postDate, gitLastMod, escapeXml } from "./lib/site.mjs";

const pages = listPages().filter((p) => !isNoindex(p));
const today = new Date().toISOString().slice(0, 10);

const entries = pages.map((p) => {
  const lastmod = (isBlogPost(p) && postDate(p.html)) || gitLastMod(p.file) || today;
  return { loc: p.url, lastmod };
});

// Home first, then hub pages, then posts newest-first.
entries.sort((a, b) => {
  const rank = (e) => (e.loc.endsWith(".com/") ? 0 : e.loc.includes("/blog/") ? 2 : 1);
  return rank(a) - rank(b) || b.lastmod.localeCompare(a.lastmod) || a.loc.localeCompare(b.loc);
});

const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  entries.map((e) => `  <url>\n    <loc>${escapeXml(e.loc)}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n  </url>`).join("\n") +
  `\n</urlset>\n`;

const out = join(ROOT, "sitemap.xml");
if (process.argv.includes("--check")) {
  const current = readFileSync(out, "utf8");
  if (current !== xml) {
    console.error("sitemap.xml is out of date - run `node scripts/build-sitemap.mjs`");
    process.exit(1);
  }
  console.log(`sitemap.xml up to date (${entries.length} URLs)`);
} else {
  writeFileSync(out, xml);
  console.log(`Wrote sitemap.xml with ${entries.length} URLs`);
}
