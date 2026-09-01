#!/usr/bin/env node
// Google Search Console client (no dependencies - signs a service-account JWT with node:crypto).
//
//   node scripts/gsc.mjs submit-sitemap        # (re)submit https://www.iboadvisors.com/sitemap.xml
//   node scripts/gsc.mjs pull [--days 28]      # trailing window vs the prior window -> seo/data/gsc-latest.json
//   node scripts/gsc.mjs inspect               # URL Inspection for every sitemap URL -> seo/data/gsc-coverage.json
//
// Env:
//   GSC_SERVICE_ACCOUNT_JSON  contents of the service-account key file (add the SA email as a
//                             user on the Search Console property first - "Full" permission)
//   GSC_PROPERTY              default "sc-domain:iboadvisors.com" (use the URL-prefix form
//                             "https://www.iboadvisors.com/" if you verified that instead)
import { createSign } from "node:crypto";
import { mkdirSync, writeFileSync, appendFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, ORIGIN } from "./lib/site.mjs";

const PROPERTY = process.env.GSC_PROPERTY || "sc-domain:iboadvisors.com";
const SITE = encodeURIComponent(PROPERTY);
const DATA_DIR = join(ROOT, "seo", "data");
const cmd = process.argv[2];
const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : def;
};

async function accessToken() {
  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("GSC_SERVICE_ACCOUNT_JSON is not set");
  const sa = JSON.parse(raw);
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/webmasters",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;
  const sig = createSign("RSA-SHA256").update(unsigned).sign(sa.private_key, "base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${sig}` }),
  });
  if (!res.ok) throw new Error(`token exchange failed: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

async function api(token, method, url, body) {
  const res = await fetch(url, {
    method,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${url} -> ${res.status} ${text}`);
  return text ? JSON.parse(text) : {};
}

const iso = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => new Date(Date.now() - n * 864e5);

async function query(token, startDate, endDate, dimensions, rowLimit = 1000) {
  const out = await api(token, "POST", `https://searchconsole.googleapis.com/webmasters/v3/sites/${SITE}/searchAnalytics/query`, {
    startDate, endDate, dimensions, rowLimit, type: "web", dataState: "final",
  });
  return (out.rows || []).map((r) => {
    const o = { clicks: r.clicks, impressions: r.impressions, ctr: +r.ctr.toFixed(4), position: +r.position.toFixed(1) };
    dimensions.forEach((d, i) => (o[d] = r.keys[i]));
    return o;
  });
}

// Rough expected CTR by position (informational B2B queries) - used to flag title/meta rewrites.
const expectedCtr = (pos) => (pos <= 1 ? 0.28 : pos <= 2 ? 0.15 : pos <= 3 ? 0.10 : pos <= 5 ? 0.06 : pos <= 10 ? 0.03 : pos <= 20 ? 0.01 : 0.004);

async function pull() {
  const token = await accessToken();
  const days = +arg("days", 28);
  const lag = 3; // GSC data is final ~2-3 days behind
  const curEnd = daysAgo(lag), curStart = daysAgo(lag + days - 1);
  const prevEnd = daysAgo(lag + days), prevStart = daysAgo(lag + 2 * days - 1);
  const [pages, prevPages, queries, prevQueries, pageQueries, totals, prevTotals] = await Promise.all([
    query(token, iso(curStart), iso(curEnd), ["page"]),
    query(token, iso(prevStart), iso(prevEnd), ["page"]),
    query(token, iso(curStart), iso(curEnd), ["query"], 500),
    query(token, iso(prevStart), iso(prevEnd), ["query"], 500),
    query(token, iso(curStart), iso(curEnd), ["page", "query"], 2000),
    query(token, iso(curStart), iso(curEnd), []),
    query(token, iso(prevStart), iso(prevEnd), []),
  ]);

  const prevByPage = Object.fromEntries(prevPages.map((r) => [r.page, r]));
  const prevByQuery = Object.fromEntries(prevQueries.map((r) => [r.query, r]));
  const withDelta = (rows, prev, key) =>
    rows.map((r) => {
      const p = prev[r[key]];
      return { ...r, prev: p ? { clicks: p.clicks, impressions: p.impressions, ctr: p.ctr, position: p.position } : null };
    });

  // Opportunities the daily job acts on.
  const strikingDistance = pageQueries
    .filter((r) => r.position >= 4 && r.position <= 20 && r.impressions >= 20)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 100);
  const lowCtr = pages
    .filter((r) => r.impressions >= 100 && r.ctr < expectedCtr(r.position) * 0.6)
    .map((r) => ({ ...r, expectedCtr: expectedCtr(r.position) }))
    .sort((a, b) => b.impressions - a.impressions);
  const byQuery = {};
  for (const r of pageQueries) (byQuery[r.query] ||= []).push(r);
  const cannibalization = Object.entries(byQuery)
    .filter(([, rows]) => rows.length > 1 && rows.reduce((n, r) => n + r.impressions, 0) >= 30)
    .map(([q, rows]) => ({ query: q, pages: rows.map((r) => ({ page: r.page, impressions: r.impressions, position: r.position })) }))
    .slice(0, 50);
  const decliners = withDelta(pages, prevByPage, "page")
    .filter((r) => r.prev && r.prev.clicks >= 5 && r.clicks < r.prev.clicks * 0.7)
    .sort((a, b) => b.prev.clicks - a.prev.clicks);

  const snapshot = {
    property: PROPERTY,
    pulledAt: new Date().toISOString(),
    window: { days, current: [iso(curStart), iso(curEnd)], previous: [iso(prevStart), iso(prevEnd)] },
    totals: { current: totals[0] || null, previous: prevTotals[0] || null },
    pages: withDelta(pages, prevByPage, "page"),
    queries: withDelta(queries, prevByQuery, "query"),
    pageQueries,
    opportunities: { strikingDistance, lowCtr, cannibalization, decliners },
  };
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(join(DATA_DIR, "gsc-latest.json"), JSON.stringify(snapshot, null, 2) + "\n");
  const t = totals[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  appendFileSync(join(DATA_DIR, "history.jsonl"), JSON.stringify({ date: iso(curEnd), days, ...t, pages: pages.length, queries: queries.length }) + "\n");
  console.log(`GSC ${days}d to ${iso(curEnd)}: ${t.clicks} clicks, ${t.impressions} impressions, ${pages.length} pages, ${queries.length} queries`);
  console.log(`opportunities: ${strikingDistance.length} striking-distance, ${lowCtr.length} low-CTR, ${cannibalization.length} cannibalized, ${decliners.length} decliners`);
}

async function submitSitemap() {
  const token = await accessToken();
  const feed = encodeURIComponent(`${ORIGIN}/sitemap.xml`);
  await api(token, "PUT", `https://www.googleapis.com/webmasters/v3/sites/${SITE}/sitemaps/${feed}`);
  const list = await api(token, "GET", `https://www.googleapis.com/webmasters/v3/sites/${SITE}/sitemaps`);
  console.log("Submitted. Sitemaps on property:");
  for (const s of list.sitemap || []) console.log(`  ${s.path}  lastSubmitted=${s.lastSubmitted}  lastDownloaded=${s.lastDownloaded || "-"}  errors=${s.errors} warnings=${s.warnings}`);
}

async function inspect() {
  const token = await accessToken();
  const urls = [...readFileSync(join(ROOT, "sitemap.xml"), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const results = [];
  for (const url of urls) {
    const r = await api(token, "POST", "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", { inspectionUrl: url, siteUrl: PROPERTY });
    const s = r.inspectionResult?.indexStatusResult || {};
    results.push({ url, verdict: s.verdict, coverageState: s.coverageState, lastCrawlTime: s.lastCrawlTime, googleCanonical: s.googleCanonical, robotsTxtState: s.robotsTxtState, indexingState: s.indexingState });
    console.log(`${(s.verdict || "?").padEnd(8)} ${url}  ${s.coverageState || ""}`);
  }
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(join(DATA_DIR, "gsc-coverage.json"), JSON.stringify({ inspectedAt: new Date().toISOString(), results }, null, 2) + "\n");
  const notIndexed = results.filter((r) => r.verdict !== "PASS");
  console.log(`\n${results.length - notIndexed.length}/${results.length} indexed${notIndexed.length ? ` - NOT indexed: ${notIndexed.map((r) => r.url).join(", ")}` : ""}`);
}

const commands = { pull, "submit-sitemap": submitSitemap, inspect };
if (!commands[cmd]) {
  console.error("usage: node scripts/gsc.mjs <pull|submit-sitemap|inspect> [--days N]");
  process.exit(2);
}
commands[cmd]().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
