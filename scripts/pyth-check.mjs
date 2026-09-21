// One-shot entitlement check: reads the token from .env.local, calls Pyth Lazer,
// prints ONLY status + prices (never the key).
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => l.split("="))
);
const token = (env.NEXT_PUBLIC_PYTH_TOKEN ?? "").replace(/^["']|["']$/g, "");
if (!token) {
  console.log("TOKEN_STATUS: missing (NEXT_PUBLIC_PYTH_TOKEN not set)");
  process.exit(0);
}
console.log(`TOKEN_STATUS: present (${token.length} chars, prefix ${token.slice(0, 4)}...)`);

const { PythLazerClient } = await import("@pythnetwork/pyth-lazer-sdk");
const c = await PythLazerClient.create({ token });
console.log("CLIENT: created OK");

let syms = null;
try {
  syms = await c.getSymbols({ query: "AAPL" });
  console.log(`SYMBOLS: ${syms.length} feeds matched "AAPL"`);
  for (const s of syms.slice(0, 12)) console.log(`  - ${s.symbol} (id ${s.pyth_lazer_id})`);
} catch (e) {
  console.log(`SYMBOLS_ERROR: ${e?.message ?? e}`);
}

const aapl = syms?.find((s) => s.symbol === "Equity.US.AAPL/USD");
const aaplx = syms?.find((s) => s.symbol === "Crypto.AAPLX/USD");
if (!aapl || !aaplx) {
  console.log(`FEEDS: aapl=${aapl ? "yes" : "NO"} aaplx=${aaplx ? "yes" : "NO"}`);
  process.exit(0);
}
console.log(`FEEDS: both resolved (aapl=${aapl.pyth_lazer_id}, aaplx=${aaplx.pyth_lazer_id})`);

try {
  const r = await c.getLatestPrice({
    priceFeedIds: [aapl.pyth_lazer_id, aaplx.pyth_lazer_id],
    properties: ["price", "exponent", "confidence", "publisherCount"],
    formats: [],
    channel: "fixed_rate@200ms",
  });
  const p = r.parsed;
  for (const f of p?.priceFeeds ?? []) {
    const price = f.price != null ? Number(f.price) * 10 ** Number(f.exponent) : null;
    const which = f.priceFeedId === aapl.pyth_lazer_id ? "AAPL " : "AAPLX";
    console.log(`PRICE ${which}: ${price ?? "n/a"} (conf=${f.confidence}, pubs=${f.publisherCount}, tsUs=${p?.timestampUs})`);
  }
  console.log("RESULT: PYTH PATH WORKING");
} catch (e) {
  console.log(`PRICE_ERROR: ${e?.message ?? e}`);
}
process.exit(0);
