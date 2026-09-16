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
      <div className="mx-auto max-w-6xl px-5 py-24">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <span className="label">Your position</span>
            <h1 className="display mt-3 text-4xl">
              Connect to
              <br />
              read your <em>shares</em>.
            </h1>
          </div>
          <div className="panel flex flex-col justify-center gap-4 p-8 lg:col-span-8">
            <p className="max-w-md text-[15px] leading-relaxed text-[#57503f]">
              Your position lives in a program-derived account owned by your
              wallet — nothing here is custodial. Sign in with Phantom or
              Solflare to see your shares and accrued dividends.
            </p>
            <p className="mono text-xs text-[#8a826d]">
              Use the wallet button, top right.
            </p>
            <Link href="/deposit" className="btn btn--ghost">
              How deposit works <span className="arrow">→</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const shares = userState ? toUi(userState.shares, 6) : "0";
  const earned = vault && userState ? toUi(earnedAmount(userState, vault), 6) : "0.000000";
  const totalDist = vault ? toUi(vault.totalDividendsDistributed, 6) : "0";
  const dps = vault ? toUi(vault.dividendsPerShare, 6) : "0";
  const canClaim = Number(earned) > 0.000001;
  const canWithdraw = userState && Number(userState.shares.toString()) > 0;

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="label">Your position</span>
          <h1 className="display mt-2 text-4xl sm:text-5xl">
            {wallet.publicKey
              ? `${wallet.publicKey.toBase58().slice(0, 4)}…${wallet.publicKey.toBase58().slice(-4)}`
              : ""}
          </h1>
        </div>
        <span className="live">
          <span className="live__dot" /> live · 5s
        </span>
      </div>

      <div className="stream my-10" aria-hidden="true" />

      <div className="grid gap-8 lg:grid-cols-12">
        {/* earned — the one number that matters */}
        <div className="lg:col-span-7">
          <span className="label label--ink">Accrued to your shares</span>
          <div className="mt-4 flex items-end gap-3">
            <span className="money money--ox text-[72px] sm:text-[96px]">
              {earned}
            </span>
            <span className="mono mb-3 text-sm text-[#8a826d]">USDC</span>
          </div>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[#57503f]">
            Accrues the instant the vault triggers a dividend. Claim it and
            it settles to your USDC token account on mainnet.
          </p>

          <div className="mt-8 grid gap-x-10 sm:grid-cols-2">
            <div className="ledger-row">
              <span className="k">Your shares</span>
              <span className="v">{shares} AAPLx</span>
            </div>
            <div className="ledger-row">
              <span className="k">Dividends / share</span>
              <span className="v">{dps} USDC</span>
            </div>
            <div className="ledger-row">
              <span className="k">Distributed to date</span>
              <span className="v">{totalDist} USDC</span>
            </div>
            <div className="ledger-row">
              <span className="k">Status</span>
              <span className="v">
                {canClaim ? "claimable" : "accruing"}
              </span>
            </div>
          </div>
        </div>

        {/* action rail */}
        <div className="lg:col-span-5">
          <div className="panel flex flex-col gap-3 p-6">
            <span className="label mb-1">Actions</span>
            <button
              onClick={onClaim}
              disabled={busy || !canClaim}
              className="btn btn--primary w-full"
            >
              {busy ? "Working…" : `Claim ${canClaim ? earned : ""} USDC`.trim()}
            </button>
            <button
              onClick={onWithdraw}
              disabled={busy || !canWithdraw}
              className="btn btn--ox w-full"
            >
              Withdraw all AAPLx
            </button>
            <p className="mono text-[11px] leading-relaxed text-[#8a826d]">
              Withdraw pays out your accrued USDC first, then returns your
              AAPLx share-for-share.
            </p>
          </div>

          {sig && (
            <div className="receipt mt-4">
              <span>✓ confirmed</span>
              <a
                href={`https://solscan.io/tx/${sig}`}
                target="_blank"
                rel="noreferrer"
              >
                {sig.slice(0, 8)}…{sig.slice(-6)}
              </a>
            </div>
          )}
          {err && <div className="err mt-4">{err}</div>}
        </div>
      </div>
    </div>
  );
}
