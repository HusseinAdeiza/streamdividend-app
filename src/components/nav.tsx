"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function Nav() {
  const { connected, publicKey } = useWallet();
  const pathname = usePathname();

  return (
    <header className="masthead">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-3" aria-label="StreamDividend home">
          <span className="live" aria-hidden="true">
            <span className="live__dot" />
          </span>
          <span className="wordmark">
            Stream<span className="slash">/</span>Dividend
          </span>
        </Link>

        <nav className="hidden items-center gap-7 sm:flex" aria-label="Primary">
          <Link
            href="/"
            className="navlink"
            aria-current={pathname === "/" ? "page" : undefined}
          >
            Vault
          </Link>
          <Link
            href="/deposit"
            className="navlink"
            aria-current={pathname === "/deposit" ? "page" : undefined}
          >
            Deposit
          </Link>
          <Link
            href="/dashboard"
            className="navlink"
            aria-current={pathname === "/dashboard" ? "page" : undefined}
          >
            Position
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {connected && publicKey && (
            <span className="mono hidden text-xs text-[#8a826d] md:inline">
              {publicKey.toBase58().slice(0, 4)}…{publicKey.toBase58().slice(-4)}
            </span>
          )}
          <WalletMultiButton />
        </div>
      </div>

      {/* mobile nav row */}
      <nav
        className="flex gap-6 border-t border-[#d9d1bd] px-5 py-2.5 sm:hidden"
        aria-label="Primary mobile"
      >
        <Link href="/" className="navlink" aria-current={pathname === "/" ? "page" : undefined}>
          Vault
        </Link>
        <Link href="/deposit" className="navlink" aria-current={pathname === "/deposit" ? "page" : undefined}>
          Deposit
        </Link>
        <Link href="/dashboard" className="navlink" aria-current={pathname === "/dashboard" ? "page" : undefined}>
          Position
        </Link>
      </nav>
    </header>
  );
}
