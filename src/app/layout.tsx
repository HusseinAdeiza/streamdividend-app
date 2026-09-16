import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { Nav } from "@/components/nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "StreamDividend — Tokenized stock dividends, streamed per-second",
  description:
    "Deposit tokenized stocks, earn pro-rata dividends streamed continuously in USDC on Solana.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Nav />
          <main className="min-h-screen">{children}</main>
        </Providers>
      </body>
    </html>
  );
}