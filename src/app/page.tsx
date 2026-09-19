"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { fetchVaultState, toUi, dpsUi, VaultAccount } from "@/lib/program";

function fmtTime(sec: number | null): string {
  if (sec === null) return "—";
  try {
    return new Date(sec * 1000).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

export default function Home() {
  const { connection } = useConnection();
  const [vault, setVault] = useState<VaultAccount | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [updated, setUpdated] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const v = await fetchVaultState(connection);
      if (v) {
        setVault(v.vault as VaultAccount);
        setUpdated(new Date().toLocaleTimeString());
      }
    } catch {
      /* keep last known state; retry on next tick */
    } finally {
      setLoaded(true);
    }
  }, [connection]);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  const v = vault as VaultAccount | null;
  const shares = v ? toUi(v.totalShares, 8) : null;
  const xstock = v ? toUi(v.totalXstock, 8) : null;
  const dps = v ? dpsUi(v.dividendsPerShare, v.totalShares) : null;
  const distributed = v ? toUi(v.totalDividendsDistributed, 2) : null;
  const lastTs = v ? fmtTime(Number(v.lastDividendTs.toString())) : null;

  return (
    <div className="wrap">
      {/* ============ hero ============ */}
      <section className="pt-16 sm:pt-24">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-2">
          <span className="font-medium">Vault No. 001</span>
          <span className="text-line-2" aria-hidden="true">·</span>
          <span>Solana mainnet</span>
          <span className="text-line-2" aria-hidden="true">·</span>
          <span>AAPLx <span aria-hidden="true">→</span> USDC</span>
          <span className="live ml-auto">
            <span className="live__dot" aria-hidden="true" />
            Live on chain
          </span>
        </div>

        <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <h1 className="max-w-[15ch] text-[44px] leading-[1.04] sm:text-[58px]">
              Apple&rsquo;s dividends, streamed the moment they pay.
            </h1>
            <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-ink-2">
              A non-custodial vault for tokenized Apple stock. Deposit{" "}
              <span className="font-semibold text-ink">AAPLx</span> — 1:1 backed
              by real Apple shares — and every dividend accrues to your
              position in <span className="font-semibold text-ink">USDC</span>{" "}
              as it lands. Claim it any time; no quarterly wait.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 lg:col-span-5 lg:justify-end">
            <Link href="/deposit" className="btn btn--primary btn--lg">
              Deposit AAPLx <span className="arrow" aria-hidden="true">→</span>
            </Link>
            <Link href="/dashboard" className="btn btn--secondary btn--lg">
              My position
            </Link>
          </div>
        </div>
      </section>

      {/* ============ live ledger ============ */}
      <section className="mt-16 sm:mt-24" aria-label="Live vault ledger">
        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
            <h2 className="text-base font-semibold">Vault ledger</h2>
            <div className="flex items-center gap-3 text-xs text-ink-3">
              <span className="live">
                <span className="live__dot" aria-hidden="true" />
                Live
              </span>
              {updated && <span>updated {updated}</span>}
            </div>
          </div>

          <div className="grid gap-x-10 px-6 py-2 sm:grid-cols-2">
            <StatRow k="Shares outstanding" value={shares} unit="AAPLx" />
            <StatRow k="AAPLx held in vault" value={xstock} unit="AAPLx" />
            <StatRow k="Dividends per share" value={dps} unit="USDC" accent />
            <StatRow k="USDC distributed to date" value={distributed} unit="USDC" />
            <div className="row sm:col-span-2">
              <span className="k">Last dividend triggered</span>
              <span className="v">{lastTs ?? <Skeleton w="140px" />}</span>
            </div>
          </div>

          <div className="border-t border-line px-6 py-3 text-xs text-ink-3">
            {loaded && !vault
              ? "Could not read the vault. Check your connection and try again."
              : "Read from the deployed program and refreshed every 15 seconds."}
          </div>
        </div>
      </section>

      {/* ============ how it works ============ */}
      <section className="mt-20 sm:mt-28" aria-label="How it works">
        <h2 className="text-3xl sm:text-4xl">How it works</h2>
        <p className="mt-3 max-w-[52ch] text-ink-2">
          Your position is a program-derived account you control. The vault
          only ever moves what you put in, plus the dividends it pays out.
        </p>

        <div className="mt-8">
          <Step
            n="01"
            t="Deposit"
            d="Send AAPLx to the vault. It is minted for you 1:1 as shares — the vault holds the tokens, you hold the shares."
          />
          <Step
            n="02"
            t="Dividend accrues"
            d="When Apple pays, the vault converts it to USDC and applies it pro-rata across every share. Your dividends per share rise the same second."
          />
          <Step
            n="03"
            t="Claim or compound"
            d="Take your accrued USDC any time, or leave it in. When you withdraw, you are paid out first, then your AAPLx back, share for share."
          />
        </div>
      </section>

      {/* ============ close ============ */}
      <section className="mt-20 border-t border-line pt-12 sm:mt-28">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-3xl sm:text-4xl">Put your shares to work.</h2>
          <Link href="/deposit" className="btn btn--primary btn--lg">
            Start a position <span className="arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

function StatRow({
  k,
  value,
  unit,
  accent,
}: {
  k: string;
  value: string | null;
  unit: string;
  accent?: boolean;
}) {
  return (
    <div className="row">
      <span className="k">{k}</span>
      <span className={`v ${accent ? "v--accent" : ""}`}>
        {value === null ? (
          <Skeleton w="90px" />
        ) : (
          <>
            {value} <span className="stat-unit">{unit}</span>
          </>
        )}
      </span>
    </div>
  );
}

function Step({ n, t, d }: { n: string; t: string; d: string }) {
  return (
    <div className="grid grid-cols-[3rem_1fr] gap-6 border-t border-line py-6 first:border-t-0 sm:grid-cols-[4rem_1fr] sm:gap-10">
      <span className="mono text-sm font-medium text-ink-3 pt-1.5" aria-hidden="true">
        {n}
      </span>
      <div>
        <h3 className="text-xl font-semibold">{t}</h3>
        <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-ink-2">
          {d}
        </p>
      </div>
    </div>
  );
}

function Skeleton({ w }: { w: string }) {
  return <span className="skel inline-block align-middle" style={{ width: w, height: 14 }} />;
}
