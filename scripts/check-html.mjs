#!/usr/bin/env node
// Structural well-formedness check for every page. Exit code 1 on any error so it can gate a PR.
//
// Usage: node scripts/check-html.mjs [--json]
//
// This exists because two separate clean merges shipped broken HTML to production. Both times a
// new blog card was inserted at the top of blog/index.html by two branches at once; git stitched
// the hunks together and dropped the closing </div></a> between them. The merge was textually
// clean - git has no reason to know a <div> needs closing - and seo-audit only reads titles and
// descriptions, so nothing failed. The page rendered as a collapsed grid: browsers cannot nest
// anchors, so they close the outer <a> wherever they meet the inner one, and every card below
// that point loses its layout.
//
// What it checks:
//   - every element that needs a closing tag gets one, in the right order
//   - no <a> inside another <a> (the specific shape that broke the grid, and invalid HTML)
//   - no duplicate id attributes, which silently break getElementById and in-page anchors
//
// What it is not: a full HTML parser or a spec validator. It is a tag-balance scanner tuned to
// the failure this repo actually hits. It should stay dependency-free and fast enough to run on
// every commit.
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT, listPages } from "./lib/site.mjs";

// Elements that never have a closing tag. Anything else is expected to be closed.
const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

// Elements a browser will close for you when a sibling or parent ends. Leaving one unclosed is
// legal HTML and renders fine, so flagging it would be noise rather than signal.
const OPTIONAL_END = new Set([
  "li", "p", "td", "th", "tr", "thead", "tbody", "tfoot", "option", "dt", "dd",
]);

// Raw-text elements: everything up to the matching close tag is data, not markup. Their contents
// routinely contain "<" (a < b in a script, JSON-LD, a CSS child selector), so scanning inside
// them would produce garbage.
const RAW_TEXT = new Set(["script", "style", "textarea", "title"]);

const lineOf = (html, index) => html.slice(0, index).split("\n").length;

// Walk a document, returning every structural error found in it.
export function checkHtml(html) {
  const errors = [];
  const stack = [];
  const ids = new Map();
  const tag = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g;

  let i = 0;
  while (i < html.length) {
    // Skip comments, doctypes and CDATA wholesale - they carry no structure we care about.
    if (html.startsWith("<!--", i)) {
      const end = html.indexOf("-->", i);
      i = end === -1 ? html.length : end + 3;
      continue;
    }
    if (html.startsWith("<!", i)) {
      const end = html.indexOf(">", i);
      i = end === -1 ? html.length : end + 1;
      continue;
    }

    tag.lastIndex = i;
    const m = tag.exec(html);
    if (!m) break;

    const [full, closing, rawName, attrs, selfClosed] = m;
    const name = rawName.toLowerCase();
    const at = m.index;

    if (!closing) {
      // Duplicate ids break getElementById and #fragment links without any visible symptom.
      const id = /\bid\s*=\s*["']([^"']+)["']/i.exec(attrs);
      if (id) {
        const prev = ids.get(id[1]);
        if (prev) errors.push({ line: lineOf(html, at), message: `duplicate id "${id[1]}" (first used on line ${prev})` });
        else ids.set(id[1], lineOf(html, at));
      }

      if (name === "a" && stack.some((e) => e.name === "a")) {
        const outer = stack.findLast((e) => e.name === "a");
        errors.push({
          line: lineOf(html, at),
          message: `<a> nested inside the <a> opened on line ${outer.line} - browsers close the outer one here, which collapses the layout`,
        });
      }

      if (RAW_TEXT.has(name) && !selfClosed) {
        // Jump past the raw text to its closing tag; nothing inside is markup.
        const close = html.toLowerCase().indexOf(`</${name}`, at + full.length);
        i = close === -1 ? html.length : html.indexOf(">", close) + 1;
        continue;
      }

      if (!VOID.has(name) && !selfClosed) stack.push({ name, line: lineOf(html, at) });
      i = at + full.length;
      continue;
    }

    // A closing tag. Find its partner, popping any optional-end elements left open above it.
    const depth = stack.findLastIndex((e) => e.name === name);
    if (depth === -1) {
      if (!OPTIONAL_END.has(name) && !VOID.has(name)) {
        errors.push({ line: lineOf(html, at), message: `stray </${name}> with no matching open tag` });
      }
    } else {
      for (let d = stack.length - 1; d > depth; d--) {
        const unclosed = stack[d];
        if (!OPTIONAL_END.has(unclosed.name)) {
          errors.push({
            line: unclosed.line,
            message: `<${unclosed.name}> is never closed - </${name}> on line ${lineOf(html, at)} closes an ancestor first`,
          });
        }
      }
      stack.length = depth;
    }
    i = at + full.length;
  }

  for (const left of stack) {
    if (!OPTIONAL_END.has(left.name)) {
      errors.push({ line: left.line, message: `<${left.name}> is never closed` });
    }
  }

  return errors.sort((a, b) => a.line - b.line);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const asJson = process.argv.includes("--json");
  const pages = listPages();
  const report = [];
  let total = 0;

  for (const p of pages) {
    const errors = checkHtml(p.html);
    if (errors.length) {
      total += errors.length;
      report.push({ url: p.urlPath, file: p.file, errors });
    }
  }

  if (asJson) {
    mkdirSync(join(ROOT, "seo", "data"), { recursive: true });
    writeFileSync(join(ROOT, "seo", "data", "html-check.json"), JSON.stringify({ generatedAt: new Date().toISOString(), pages: report }, null, 2) + "\n");
  }

  for (const { url, errors } of report) {
    console.log(`\n${url}`);
    for (const e of errors) console.log(`  line ${e.line}: ${e.message}`);
  }

  console.log(
    total === 0
      ? `\n${pages.length} pages checked, all well-formed`
      : `\n${pages.length} pages checked, ${total} structural error(s) in ${report.length} page(s)`
  );
  process.exit(total === 0 ? 0 : 1);
}
