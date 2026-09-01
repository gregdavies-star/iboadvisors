#!/usr/bin/env node
// On-page SEO audit for every indexable page. Prints a table and writes seo/data/audit.json for
// the daily job to read. Exit code 1 on any ERROR so it can gate a PR.
//
// Usage: node scripts/seo-audit.mjs [--json]
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  ROOT, ORIGIN, listPages, isBlogPost, isNoindex, title, meta, property, canonical, h1s, h2s, wordCount, postDate, bodyText,
} from "./lib/site.mjs";

const pages = listPages();
const indexable = pages.filter((p) => !isNoindex(p));
const indexableUrls = new Set(indexable.map((p) => p.url));
const results = [];

for (const p of indexable) {
  const issues = [];
  const warn = (m) => issues.push({ level: "WARN", message: m });
  const err = (m) => issues.push({ level: "ERROR", message: m });
  const html = p.html;

  const t = title(html);
  if (!t) err("missing <title>");
  else if (t.length > 60) warn(`title ${t.length} chars (aim 50-60; Google truncates ~60)`);
  else if (t.length < 30) warn(`title ${t.length} chars (short - add the primary keyword)`);

  const d = meta(html, "description");
  if (!d) err("missing meta description");
  else if (d.length > 160) warn(`meta description ${d.length} chars (aim 120-155)`);
  else if (d.length < 70) warn(`meta description ${d.length} chars (short)`);

  const c = canonical(html);
  if (!c) err("missing canonical");
  else if (c !== p.url) err(`canonical ${c} != ${p.url}`);

  const h = h1s(html);
  if (h.length !== 1) err(`${h.length} <h1> tags (need exactly 1)`);
  if (!/application\/ld\+json/.test(html)) err("no JSON-LD structured data (run scripts/ensure-jsonld.mjs)");
  if (!property(html, "og:image")) warn("no og:image");

  // Internal linking: every page should link to and be linked from other indexable pages.
  const outLinks = new Set(
    [...html.matchAll(/href="(\/[^"#?]*)"/g)].map((m) => ORIGIN + m[1].replace(/\/$/, "") || ORIGIN + "/")
      .filter((u) => indexableUrls.has(u) && u !== p.url),
  );
  const inLinks = indexable.filter((q) => q.url !== p.url && q.html.includes(`href="${p.urlPath}"`)).length;
  if (inLinks === 0) err("orphan page - no internal links point here");

  if (isBlogPost(p)) {
    const wc = wordCount(html);
    if (wc < 900) warn(`${wc} words (thin for a money-keyword post; aim 1,200-2,000)`);
    if (h2s(html).length < 3) warn("fewer than 3 <h2> sections");
    if (!postDate(html)) err("no 'Updated <Month D, YYYY>' date in .post__meta");
    const contextual = [...outLinks].filter((u) => u.includes("/blog/") ).length;
    if (contextual < 2) warn(`only ${contextual} contextual link(s) to other posts (aim 3+)`);
    const media = html.match(/<div class="post__media">[\s\S]*?<\/div>/)?.[0] || "";
    if (!/<img[^>]*alt="[^"]+"/.test(media)) warn("hero image has empty alt text");
    const text = bodyText(html);
    if (!/\b(IBO|Independent Buyout)\b/.test(text)) warn("post never mentions the Independent Buyout - missed conversion tie-in");
  }

  results.push({
    url: p.url,
    title: t,
    titleLength: t?.length ?? 0,
    description: d,
    descriptionLength: d?.length ?? 0,
    h1: h[0] ?? null,
    words: isBlogPost(p) ? wordCount(html) : null,
    date: isBlogPost(p) ? postDate(html) : null,
    inboundInternalLinks: inLinks,
    outboundInternalLinks: outLinks.size,
    issues,
  });
}

const noindexed = pages.filter(isNoindex).map((p) => p.urlPath);
const errors = results.flatMap((r) => r.issues.filter((i) => i.level === "ERROR").map((i) => `${r.url}: ${i.message}`));
const warnings = results.reduce((n, r) => n + r.issues.filter((i) => i.level === "WARN").length, 0);

const report = { generatedAt: new Date().toISOString(), pages: results, noindexed, errorCount: errors.length, warningCount: warnings };
mkdirSync(join(ROOT, "seo", "data"), { recursive: true });
writeFileSync(join(ROOT, "seo", "data", "audit.json"), JSON.stringify(report, null, 2) + "\n");

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(report, null, 2));
} else {
  for (const r of results) {
    console.log(`\n${r.url}\n  title(${r.titleLength}) ${r.title}\n  desc(${r.descriptionLength})${r.words ? `  words ${r.words}` : ""}  in-links ${r.inboundInternalLinks}  out-links ${r.outboundInternalLinks}`);
    for (const i of r.issues) console.log(`  ${i.level === "ERROR" ? "✖" : "⚠"} ${i.message}`);
  }
  console.log(`\n${results.length} indexable pages, ${noindexed.length} noindexed (${noindexed.join(", ") || "none"}), ${errors.length} errors, ${warnings} warnings`);
}
if (errors.length) process.exit(1);
