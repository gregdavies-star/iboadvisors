import { readFileSync, writeFileSync } from "node:fs";

const jobs = [
  {
    f: "blog/selling-to-private-equity-pros-and-cons/index.html",
    oldT: "Selling to Private Equity: Pros and Cons | IBO Advisors",
    newT: "Selling to Private Equity: 4 Pros, 5 Cons | IBO Advisors",
    oldD: "The real advantages and costs of selling to private equity: what the multiple buys you, and what the debt, escrows and seven-year hold take back.",
    newD: "The pros and cons of selling to private equity, counted: 4 advantages the multiple and the capital buy, and 5 costs in the debt, the escrow and the hold.",
  },
  {
    f: "blog/minority-recapitalization-explained/index.html",
    oldT: "Minority Recapitalization Explained | IBO Advisors",
    newT: "Minority Recapitalization: Sell 30%, Keep 70% | IBO Advisors",
    oldD: "What a minority recapitalization is, how it compares to a full sale or an Independent Buyout, and when partial liquidity makes sense for owners.",
    newD: "A minority recapitalization sells 20-49% of your company for cash while you keep the majority and the board. What a 30% slice really pays, after discounts.",
  },
];

for (const j of jobs) {
  let h = readFileSync(j.f, "utf8");
  const tc = h.split(j.oldT).length - 1;
  const dc = h.split(j.oldD).length - 1;
  if (tc < 3 || dc < 3) throw new Error(j.f + ": expected >=3/3, got " + tc + "/" + dc);
  console.log(j.f, "title x" + tc, "desc x" + dc);
  h = h.split(j.oldT).join(j.newT).split(j.oldD).join(j.newD);
  writeFileSync(j.f, h);
  console.log("ok", j.f);
}
