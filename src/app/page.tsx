"use client";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-20">
      <section className="flex flex-col items-center text-center">
        <span className="mb-6 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-xs font-medium text-emerald-300">
          Solana · Stocklana Hackathon
        </span>
        <h1 className="max-w-3xl text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          Tokenized stocks,{" "}
          <span className="grad-text">dividends streamed per-second</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-zinc-400">
          Deposit AAPLx, TSLAx, or any tokenized stock into the vault. Every
          dividend accrues to you pro-rata the instant it&apos;s paid — and you
          claim it in USDC, anytime. No waiting for quarterly payouts.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="/deposit"
            className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-black transition hover:bg-emerald-400"
          >
            Start earning
          </a>
          <a
            href="/dashboard"
            className="rounded-xl border border-white/15 px-6 py-3 font-semibold text-zinc-200 transition hover:bg-white/5"
          >
            View dashboard
          </a>
        </div>
      </section>

      <section className="mt-24 grid gap-6 sm:grid-cols-3">
        {[
          {
            t: "Pro-rata & instant",
            d: "Shares minted 1:1 on deposit. Dividends accrue per share the moment they land — no dust, no waiting.",
          },
          {
            t: "Claim in USDC",
            d: "Earned yield settles to real USDC on mainnet. Stream to wallet or auto-compound (routing preference).",
          },
          {
            t: "Non-custodial",
            d: "Your position lives in a PDA you control. Withdraw any time — earned dividends pay out first.",
          },
        ].map((f) => (
          <div
            key={f.t}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
          >
            <h3 className="text-lg font-semibold text-white">{f.t}</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">{f.d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}