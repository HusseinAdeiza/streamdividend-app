"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function Nav() {
  const { connected, publicKey } = useWallet();
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <a href="/" className="text-lg font-bold tracking-tight text-white">
            StreamDividend
          </a>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-zinc-400 sm:flex">
          <a href="/deposit" className="hover:text-white transition">Deposit</a>
          <a href="/dashboard" className="hover:text-white transition">Dashboard</a>
        </nav>
        <div className="flex items-center gap-3">
          {connected && publicKey ? (
            <span className="hidden font-mono text-xs text-zinc-500 sm:inline">
              {publicKey.toBase58().slice(0, 4)}…{publicKey.toBase58().slice(-4)}
            </span>
          ) : null}
          <WalletMultiButton className="!bg-emerald-500 !rounded-xl !px-4 !py-2 !text-sm !font-semibold hover:!bg-emerald-400" />
        </div>
      </div>
    </header>
  );
}