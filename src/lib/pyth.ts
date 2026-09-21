// Pyth Pro (Lazer) market data — live prices for real AAPL and the AAPLx xStock.
//
// Primary source: official @pythnetwork/pyth-lazer-sdk, HTTP latest-price
// endpoint (no WebSocket). Requires a Pyth API key — set NEXT_PUBLIC_PYTH_TOKEN
// (inlined at build time for the static export). Feeds (exactly the two the
// Pyth track calls out):
//   Equity.US.AAPL/USD  — the real Apple equity feed
//   Crypto.AAPLX/USD    — the xStock feed (our vault's underlying)
//
// Fallback source (no key, or key rejected / grant pending): keyless public
// market data, both CORS-open for browser fetch:
//   Real AAPL:  CNBC quote service (NASDAQ last trade + market session state)
//   AAPLx:      CoinGecko live market price of the Backed AAPLx xStock (24/7)
// The fallback is clearly labeled in the UI and the Pyth path takes over the
// moment a working key is present. Nothing throws; nothing blocks the app.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PythLazerClient } from "@pythnetwork/pyth-lazer-sdk";
import type { ParsedPayload } from "@pythnetwork/pyth-lazer-sdk";

const TOKEN = process.env.NEXT_PUBLIC_PYTH_TOKEN ?? "";

const SYM_AAPL = "Equity.US.AAPL/USD";
const SYM_AAPLX = "Crypto.AAPLX/USD";

export type PythQuote = {
  price: number;
  conf: number;
  pubs: number;
  at: number; // ms epoch (from payload timestampUs)
  tradeDay?: string; // ISO day (YYYY-MM-DD) of the underlying trade, when known
};

export type PythSource = "pyth" | "fallback";

export type PythState = {
  aapl: PythQuote | null;
  aaplx: PythQuote | null;
  error: string | null;
  fetchedAt: number | null;
  source: PythSource | null; // which backend served the last good quote
  session?: string; // market session state from fallback (e.g. "POST_MKT")
};

export function pythConfigured(): boolean {
  return TOKEN.length > 0;
}

let clientPromise: Promise<PythLazerClient> | null = null;
function client(): Promise<PythLazerClient> {
  if (!clientPromise) {
    clientPromise = PythLazerClient.create({ token: TOKEN });
  }
  return clientPromise;
}

// Resolve numeric feed IDs once (response feeds are keyed by id, not symbol).
let feedIds: { aapl: number; aaplx: number } | null = null;
async function resolveFeedIds(): Promise<{ aapl: number; aaplx: number }> {
  if (feedIds) return feedIds;
  const c = await client();
  const syms = await c.getSymbols({ query: "AAPL" });
  const aapl = syms.find((s) => s.symbol === SYM_AAPL);
  const aaplx = syms.find((s) => s.symbol === SYM_AAPLX);
  if (!aapl || !aaplx) throw new Error("AAPL feeds not found in Pyth symbols");
  feedIds = { aapl: aapl.pyth_lazer_id, aaplx: aaplx.pyth_lazer_id };
  return feedIds;
}

function parsePayload(p: ParsedPayload): { aapl: PythQuote | null; aaplx: PythQuote | null; at: number } {
  const at = Number(p.timestampUs) / 1000;
  const out = { aapl: null as PythQuote | null, aaplx: null as PythQuote | null, at };
  for (const f of p.priceFeeds ?? []) {
    if (f.price == null || f.exponent == null) continue;
    const price = Number(f.price) * 10 ** Number(f.exponent);
    const conf = f.confidence != null ? Number(f.confidence) * 10 ** Number(f.exponent) : 0;
    const quote: PythQuote = {
      price,
      conf,
      pubs: f.publisherCount ?? 0,
      at,
    };
    if (f.priceFeedId === feedIds!.aapl) out.aapl = quote;
    else if (f.priceFeedId === feedIds!.aaplx) out.aaplx = quote;
  }
  return out;
}

export async function fetchPythPrices(): Promise<PythState> {
  if (!pythConfigured()) return { aapl: null, aaplx: null, error: null, fetchedAt: null, source: null };
  try {
    const ids = await resolveFeedIds();
    const c = await client();
    const r = await c.getLatestPrice({
      priceFeedIds: [ids.aapl, ids.aaplx],
      properties: ["price", "exponent", "confidence", "publisherCount"],
      formats: [],
      channel: "fixed_rate@200ms",
    });
    const parsed = r.parsed;
    if (!parsed) return { aapl: null, aaplx: null, error: "no parsed payload", fetchedAt: Date.now(), source: null };
    const p = parsePayload(parsed);
    return { aapl: p.aapl, aaplx: p.aaplx, error: null, fetchedAt: Date.now(), source: "pyth" };
  } catch (e: any) {
    const m = String(e?.message ?? e);
    const msg = /invalid API key|unauthorized|401/i.test(m)
      ? "Pyth API key rejected"
      : /not entitled|no grant|403/i.test(m)
        ? "AAPL feeds not enabled for this Pyth key"
        : "live feed unreachable";
    return { aapl: null, aaplx: null, error: msg, fetchedAt: Date.now(), source: null };
  }
}

// ---------------------------------------------------------------------------
// Keyless fallback — live public market data, both CORS-open for browser fetch.
// Used when no Pyth key is configured or the Pyth call fails (e.g. grant still
// pending). Clearly labeled as a fallback in the UI.
// ---------------------------------------------------------------------------

const CNBC_AAPL =
  "https://quote.cnbc.com/quote-html-webservice/restQuote/symbolType/symbol?symbols=AAPL&requestMethod=itv&noform=1&partnerId=2&fund=1&exthrs=1&output=json";
const COINGECKO_AAPLX =
  "https://api.coingecko.com/api/v3/simple/price?ids=apple-xstock&vs_currencies=usd&include_last_updated_at=true";

async function fetchJson(url: string, timeoutMs = 10000): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

export async function fetchFallbackPrices(): Promise<PythState> {
  // Both independent: real AAPL from CNBC, AAPLx from CoinGecko.
  const [aaplRes, aaplxRes] = await Promise.allSettled([
    fetchJson(CNBC_AAPL),
    fetchJson(COINGECKO_AAPLX),
  ]);

  let aapl: PythQuote | null = null;
  let session: string | undefined;
  if (aaplRes.status === "fulfilled") {
    const q = aaplRes.value?.FormattedQuoteResult?.FormattedQuote?.[0];
    const price = Number(q?.last);
    const prevClose = Number(q?.previous_day_closing);
    if (q && Number.isFinite(price) && price > 0) {
      // last_time is a date (YYYY-MM-DD) of the actual trade. Stamp "now" only
      // when the trade is from today; otherwise keep the real date so the UI
      // shows honest staleness (e.g. Friday's close on a weekend).
      const tradeDay = q.last_time ? new Date(`${String(q.last_time)}T00:00:00Z`) : null;
      const isToday =
        tradeDay && !Number.isNaN(tradeDay.getTime()) &&
        Math.floor(tradeDay.getTime() / 86400000) === Math.floor(Date.now() / 86400000);
      const tradeDayIso = q.last_time ? String(q.last_time).slice(0, 10) : undefined;
      aapl = {
        price,
        conf: prevClose > 0 ? Math.abs(price - prevClose) * 0.001 : 0, // not a real conf; UI hides it
        pubs: 0,
        at: isToday ? Date.now() : tradeDay && !Number.isNaN(tradeDay.getTime()) ? tradeDay.getTime() : Date.now(),
        tradeDay: tradeDayIso,
      };
      session = q.curmktstatus ? String(q.curmktstatus) : undefined;
    }
  }

  let aaplx: PythQuote | null = null;
  if (aaplxRes.status === "fulfilled") {
    const x = aaplxRes.value?.["apple-xstock"];
    const price = Number(x?.usd);
    const updatedAt = Number(x?.last_updated_at);
    if (x && Number.isFinite(price) && price > 0) {
      aaplx = {
        price,
        conf: 0,
        pubs: 0,
        at: Number.isFinite(updatedAt) ? updatedAt * 1000 : Date.now(),
      };
    }
  }

  if (!aapl && !aaplx) {
    return { aapl: null, aaplx: null, error: "fallback sources unreachable", fetchedAt: Date.now(), source: null };
  }
  return { aapl, aaplx, error: null, fetchedAt: Date.now(), source: "fallback", session };
}

// Unified poll: Pyth when configured and working, otherwise the keyless
// fallback. Keeps last good quote across transient failures.
export async function fetchPrices(): Promise<PythState> {
  if (pythConfigured()) {
    const s = await fetchPythPrices();
    if (!s.error && (s.aapl || s.aaplx)) return s;
    // Pyth present but not usable (grant pending / key rejected) -> fallback
    const f = await fetchFallbackPrices();
    return { ...f, error: s.error ? `Pyth: ${s.error} — using live public market data` : null };
  }
  return fetchFallbackPrices();
}

export function usePyth(intervalMs = 15000): PythState {
  const [state, setState] = useState<PythState>({ aapl: null, aaplx: null, error: null, fetchedAt: null, source: null });
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const s = await fetchPrices();
      setState((prev) => ({ ...s, ...emptyFallback(prev, s) }));
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, intervalMs);
    return () => clearInterval(t);
  }, [load, intervalMs]);

  return state;
}

// keep last good quote visible if a poll fails (avoid UI flicker)
function emptyFallback(
  prev: PythState,
  s: PythState
): Partial<PythState> {
  if (s.error && !s.aapl && !s.aaplx) {
    return { aapl: prev.aapl, aaplx: prev.aaplx, source: prev.source, session: prev.session };
  }
  return {};
}
