"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { fetchVaultState, toUi, VaultAccount } from "@/lib/program";

const fmtTime = (sec: number | null) => {
  if (sec === null) return "—";
  try {
    return new Date(sec * 1000).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
};

export default function Home() {
  const { connection } = useConnection();
  const [vault, setVault] = useState<VaultAccount | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const v = await fetchVaultState(connection);
      if (v) setVault(v.vault as VaultAccount);
    } catch {
      /* leave empty; retry on next tick */
    } finally {
      setLoaded(true);
    }
  }, [connection]);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  const totalShares = vault ? toUi(vault.totalShares, 8) : "—";
  const totalXstock = vault ? toUi(vault.totalXstock, 8) : "—";
  const dps = vault ? toUi(vault.dividendsPerShare, 6) : "—";
  const distributed = vault ? toUi(vault.totalDividendsDistributed, 2) : "—";
  const lastTs = vault ? fmtTime(Number(vault.lastDividendTs.toString())) : "—";

  return (
    <div className="mx-auto max-w-6xl px-5">
      {/* ============ masthead ============ */}
      <section className="pt-14 sm:pt-20">
        <div className="reveal flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="label">Vault No. 001</span>
          <span className="label">Solana · Mainnet</span>
          <span className="label">AAPLx → USDC</span>
          <span className="live ml-auto">
            <span className="live__dot" /> live on chain
          </span>
        </div>

        <h1
          className="display mt-10 max-w-[16ch] text-[13.5vw] leading-[0.95] sm:text-[8.5vw] lg:text-[92px]"
        >
          Dividends,
          <br />
          <em>streamed</em> the
          <br />
          moment they pay.
        </h1>

        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-8">
          <p className="max-w-md text-[17px] leading-relaxed text-[#57503f] lg:col-span-5 lg:col-start-2">
            StreamDividend is a vault that holds tokenized Apple stock —{" "}
            <span className="text-[#191509]">AAPLx</span>, 1:1 backed by real
            Apple shares. Every dividend Apple pays lands in the vault and
            accrues to your shares, claimable in{" "}
            <span className="text-[#8f371d]">USDC</span> whenever you like.
            No quarterly wait.
          </p>
          <div className="flex flex-wrap items-center gap-4 lg:col-span-5 lg:col-start-8 lg:justify-end">
            <Link href="/deposit" className="btn btn--primary">
              Deposit AAPLx <span className="arrow">→</span>
            </Link>
            <Link href="/dashboard" className="btn btn--ghost">
              My position
            </Link>
          </div>
        </div>
      </section>

      {/* ============ live ledger ============ */}
      <section className="mt-16 sm:mt-24" aria-label="Live vault ledger">
        <div className="stream mb-10" aria-hidden="true" />
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <span className="label">Live from the chain</span>
            <h2 className="display mt-3 text-3xl">The vault ledger</h2>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#57503f]">
              Read straight from the deployed program — refreshed as the vault
              moves. This is the real account, not a mock.
            </p>
          </div>

          <div className="panel p-6 sm:p-8 lg:col-span-8">
            <div className="grid gap-x-10 sm:grid-cols-2">
              <Row k="Shares outstanding" v={`${totalShares} AAPLx`} />
              <Row k="xStock held in vault" v={`${totalXstock} AAPLx`} />
              <Row k="Dividends per share" v={`${dps} USDC`} accent />
              <Row k="USDC distributed to date" v={`${distributed} USDC`} />
              <Row k="Last dividend triggered" v={lastTs} wide />
            </div>
            {!loaded && (
              <p className="mono mt-4 text-xs text-[#8a826d]">
                reading mainnet…
              </p>
            )}
            {loaded && !vault && (
              <p className="mono mt-4 text-xs text-[#8f371d]">
                could not read the vault — check your connection
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ============ how it works ============ */}
      <section className="mt-20 sm:mt-28" aria-label="How it works">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <span className="label">The mechanics</span>
            <h2 className="display mt-3 text-3xl">
              Three moves,
              <br />
              <em>nothing held</em> in trust.
            </h2>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#57503f]">
              Your position is a PDA you control. The vault only ever moves
              what you put in, plus the dividends it pays out.
            </p>
          </div>

          <div className="lg:col-span-8">
            <Step n="01" t="Deposit" d="Send AAPLx into the vault. It’s minted for you 1:1 as shares — the vault holds the tokens, you hold the shares." />
            <Step n="02" t="Dividend lands" d="When Apple’s dividend hits the vault, it’s converted to USDC and applied pro-rata across every share. Your DPS rises the same second." />
            <Step n="03" t="Claim or compound" d="Take your accrued USDC any time, or leave it and withdraw later — paid out first, share-for-share, no dust left behind." />
          </div>
        </div>
      </section>

      {/* ============ close ============ */}
      <section className="mt-20 border-t-2 border-[#191509] pt-10 sm:mt-28">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="display max-w-[18ch] text-4xl sm:text-5xl">
            Put your shares to <em>work</em>.
          </h2>
          <Link href="/deposit" className="btn btn--ox">
            Start a position <span className="arrow">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

function Row({
  k,
  v,
  accent,
  wide,
}: {
  k: string;
  v: string;
  accent?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={`ledger-row ${wide ? "sm:col-span-2" : ""}`}>
      <span className="k">{k}</span>
      <span className={`v ${accent ? "text-[#1c5a43] font-medium" : ""}`}>
        {v}
      </span>
    </div>
  );
}

function Step({ n, t, d }: { n: string; t: string; d: string }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-5 border-t border-[#d9d1bd] py-6 sm:gap-10">
      <span className="display text-4xl text-[#c7bda3] sm:text-5xl" aria-hidden="true">
        {n}
      </span>
      <div>
        <h3 className="display text-2xl">{t}</h3>
        <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-[#57503f]">
          {d}
        </p>
      </div>
    </div>
  );
}
