#!/usr/bin/env node
// Ahrefs API v3 pull -> seo/data/ahrefs-latest.json. Optional: the daily job skips it when
// AHREFS_API_KEY is unset. (API v3 access is included on Enterprise plans; other plans can buy
// API units - check Ahrefs > Account > API.)
//
//   node scripts/ahrefs.mjs pull
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib/site.mjs";

const KEY = process.env.AHREFS_API_KEY;
const TARGET = process.env.AHREFS_TARGET || "iboadvisors.com";
const DATA_DIR = join(ROOT, "seo", "data");
const today = new Date().toISOString().slice(0, 10);

async function get(path, params) {
  const url = new URL(`https://api.ahrefs.com/v3/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { authorization: `Bearer ${KEY}`, accept: "application/json" } });
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${await res.text()}`);
  return res.json();
}

async function pull() {
  if (!KEY) throw new Error("AHREFS_API_KEY is not set");
  const common = { target: TARGET, mode: "domain", country: "us", date: today };
  const [metrics, organic, backlinksStats, referring] = await Promise.all([
    get("site-explorer/metrics", { ...common, volume_mode: "monthly" }),
    get("site-explorer/organic-keywords", { ...common, select: "keyword,volume,keyword_difficulty,best_position,best_position_url,sum_traffic,cpc", limit: 1000, order_by: "sum_traffic:desc" }),
    get("site-explorer/backlinks-stats", { target: TARGET, mode: "domain", date: today }),
    get("site-explorer/refdomains", { target: TARGET, mode: "domain", select: "domain,domain_rating,links_to_target,first_seen", limit: 500, order_by: "domain_rating:desc" }),
  ]);

  // Keyword targets the site is tracking (seo/keywords.json) - pull volume/KD for gap analysis.
  const targets = JSON.parse(readFileSync(join(ROOT, "seo", "keywords.json"), "utf8"));
  const wanted = targets.clusters.flatMap((c) => c.keywords);
  let keywordMetrics = [];
  try {
    const r = await get("keywords-explorer/overview", { country: "us", keywords: wanted.join(","), select: "keyword,volume,difficulty,cpc,traffic_potential,parent_topic" });
    keywordMetrics = r.keywords || [];
  } catch (e) {
    console.warn(`keywords-explorer skipped: ${e.message}`);
  }

  const snapshot = {
    target: TARGET,
    pulledAt: new Date().toISOString(),
    metrics: metrics.metrics || metrics,
    backlinks: backlinksStats.metrics || backlinksStats,
    referringDomains: referring.refdomains || [],
    organicKeywords: organic.keywords || [],
    targetKeywordMetrics: keywordMetrics,
  };
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(join(DATA_DIR, "ahrefs-latest.json"), JSON.stringify(snapshot, null, 2) + "\n");
  console.log(`Ahrefs: ${snapshot.organicKeywords.length} organic keywords, ${snapshot.referringDomains.length} referring domains`);
}

if (process.argv[2] !== "pull") {
  console.error("usage: node scripts/ahrefs.mjs pull");
  process.exit(2);
}
pull().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
