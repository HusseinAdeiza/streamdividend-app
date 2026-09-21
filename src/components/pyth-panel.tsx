"use client";

import { usePyth, type PythQuote, type PythState } from "@/lib/pyth";

function fmtUsd(n: number, dp = 2): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

function ago(ms: number, now: number): string {
  const s = Math.max(0, Math.round((now - ms) / 1000));
  if (s < 2) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

// "Sep 18" from an ISO day string (YYYY-MM-DD), in the viewer's timezone label.
function dayLabel(isoDay: string): string {
  const d = new Date(`${isoDay}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return isoDay;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}

function todayDay(): string {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function PriceTile({
  label,
  sub,
  quote,
  accent,
  now,
  fallback,
  tradeDay,
}: {
  label: string;
  sub: string;
  quote: PythQuote | null;
  accent?: boolean;
  now: number;
  fallback: boolean;
  tradeDay?: string | null;
}) {
  // Honest freshness: during market hours show relative age; when the last
  // trade is from an earlier day, show that day instead of "79h ago".
  const isStale = !!(
    fallback &&
    tradeDay &&
    tradeDay !== todayDay() &&
    quote
  );
  return (
    <div className="pyth-tile">
      <div className="pyth-tile__head">
        <span className="eyebrow">{label}</span>
        <span className="mono pyth-tile__feed">{sub}</span>
      </div>
      {quote ? (
        <>
          <div className="pyth-price">
            <span className={`stat ${accent ? "stat--accent" : ""} tabular`}>
              ${fmtUsd(quote.price)}
            </span>
          </div>
          <div className="pyth-meta mono">
            {fallback ? (
              <span>public market data</span>
            ) : (
              <>
                <span>±{fmtUsd(quote.conf, quote.conf < 1 ? 4 : 2)}</span>
                <span aria-hidden="true">·</span>
                <span>{quote.pubs} publishers</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>{isStale ? `last trade ${dayLabel(tradeDay!)}` : ago(quote.at, now)}</span>
          </div>
        </>
      ) : (
        <>
          <div className="pyth-price">
            <span className="skel inline-block align-middle" style={{ width: 120, height: 40 }} />
          </div>
          <div className="pyth-meta mono">
            <span className="skel inline-block align-middle" style={{ width: 180, height: 12 }} />
          </div>
        </>
      )}
    </div>
  );
}

export function PythPanel({ state: injected }: { state?: PythState }) {
  const own = usePyth(15000);
  const { aapl, aaplx, error, fetchedAt, source, session } = injected ?? own;
  const now = Date.now();
  const isFallback = source === "fallback";

  // tracking basis: how far the tokenized stock sits from the real share, in bps
  const basisBps =
    aapl && aaplx && aapl.price > 0
      ? ((aaplx.price - aapl.price) / aapl.price) * 10000
      : null;

  return (
    <div className="card" role="region" aria-label="Live prices">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">Live prices</h2>
          <span className="eyebrow">
            {isFallback ? "Public market data" : "Pyth Network"}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-ink-3">
          {aapl || aaplx ? (
            <span className="live">
              <span className="live__dot" aria-hidden="true" />
              Live{isFallback ? " · fallback" : ""}
            </span>
          ) : (
            <span>connecting…</span>
          )}
          {fetchedAt && !error && <span>updated {ago(fetchedAt, now)}</span>}
        </div>
      </div>

      <div className="px-6 py-2">
        <div className="grid gap-px sm:grid-cols-2">
          <PriceTile
            label="Real Apple"
            sub={isFallback ? "NASDAQ last trade (CNBC)" : "Equity.US.AAPL/USD"}
            quote={aapl}
            now={now}
            fallback={isFallback}
            tradeDay={aapl?.tradeDay ?? null}
          />
          <PriceTile
            label="AAPLx (tokenized)"
            sub={isFallback ? "Backed xStock (CoinGecko)" : "Crypto.AAPLX/USD"}
            quote={aaplx}
            accent
            now={now}
            fallback={isFallback}
          />
        </div>

        {/* tracking surface: the token vs the real share */}
        {basisBps !== null ? (
          <div className="row">
            <span className="k">AAPLx vs real Apple</span>
            <span className={`v ${Math.abs(basisBps) < 25 ? "v--accent" : ""}`}>
              {basisBps >= 0 ? "+" : "−"}
              {fmtUsd(Math.abs(basisBps), 1)} bps
              <span className="v--note">
                {Math.abs(basisBps) < 25 ? "· tracking the real share" : "· basis to watch"}
              </span>
            </span>
          </div>
        ) : (
          <div className="row">
            <span className="k">AAPLx vs real Apple</span>
            <span className="v">
              <span className="skel inline-block align-middle" style={{ width: 120, height: 14 }} />
            </span>
          </div>
        )}
        {isFallback && session && (
          <div className="row">
            <span className="k">NASDAQ session</span>
            <span className="v v--note">{session.replaceAll("_", " ")}</span>
          </div>
        )}
      </div>

      <div className="border-t border-line px-6 py-3 text-xs text-ink-3">
        {isFallback ? (
          <>
            Live prices read from public market data (CNBC for AAPL, CoinGecko for
            the AAPLx xStock) and refreshed every 15 seconds. The primary Pyth Pro
            feed is wired and activates automatically once the
            <span className="mono"> Equity.US.AAPL</span>/<span className="mono">Crypto.AAPLX</span>{" "}
            grants are enabled on the API key.
          </>
        ) : error ? (
          <>Live feed unavailable — {error}. Showing last known prices.</>
        ) : (
          <>
            Streamed from Pyth Pro and refreshed every 15 seconds — the same
            oracle data behind the vault.
          </>
        )}
      </div>
    </div>
  );
}
