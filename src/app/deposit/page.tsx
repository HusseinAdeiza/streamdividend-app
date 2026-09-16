"use client";

import Link from "next/link";
import { useState, useCallback, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { txDeposit, makeProvider, tokenProgramFor } from "@/lib/actions";
import { fetchVaultState, ataFor, toUi } from "@/lib/program";

export default function DepositPage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [sig, setSig] = useState("");
  const [err, setErr] = useState("");
  const [xstockMint, setXstockMint] = useState<PublicKey | null>(null);
  const [totalShares, setTotalShares] = useState<string | null>(null);

  useEffect(() => {
    fetchVaultState(connection)
      .then((v) => {
        if (!v) return;
        setXstockMint(new PublicKey(v.vault.xstockMint.toString()));
        setTotalShares(toUi(v.vault.totalShares, 8));
      })
      .catch(() => {});
  }, [connection]);

  const onDeposit = useCallback(async () => {
    if (!wallet.connected || !wallet.publicKey || !xstockMint) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setErr("Enter a valid amount.");
    if (!wallet.signTransaction) return setErr("Wallet not ready.");
    setBusy(true);
    setErr("");
    setSig("");
    try {
      const provider = makeProvider(connection, wallet.publicKey, wallet.signTransaction);
      const userXstockAta = ataFor(xstockMint, wallet.publicKey, tokenProgramFor(xstockMint));
      const { sig } = await txDeposit(provider, xstockMint, userXstockAta, amt, 8);
      setSig(sig);
      setAmount("");
    } catch (e: any) {
      setErr(e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }, [wallet, connection, amount, xstockMint]);

  if (!xstockMint) {
    return (
      <div className="wrap py-24">
        <span className="eyebrow">Loading</span>
        <p className="mt-3 text-ink-2">Reading vault configuration from mainnet…</p>
      </div>
    );
  }

  const valid = parseFloat(amount) > 0;

  return (
    <div className="wrap py-12 sm:py-16">
      <div className="grid gap-12 lg:grid-cols-12">
        {/* context */}
        <div className="lg:col-span-5">
          <span className="eyebrow">Open a position</span>
          <h1 className="mt-2 text-4xl sm:text-5xl">
            Deposit AAPLx into the vault.
          </h1>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-ink-2">
            AAPLx is 1:1 backed by real Apple shares and pays its own dividends
            in USDC. What you deposit is minted for you 1:1 as shares and
            starts accruing immediately.
          </p>

          <div className="card card--pad mt-8">
            <div className="row">
              <span className="k">Mint</span>
              <span className="v">
                <a
                  className="addr"
                  href="https://solscan.io/token/XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp"
                  target="_blank"
                  rel="noreferrer"
                >
                  XsbEhL…RLJzJp
                </a>
              </span>
            </div>
            <div className="row">
              <span className="k">Standard</span>
              <span className="v">Token-2022 · 8 dec</span>
            </div>
            <div className="row">
              <span className="k">Shares outstanding</span>
              <span className="v">{totalShares ?? "—"}</span>
            </div>
          </div>
        </div>

        {/* action */}
        <div className="lg:col-span-7">
          <div className="card card--pad">
            <label htmlFor="amt" className="card__title">
              Amount · AAPLx
            </label>
            <input
              id="amt"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (err) setErr("");
              }}
              placeholder="0.0"
              className="field mt-3"
            />

            <button
              onClick={onDeposit}
              disabled={busy || !wallet.connected || !valid}
              className="btn btn--primary btn--block btn--lg mt-6"
            >
              {busy
                ? "Confirming…"
                : wallet.connected
                ? "Deposit AAPLx"
                : "Connect wallet to deposit"}
            </button>

            {!wallet.connected && (
              <p className="mt-4 text-sm text-ink-3">
                You&rsquo;ll be asked to sign with Phantom or Solflare.
              </p>
            )}

            {sig && (
              <div className="receipt mt-4">
                <span>Deposited</span>
                <a href={`https://solscan.io/tx/${sig}`} target="_blank" rel="noreferrer">
                  {sig.slice(0, 8)}…{sig.slice(-6)}
                </a>
              </div>
            )}
            {err && <div className="err mt-4">{err}</div>}
          </div>

          <Link
            href="/dashboard"
            className="mt-5 inline-block text-sm font-medium text-ink-2 transition hover:text-accent"
          >
            Already holding shares? View your position →
          </Link>
        </div>
      </div>
    </div>
  );
}
