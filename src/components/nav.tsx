"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const links = [
  { href: "/", label: "Vault" },
  { href: "/deposit", label: "Deposit" },
  { href: "/dashboard", label: "Position" },
];

export function Nav() {
  const { connected, publicKey } = useWallet();
  const pathname = usePathname();

  return (
    <header className="masthead">
      <div className="wrap navbar">
        <Link href="/" className="logo" aria-label="StreamDividend home">
          <span className="logo__mark" aria-hidden="true">
            S
          </span>
          StreamDividend
        </Link>

        <nav className="hidden items-center gap-1 sm:flex" aria-label="Primary">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="navlink"
              aria-current={pathname === l.href ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {connected && publicKey && (
            <span className="mono hidden text-xs text-ink-3 md:inline">
              {publicKey.toBase58().slice(0, 4)}…
              {publicKey.toBase58().slice(-4)}
            </span>
          )}
          <WalletMultiButton />
        </div>
      </div>

      <nav
        className="flex gap-1 border-t border-line px-5 py-2 sm:hidden"
        aria-label="Primary mobile"
      >
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="navlink"
            aria-current={pathname === l.href ? "page" : undefined}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
