#!/usr/bin/env node
// Inserts or refreshes a structured-data block on every indexable page. Idempotent: the block is
// tagged data-seo="auto" and replaced in place on every run, so it is safe for the daily job to
// call after adding or editing a post. Hand-written JSON-LD (like the calculator's) is left alone.
//
// Usage: node scripts/ensure-jsonld.mjs [--check]
import { readFileSync, writeFileSync } from "node:fs";
import {
  ORIGIN, listPages, isBlogPost, isNoindex, title, meta, canonical, h1s, postDate, postAuthor, postImage, wordCount,
} from "./lib/site.mjs";

const ORG_ID = `${ORIGIN}/#organization`;
const SITE_ID = `${ORIGIN}/#website`;
const AUTHOR_ID = `${ORIGIN}/#michael-chasen`;

const organization = {
  "@type": ["Organization", "FinancialService"],
  "@id": ORG_ID,
  name: "IBO Advisors",
  url: ORIGIN + "/",
  logo: { "@type": "ImageObject", url: `${ORIGIN}/assets/logo.png` },
  description:
    "M&A advisory firm that structures Independent Buyouts (IBOs) - private-equity-level liquidity and valuation for business owners with $3M+ EBITDA, without selling to private equity.",
  areaServed: "US",
  founder: { "@id": AUTHOR_ID },
};
const author = {
  "@type": "Person",
  "@id": AUTHOR_ID,
  name: "Michael Chasen",
  jobTitle: "Founder",
  worksFor: { "@id": ORG_ID },
  url: ORIGIN + "/#team",
};
const website = {
  "@type": "WebSite",
  "@id": SITE_ID,
  url: ORIGIN + "/",
  name: "IBO Advisors",
  publisher: { "@id": ORG_ID },
};

function graphFor(page) {
  const html = page.html;
  const url = canonical(html) || page.url;
  const headline = h1s(html)[0] || title(html);
  const description = meta(html, "description") || "";

  if (isBlogPost(page)) {
    const date = postDate(html);
    const name = postAuthor(html) || "Michael Chasen";
    return [
      organization,
      { ...author, name },
      {
        "@type": "BlogPosting",
        "@id": `${url}#article`,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        headline,
        description,
        image: postImage(html) || `${ORIGIN}/assets/hero-dusk.jpg`,
        author: { "@id": AUTHOR_ID },
        publisher: { "@id": ORG_ID },
        datePublished: date,
        dateModified: date,
        wordCount: wordCount(html),
        inLanguage: "en-US",
        isPartOf: { "@type": "Blog", "@id": `${ORIGIN}/blog#blog` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: ORIGIN + "/" },
          { "@type": "ListItem", position: 2, name: "Insights", item: ORIGIN + "/blog" },
          { "@type": "ListItem", position: 3, name: headline, item: url },
        ],
      },
    ];
  }
  if (page.urlPath === "/") {
    return [organization, author, website, {
      "@type": "WebPage", "@id": url, url, name: title(html), description, isPartOf: { "@id": SITE_ID }, about: { "@id": ORG_ID },
    }];
  }
  if (page.urlPath === "/blog") {
    const posts = [...html.matchAll(/<a class="blog-card" href="([^"]+)"/g)].map((m) => ORIGIN + m[1]);
    return [organization, website, {
      "@type": "Blog",
      "@id": `${url}#blog`,
      url,
      name: "IBO Advisors Insights",
      description,
      publisher: { "@id": ORG_ID },
      blogPost: posts.map((p) => ({ "@id": `${p}#article` })),
    }];
  }
  return null; // pages with hand-written JSON-LD or nothing to add
}

const BLOCK_RE = /\n?<script type="application\/ld\+json" data-seo="auto">[\s\S]*?<\/script>\n?/;
let changed = 0;
for (const page of listPages()) {
  if (isNoindex(page)) continue;
  const graph = graphFor(page);
  if (!graph) continue;
  const block = `\n<script type="application/ld+json" data-seo="auto">\n${JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2)}\n</script>\n`;
  let html = page.html;
  html = BLOCK_RE.test(html) ? html.replace(BLOCK_RE, block) : html.replace(/\n?<\/head>/, `${block}</head>`);
  if (html !== page.html) {
    changed++;
    if (process.argv.includes("--check")) console.error(`stale JSON-LD: ${page.urlPath}`);
    else writeFileSync(page.file, html);
  }
}
if (process.argv.includes("--check") && changed) {
  console.error("Run `node scripts/ensure-jsonld.mjs`");
  process.exit(1);
}
console.log(`${process.argv.includes("--check") ? "Checked" : "Updated"} JSON-LD on ${changed} page(s)`);
