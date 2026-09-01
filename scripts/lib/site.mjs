// Shared helpers for the SEO scripts. No dependencies - Node 18+ only.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const ORIGIN = "https://www.iboadvisors.com";

const SKIP_DIRS = new Set([".git", "node_modules", "assets", "scripts", "seo", ".github", ".vercel"]);

/** Every index.html in the repo, as { file, urlPath, url, html }. */
export function listPages() {
  const pages = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      if (SKIP_DIRS.has(name)) continue;
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name === "index.html") {
        const rel = relative(ROOT, dirname(full)).split("\\").join("/");
        const urlPath = rel === "" ? "/" : `/${rel}`;
        pages.push({ file: full, urlPath, url: ORIGIN + urlPath, html: readFileSync(full, "utf8") });
      }
    }
  };
  walk(ROOT);
  return pages.sort((a, b) => a.urlPath.localeCompare(b.urlPath));
}

export const isBlogPost = (p) => p.urlPath.startsWith("/blog/");
export const isNoindex = (p) => /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(p.html);

export function meta(html, name) {
  const m = html.match(new RegExp(`<meta\\s+name="${name}"\\s+content="([^"]*)"`, "i"));
  return m ? decode(m[1]) : null;
}
export function property(html, prop) {
  const m = html.match(new RegExp(`<meta\\s+property="${prop}"\\s+content="([^"]*)"`, "i"));
  return m ? decode(m[1]) : null;
}
export function title(html) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m ? decode(m[1]) : null;
}
export function canonical(html) {
  const m = html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i);
  return m ? m[1] : null;
}
export function h1s(html) {
  return [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => strip(m[1]));
}
export function h2s(html) {
  return [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map((m) => strip(m[1]));
}
export function bodyText(html) {
  const m = html.match(/<div class="post__body">([\s\S]*?)<div class="post__cta">/);
  return strip(m ? m[1] : html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ""));
}
export function wordCount(html) {
  return bodyText(html).split(/\s+/).filter(Boolean).length;
}
/** "Updated August 24, 2026" -> "2026-08-24" (blog posts only). */
export function postDate(html) {
  const m = html.match(/(?:Updated|Published)\s+([A-Z][a-z]+ \d{1,2}, \d{4})/);
  if (!m) return null;
  const d = new Date(m[1] + " UTC");
  return isNaN(d) ? null : d.toISOString().slice(0, 10);
}
export function postAuthor(html) {
  const m = html.match(/<p class="post__meta">By ([^&<]+?)\s*&middot;/);
  return m ? m[1].trim() : null;
}
export function postImage(html) {
  const m = html.match(/<div class="post__media">[\s\S]*?<img[^>]*src="([^"]+)"/);
  return m ? ORIGIN + m[1] : null;
}
export function gitLastMod(file) {
  try {
    const out = execSync(`git log -1 --format=%cI -- "${relative(ROOT, file)}"`, { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
    return out ? out.slice(0, 10) : null;
  } catch {
    return null;
  }
}
export function strip(html) {
  return decode(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}
export function decode(s) {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&rsquo;/g, "\u2019").replace(/&lsquo;/g, "\u2018")
    .replace(/&rdquo;/g, "\u201d").replace(/&ldquo;/g, "\u201c").replace(/&mdash;/g, "\u2014")
    .replace(/&ndash;/g, "\u2013").replace(/&middot;/g, "\u00b7").replace(/&nbsp;/g, " ").replace(/&rarr;/g, "\u2192");
}
export function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
export function readJsonIfExists(path, fallback = null) {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : fallback;
}
