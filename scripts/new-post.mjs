#!/usr/bin/env node
// Scaffolds a new blog post by cloning the newest post's page chrome (header, modals, footer,
// scripts) so new posts never drift from the live template. Writes blog/<slug>/index.html with
// an empty body marked <!-- POST BODY --> ... <!-- /POST BODY -->, and inserts a card at the top
// of blog/index.html. Then run scripts/ensure-jsonld.mjs and scripts/build-sitemap.mjs.
//
//   node scripts/new-post.mjs --slug ebitda-multiples-by-industry \
//     --title "EBITDA Multiples by Industry (2026 Lower-Middle-Market Data)" \
//     --description "..." --image comparison-tablet-summit [--date 2026-09-02] [--author "Michael Chasen"]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, ORIGIN, listPages, isBlogPost, postDate } from "./lib/site.mjs";

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : def;
};
const slug = arg("slug"), title = arg("title"), description = arg("description"), image = arg("image");
if (!slug || !title || !description || !image) {
  console.error("usage: node scripts/new-post.mjs --slug <slug> --title <title> --description <desc> --image <asset basename> [--date YYYY-MM-DD] [--author name]");
  process.exit(2);
}
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new Error("slug must be lowercase words separated by hyphens");
if (title.length > 70) console.warn(`warning: title is ${title.length} chars; Google shows ~60`);
if (description.length > 160) console.warn(`warning: description is ${description.length} chars; aim 120-155`);
for (const ext of ["png", "webp"]) if (!existsSync(join(ROOT, "assets", `${image}.${ext}`))) throw new Error(`assets/${image}.${ext} not found`);

const dir = join(ROOT, "blog", slug);
if (existsSync(dir)) throw new Error(`blog/${slug} already exists`);

const date = arg("date", new Date().toISOString().slice(0, 10));
const author = arg("author", "Michael Chasen");
const longDate = new Date(date + "T00:00:00Z").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

// Newest post = template.
const posts = listPages().filter(isBlogPost).sort((a, b) => (postDate(b.html) || "").localeCompare(postDate(a.html) || ""));
const tpl = posts[0];
const url = `${ORIGIN}/blog/${slug}`;
let html = tpl.html;

// Strip the template's auto JSON-LD (ensure-jsonld.mjs regenerates it for the new page).
html = html.replace(/\n?<script type="application\/ld\+json" data-seo="auto">[\s\S]*?<\/script>\n?/, "\n");
html = html
  .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)} | IBO Advisors</title>`)
  .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(description)}$2`)
  .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
  .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
  .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)} | IBO Advisors$2`)
  .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(title)} | IBO Advisors$2`)
  .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(description)}$2`)
  .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${esc(description)}$2`)
  .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${ORIGIN}/assets/${image}.png$2`)
  .replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${ORIGIN}/assets/${image}.png$2`)
  .replace(/<h1 class="post__title">[\s\S]*?<\/h1>/, `<h1 class="post__title">${esc(title)}</h1>`)
  .replace(/<p class="post__meta">[^<]*<\/p>/, `<p class="post__meta">By ${esc(author)} &middot; Updated ${longDate}</p>`)
  .replace(
    /<div class="post__media">[\s\S]*?<\/div>/,
    `<div class="post__media">\n      <picture><source type="image/webp" srcset="/assets/${image}.webp" /><img src="/assets/${image}.png" alt="${esc(title)}" /></picture>\n    </div>`,
  )
  .replace(/<div class="post__body">[\s\S]*?(\n\s*<div class="post__cta">)/, `<div class="post__body">\n<!-- POST BODY -->\n<!-- /POST BODY -->\n      </div>$1`);

mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "index.html"), html);

// Card at the top of the blog grid.
const indexPath = join(ROOT, "blog", "index.html");
const card = `
        <a class="blog-card" href="/blog/${slug}">
          <div class="blog-card__media">
            <picture><source type="image/webp" srcset="/assets/${image}.webp" /><img loading="lazy" decoding="async" src="/assets/${image}.png" alt="${esc(title)}" /></picture>
          </div>
          <div class="blog-card__body">
            <p class="blog-card__date">${longDate}</p>
            <h2 class="blog-card__title">${esc(title)}</h2>
            <p class="blog-card__excerpt">${esc(description)}</p>
            <span class="blog-card__link">Read the article &rarr;</span>
          </div>
        </a>
`;
const index = readFileSync(indexPath, "utf8");
if (!index.includes('<div class="blog-grid">')) throw new Error("blog/index.html: .blog-grid not found");
writeFileSync(indexPath, index.replace('<div class="blog-grid">\n', `<div class="blog-grid">\n${card}`));

console.log(`Created blog/${slug}/index.html (template: ${tpl.urlPath}) and added a card to blog/index.html.`);
console.log("Next: write the article between <!-- POST BODY --> markers, then run: npm run seo:jsonld && npm run seo:sitemap && npm run seo:audit");
