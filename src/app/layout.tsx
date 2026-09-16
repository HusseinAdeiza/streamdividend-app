import type { Metadata } from "next";
import { Inter, Spline_Sans_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Nav } from "@/components/nav";
import "./globals.css";

const inter = Inter({
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
        className={`${inter.variable} ${spline.variable}`}
        style={
          {
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
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="logo">
            <span className="logo__mark" aria-hidden="true">
              S
            </span>
            StreamDividend
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-2">
            A dividend-streaming vault for tokenized equities. Deposit AAPLx,
            and Apple&rsquo;s dividends accrue to your position in USDC as
            they pay.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <span className="eyebrow">On chain</span>
          <div className="mono text-[13px] text-ink-2">
            <a
              className="addr"
              href="https://solscan.io/account/LuTgK5iC7MvcnWGeJTsXpZH6bHZ4Cf95m333U8ed9kA"
              target="_blank"
              rel="noreferrer"
            >
              Program LuTgK5iC…8ed9kA
            </a>
          </div>
          <div className="mono text-[13px] text-ink-2">
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
