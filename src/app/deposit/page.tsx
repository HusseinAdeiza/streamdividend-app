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
  const [totalShares, setTotalShares] = useState<string>("—");

  // Load the vault's real xStock mint + current shares from on-chain state
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
    if (!amt || amt <= 0) return setErr("Enter a valid amount");
    if (!wallet.signTransaction) return setErr("Wallet not ready");
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
      <div className="mx-auto max-w-6xl px-5 py-24">
        <span className="label">Loading</span>
        <p className="mono mt-4 text-sm text-[#8a826d]">
          reading vault configuration from mainnet…
        </p>
      </div>
    );
  }

  const valid = parseFloat(amount) > 0;

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <div className="grid gap-10 lg:grid-cols-12">
        {/* left: context */}
        <div className="lg:col-span-5">
          <span className="label">Open a position</span>
          <h1 className="display mt-3 text-4xl sm:text-5xl">
            Deposit
            <br />
            <em>AAPLx</em> into
            <br />
            the vault.
          </h1>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-[#57503f]">
            AAPLx is 1:1 backed by real Apple shares and pays its own
            dividends in USDC. What you deposit is minted for you 1:1 as
            shares and starts accruing immediately.
          </p>
          <div className="mt-8">
            <div className="ledger-row">
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
            <div className="ledger-row">
              <span className="k">Standard</span>
              <span className="v">Token-2022 · 8 dec</span>
            </div>
            <div className="ledger-row">
              <span className="k">Shares outstanding</span>
              <span className="v">{totalShares}</span>
            </div>
          </div>
        </div>

        {/* right: the action */}
        <div className="lg:col-span-7">
          <div className="panel p-6 sm:p-8">
            <label htmlFor="amt" className="label block">
              Amount · AAPLx
            </label>
            <div className="mt-3">
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
                className="field"
              />
            </div>

            <button
              onClick={onDeposit}
              disabled={busy || !wallet.connected || !valid}
              className="btn btn--primary mt-6 w-full"
            >
              {busy
                ? "Confirming…"
                : wallet.connected
                ? "Deposit AAPLx"
                : "Connect wallet to deposit"}
            </button>

            {!wallet.connected && (
              <p className="mono mt-4 text-xs text-[#8a826d]">
                You’ll be asked to sign with Phantom or Solflare.
              </p>
            )}

            {sig && (
              <div className="receipt mt-4">
                <span>✓ deposited</span>
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

          <Link
            href="/dashboard"
            className="mono mt-5 inline-block text-xs tracking-widest text-[#57503f] uppercase transition hover:text-[#1c5a43]"
          >
            Already holding shares? View your position →
          </Link>
        </div>
      </div>
    </div>
  );
}
