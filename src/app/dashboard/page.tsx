"use client";

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
    } catch {}
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
    if (!wallet.publicKey) return;
    setBusy(true); setErr(""); setSig("");
    try {
      const provider = makeP()!;
      const usdcMint = new PublicKey((vault as VaultAccount).dividendMint.toString());
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
    setBusy(true); setErr(""); setSig("");
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
      <div className="mx-auto max-w-md px-4 py-20 text-center text-zinc-400">
        Connect your wallet to view your position.
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
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="grad-text text-3xl font-bold mb-8">Your Position</h1>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Stat label="Your Shares" value={shares} unit="xStock" />
        <Stat label="Earned Dividend" value={earned} unit="USDC" accent />
        <Stat label="Total Distributed" value={totalDist} unit="USDC" />
        <Stat label="Dividends Per Share" value={dps} unit="USDC" />
      </div>
      <div className="flex flex-col gap-3">
        <button
          onClick={onClaim}
          disabled={busy || !canClaim}
          className="w-full rounded-lg bg-emerald-500 text-black font-semibold py-3 hover:bg-emerald-400 disabled:opacity-50"
        >
          {busy ? "Working…" : "Claim Dividend"}
        </button>
        <button
          onClick={onWithdraw}
          disabled={busy || !canWithdraw}
          className="w-full rounded-lg border border-white/15 text-zinc-200 font-semibold py-3 hover:bg-white/5 disabled:opacity-50"
        >
          Withdraw All xStock
        </button>
      </div>
      {sig && (
        <p className="mt-4 text-sm text-emerald-400">
          ✓{" "}
          <a href={`https://solscan.io/tx/${sig}`} target="_blank" rel="noreferrer" className="underline">
            {sig.slice(0, 8)}…
          </a>
        </p>
      )}
      {err && <p className="mt-4 text-sm text-red-400">{err}</p>}
    </div>
  );
}

function Stat({ label, value, unit, accent }: { label: string; value: string; unit: string; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
      <div className="text-xs text-zinc-500 mb-1">{label}</div>
      <div className={`text-xl font-bold ${accent ? "text-emerald-400" : "text-white"}`}>{value}</div>
      <div className="text-xs text-zinc-500">{unit}</div>
    </div>
  );
}
