"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  fetchVaultState,
  fetchUserState,
  earnedAmount,
  toUi,
  dpsUi,
  ataFor,
  VaultAccount,
  UserStateAccount,
} from "@/lib/program";
import { txClaim, txWithdraw, makeProvider, tokenProgramFor } from "@/lib/actions";

export default function DashboardPage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [vault, setVault] = useState<VaultAccount | null>(null);
  const [vaultKey, setVaultKey] = useState<PublicKey | null>(null);
  const [userState, setUserState] = useState<UserStateAccount | null>(null);
  const [xstockMint, setXstockMint] = useState<PublicKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [sig, setSig] = useState("");
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    if (!wallet.publicKey) return;
    try {
      const v = await fetchVaultState(connection);
      if (!v) return;
      setVault(v.vault as VaultAccount);
      setVaultKey(v.vaultKey);
      setXstockMint(new PublicKey(v.vault.xstockMint.toString()));
      const u = await fetchUserState(connection, v.vaultKey, wallet.publicKey);
      setUserState(u?.userState as UserStateAccount ?? null);
    } catch {
      /* keep last known state */
    }
  }, [wallet.publicKey, connection]);

  useEffect(() => {
    if (!wallet.connected) return;
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [wallet.connected, refresh]);

  const makeP = () => {
    if (!wallet.publicKey || !wallet.signTransaction) return null;
    return makeProvider(connection, wallet.publicKey, wallet.signTransaction);
  };

  const onClaim = useCallback(async () => {
    if (!wallet.publicKey || !vault) return;
    setBusy(true);
    setErr("");
    setSig("");
    try {
      const provider = makeP()!;
      const usdcMint = new PublicKey(vault.dividendMint.toString());
      const userDividendAta = ataFor(usdcMint, wallet.publicKey);
      const { sig } = await txClaim(provider, usdcMint, userDividendAta);
      setSig(sig);
      await refresh();
    } catch (e: any) {
      setErr(e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }, [wallet, connection, vault, refresh]);

  const onWithdraw = useCallback(async () => {
    if (!wallet.publicKey || !userState || !xstockMint || !vault) return;
    setBusy(true);
    setErr("");
    setSig("");
    try {
      const provider = makeP()!;
      const userXstockAta = ataFor(xstockMint, wallet.publicKey, tokenProgramFor(xstockMint));
      const usdcMint = new PublicKey(vault.dividendMint.toString());
      const userDividendAta = ataFor(usdcMint, wallet.publicKey);
      const allShares = Number(userState.shares.toString()) / 1e8;
      const { sig } = await txWithdraw(provider, xstockMint, usdcMint, userXstockAta, userDividendAta, allShares, 8);
      setSig(sig);
      await refresh();
    } catch (e: any) {
      setErr(e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }, [wallet, connection, userState, xstockMint, refresh]);

  if (!wallet.connected) {
    return (
      <div className="wrap py-20 sm:py-28">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <h1 className="text-4xl sm:text-5xl">
              Connect to read your position.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-2">
              Your position lives in a program-derived account owned by your
              wallet. Nothing here is custodial — connect to see your shares
              and accrued dividends.
            </p>
          </div>
          <div className="card card--pad lg:col-span-7">
            <p className="text-ink-2">
              Use the <span className="font-medium text-ink">Connect Wallet</span>{" "}
              button in the top right to continue.
            </p>
            <Link href="/deposit" className="btn btn--secondary mt-6">
              How deposit works <span className="arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const shares = userState ? toUi(userState.shares, 6) : "0";
  const earned = vault && userState ? toUi(earnedAmount(userState, vault), 6) : "0.000000";
  const dps = vault ? dpsUi(vault.dividendsPerShare, vault.totalShares) : "0";
  const canClaim = Number(earned) > 0.000001;
  const canWithdraw = !!userState && Number(userState.shares.toString()) > 0;
  const walletShort = wallet.publicKey
    ? `${wallet.publicKey.toBase58().slice(0, 4)}…${wallet.publicKey.toBase58().slice(-4)}`
    : "";

  return (
    <div className="wrap py-12 sm:py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="eyebrow">Your position</span>
          <h1 className="mt-1 text-3xl sm:text-4xl">{walletShort}</h1>
        </div>
        <span className="live">
          <span className="live__dot" aria-hidden="true" />
          Live · refreshes every 5s
        </span>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        {/* primary stat */}
        <div className="card card--pad lg:col-span-7">
          <span className="card__title">Accrued to your shares</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="stat text-6xl sm:text-7xl stat--accent tabular">
              {earned}
            </span>
            <span className="stat-unit">USDC</span>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-2">
            Accrues the instant the vault triggers a dividend. When you claim,
            it settles to your USDC token account on mainnet.
          </p>
        </div>

        {/* action panel */}
        <div className="card card--pad flex flex-col gap-3 lg:col-span-5">
          <span className="card__title">Actions</span>
          <button
            onClick={onClaim}
            disabled={busy || !canClaim}
            className="btn btn--primary btn--block"
          >
            {busy ? "Working…" : canClaim ? `Claim ${earned} USDC` : "Claim USDC"}
          </button>
          <button
            onClick={onWithdraw}
            disabled={busy || !canWithdraw}
            className="btn btn--secondary btn--block"
          >
            Withdraw all AAPLx
          </button>
          <p className="mt-1 text-xs leading-relaxed text-ink-3">
            Withdraw pays out your accrued USDC first, then returns your AAPLx
            share for share.
          </p>
        </div>

        {/* detail rows */}
        <div className="card card--pad lg:col-span-12">
          <div className="grid gap-x-10 sm:grid-cols-2">
            <Row k="Your shares" v={`${shares} AAPLx`} />
            <Row k="Dividends per share" v={`${dps} USDC`} />
            <Row
              k="Status"
              v={canClaim ? "Claimable now" : canWithdraw ? "Accruing" : "No position yet"}
              accent={canClaim}
            />
          </div>
        </div>
      </div>

      {sig && (
        <div className="receipt mt-4">
          <span>Confirmed</span>
          <a href={`https://solscan.io/tx/${sig}`} target="_blank" rel="noreferrer">
            {sig.slice(0, 8)}…{sig.slice(-6)}
          </a>
        </div>
      )}
      {err && <div className="err mt-4">{err}</div>}
    </div>
  );
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="row">
      <span className="k">{k}</span>
      <span className={`v ${accent ? "v--accent" : ""}`}>{v}</span>
    </div>
  );
}
