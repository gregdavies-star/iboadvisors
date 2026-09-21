#!/usr/bin/env node
// Tests for scripts/check-html.mjs.
//
// The point of these is that a structural checker which never fires is worse than no checker at
// all - it reads as a passing gate while catching nothing. Half the cases below assert that real
// breakage IS reported; the other half assert that ordinary markup this site uses is NOT, since a
// checker that cries wolf gets switched off.
//
// Usage: node scripts/test-check-html.mjs
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { checkHtml } from "./check-html.mjs";
import { ROOT } from "./lib/site.mjs";

// [name, html, shouldReportAnError]
const CASES = [
  // --- must be reported -------------------------------------------------
  ["unclosed div", "<html><body><div><span>hi</span></body></html>", true],
  ["nested anchor", '<body><a href="1"><a href="2">x</a></a></body>', true],
  ["duplicate id", '<body><div id="k"></div><p id="k"></p></body>', true],
  ["stray closing tag", "<body><div>x</div></section></body>", true],
  [
    // The exact shape that broke /blog twice: a card missing its </div></a>, so the next card's
    // anchor opens inside it.
    "blog card missing its closing tags",
    `<div class="blog-grid">
       <a class="blog-card" href="/a"><div class="blog-card__body"><p>one</p>
       <a class="blog-card" href="/b"><div class="blog-card__body"><p>two</p>
         <span class="blog-card__link">Read</span></div></a>
     </div>`,
    true,
  ],

  // --- must NOT be reported ---------------------------------------------
  ["well-formed document", '<html><body><div><a href="#"><img src="x.png" /></a></div></body></html>', false],
  ["script using < and > as operators", "<body><script>if (a < b && c > d) { x(); }</script><div>ok</div></body>", false],
  ["JSON-LD containing angle brackets", '<body><script type="application/ld+json">{"a":"x < y"}</script></body>', false],
  ["stylesheet with a child selector", "<body><style>.a > .b { color: red }</style><div>ok</div></body>", false],
  ["void elements left unclosed", '<body><br><hr><meta charset="utf-8"><img src="a"><source srcset="b"></body>', false],
  ["li and p relying on optional end tags", "<body><ul><li>a<li>b</ul><p>x<p>y</body>", false],
  ["tags inside an HTML comment", "<body><!-- <div> unclosed in a comment --><div>ok</div></body>", false],
  ["attribute value containing >", '<body><div data-x="a > b"><span>y</span></div></body>', false],
  ["XHTML-style self-closing tags, as used across this site", '<body><img src="a.png" /><source srcset="a.webp" /><div>ok</div></body>', false],
];

let failed = 0;
for (const [name, html, shouldError] of CASES) {
  const errors = checkHtml(html);
  const ok = shouldError ? errors.length > 0 : errors.length === 0;
  if (!ok) {
    failed++;
    console.log(`FAIL  ${name}`);
    console.log(`      expected ${shouldError ? "an error" : "no errors"}, got ${errors.length}`);
    errors.forEach((e) => console.log(`        line ${e.line}: ${e.message}`));
  } else {
    console.log(`PASS  ${name}`);
  }
}

// Every page currently in the repo must pass, or the checker cannot be a gate.
const home = checkHtml(readFileSync(join(ROOT, "index.html"), "utf8"));
if (home.length) {
  failed++;
  console.log(`FAIL  the real homepage is reported as broken`);
  home.forEach((e) => console.log(`        line ${e.line}: ${e.message}`));
} else {
  console.log("PASS  the real homepage, with its gtag script and JSON-LD, is clean");
}

console.log(`\n${CASES.length + 1 - failed}/${CASES.length + 1} passed`);
process.exit(failed === 0 ? 0 : 1);
