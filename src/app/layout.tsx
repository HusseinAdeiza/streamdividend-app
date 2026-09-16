import type { Metadata } from "next";
import { Fraunces, Instrument_Sans, Spline_Sans_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Nav } from "@/components/nav";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display-var",
  axes: ["opsz"],
  display: "swap",
});
const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans-var",
  display: "swap",
});
const spline = Spline_Sans_Mono({
  subsets: ["latin"],
  variable: "--font-mono-var",
  display: "swap",
});

export const metadata: Metadata = {
  title: "StreamDividend — dividend streams for tokenized stocks",
  description:
    "Deposit tokenized Apple stock (AAPLx) into the vault. Real dividends, paid in USDC, accrue to your shares the moment they're triggered.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${fraunces.variable} ${instrument.variable} ${spline.variable}`}
        style={
          {
            "--font-display": "var(--font-display-var)",
            "--font-sans": "var(--font-sans-var)",
            "--font-mono": "var(--font-mono-var)",
          } as React.CSSProperties
        }
      >
        <Providers>
          <Nav />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#191509]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="wordmark">
            Stream<span className="slash">/</span>Dividend
          </div>
          <p className="mt-2 max-w-sm text-sm text-[#57503f]">
            A dividend-streaming vault for tokenized equities. Built for the
            Stocklana hackathon — live on Solana mainnet.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <span className="label">On chain</span>
          <div className="mono text-xs text-[#57503f]">
            <a
              className="addr"
              href="https://solscan.io/account/LuTgK5iC7MvcnWGeJTsXpZH6bHZ4Cf95m333U8ed9kA"
              target="_blank"
              rel="noreferrer"
            >
              program · LuTgK5iC…8ed9kA
            </a>
          </div>
          <div className="mono text-xs text-[#57503f]">
            <a
              className="addr"
              href="https://github.com/HusseinAdeiza/streamdividend"
              target="_blank"
              rel="noreferrer"
            >
              github.com/HusseinAdeiza/streamdividend
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
