# StreamDividend — dividend streams for tokenized stocks on Solana

> Hold tokenized Apple stock (AAPLx) and receive its **real dividend income in
> USDC, streamed pro-rata the moment it lands on-chain** — non-custodial,
> mainnet-live.

**[Live demo](https://husseinadeiza.github.io/streamdividend-app/)** · **[Pitch video](https://husseinadeiza.github.io/streamdividend-app/videos/StreamDividend_Pitch.mp4)** · **[Technical video](https://husseinadeiza.github.io/streamdividend-app/videos/StreamDividend_TechKnowHow.mp4)** · **[Program repo (Anchor/Rust)](https://github.com/HusseinAdeiza/streamdividend)** · **[Program on explorer](https://solscan.io/account/LuTgK5iC7MvcnWGeJTsXpZH6bHZ4Cf95m333U8ed9kA)**

`Next.js 14` `TypeScript` `Phantom / Solflare wallet adapter` `Pyth Lazer (live equity feeds)` `Solana mainnet-beta`

Frontend for the **[StreamDividend program](https://github.com/HusseinAdeiza/streamdividend)** — built for [Stocklana](https://hackathons.solana.com/hackathons/stocklana) (Pyth Network track).

---

## Try it in 90 seconds (judge path)

1. Open the **[live demo](https://husseinadeiza.github.io/streamdividend-app/)** and connect Phantom or Solflare (mainnet).
2. The dashboard streams **live AAPL / AAPLx prices via Pyth Lazer** and reads the **real on-chain vault** (shares, USDC pool, dividends-per-share) straight from the deployed program.
3. No wallet handy? Watch the **[technical video](https://husseinadeiza.github.io/streamdividend-app/videos/StreamDividend_TechKnowHow.mp4)** — a connected-wallet click-through of a **real, finalized mainnet deposit**.

## What it does
- **Deposit** AAPLx → minted 1:1 into vault shares.
- **Dividend accrues** → the vault applies Apple's real dividend pro-rata across
  every share; your "dividends per share" rises in that same second.
- **Claim or compound** → take your accrued USDC any time, or leave it in.
- **Withdraw** → paid out first, then your AAPLx back share-for-share.

Your position is a program-derived account you control — non-custodial.

## Program (Solana mainnet)
- Program ID: `LuTgK5iC7MvcnWGeJTsXpZH6bHZ4Cf95m333U8ed9kA`
- Vault: `2vsxDXuanJxrWtBzhun6yaCidHZxVNdFEobtAC3CKwM2`
- Token: AAPLx (Token-2022) `XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp`
- Dividend: USDC (Token-v3) `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`

## Pyth Network integration
The dashboard streams **real-time AAPL / AAPLx prices via Pyth Lazer** — live
position valuation, payout context against Apple's actual dividend rate, and
feed-health telemetry. See `src/components/pyth-panel.tsx` and `src/lib/pyth.ts`.
`scripts/pyth-check.mjs` verifies the feed entitlement (prints status + prices
only; the token is a build-time env var, never committed).

## Security
Audited adversarially before demo: two serious attack paths were found and
fixed (a dividend-pool drain via a mint swap in `withdraw`, and a deposit
diversion via an attacker-controlled token account) plus a dust-trigger
footgun. The live binary is the fixed build, verified byte-identical on-chain.
Full record in the [program repo](https://github.com/HusseinAdeiza/streamdividend/blob/main/AUDIT.md).

## Dev
```bash
npm install
npm run build      # static export -> out/
npx serve@latest out -l 3010
# open http://localhost:3010/streamdividend-app/
```
Connect with Phantom or Solflare (mainnet) to use the vault.

> Security note: the optional file-backed demo signer adapter is gated behind
> `NEXT_PUBLIC_DEMO_WALLET` at build time and is never embedded in the public
> static deploy (route `Connect → Demo wallet (local keypair)` only appears
> when that env secret is explicitly provided). The published site exposes only
> the real Phantom/Solflare adapters.
