"use client";

import { useState, useCallback, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { txDeposit, makeProvider, tokenProgramFor } from "@/lib/actions";
import { fetchVaultState, ataFor } from "@/lib/program";

export default function DepositPage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [sig, setSig] = useState("");
  const [err, setErr] = useState("");
  const [xstockMint, setXstockMint] = useState<PublicKey | null>(null);

  // Load the vault's real xStock mint from on-chain state
  useEffect(() => {
    fetchVaultState(connection)
      .then((v) => {
        if (v) setXstockMint(new PublicKey(v.vault.xstockMint.toString()));
      })
      .catch(() => {});
  }, [connection]);

  const onDeposit = useCallback(async () => {
    if (!wallet.connected || !wallet.publicKey || !xstockMint) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setErr("Enter a valid amount");
    setBusy(true); setErr(""); setSig("");
    try {
      if (!wallet.signTransaction) return setErr("Wallet not ready");
      const provider = makeProvider(connection, wallet.publicKey, wallet.signTransaction);
      const userXstockAta = ataFor(xstockMint, wallet.publicKey, tokenProgramFor(xstockMint));
      const { sig } = await txDeposit(provider, xstockMint, userXstockAta, amt, 8);
      setSig(sig);
    } catch (e: any) {
      setErr(e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }, [wallet, connection, amount, xstockMint]);

  if (!xstockMint) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center text-zinc-400">
        Loading vault configuration…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="grad-text text-3xl font-bold mb-2">Deposit xStock</h1>
      <p className="text-zinc-400 mb-8">
        Deposit tokenized stock to start earning streamed dividends.
      </p>
      <label className="block text-sm text-zinc-400 mb-1">
        Amount (xStock)
      </label>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.0"
        className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-4 py-3 text-lg mb-4 focus:border-emerald-500 focus:outline-none"
      />
      <button
        onClick={onDeposit}
        disabled={busy || !wallet.connected}
        className="w-full rounded-lg bg-emerald-500 text-black font-semibold py-3 hover:bg-emerald-400 disabled:opacity-50"
      >
        {busy ? "Confirming…" : "Deposit"}
      </button>
      {sig && (
        <p className="mt-4 text-sm text-emerald-400">
          ✓ Tx:{" "}
          <a href={`https://solscan.io/tx/${sig}`} target="_blank" rel="noreferrer" className="underline">
            {sig.slice(0, 8)}…
          </a>
        </p>
      )}
      {err && <p className="mt-4 text-sm text-red-400">{err}</p>}
    </div>
  );
}
