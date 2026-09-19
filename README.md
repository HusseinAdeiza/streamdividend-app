# StreamDividend — dividend streams for tokenized apple stock

Live: **https://husseinadeiza.github.io/streamdividend-app/**

A non-custodial Solana vault that streams the real dividend income of
tokenized stock (AAPLx, backed 1:1 by Apple shares) to holders in **USDC** the
moment it lands on-chain.

## What it does
- **Deposit** AAPLx → minted 1:1 into vault shares.
- **Dividend accrues** → the vault applies Apple's real dividend pro-rata across
  every share; your "dividends per share" rises the same second.
- **Claim or compound** → take your accrued USDC any time, or leave it in.
- **Withdraw** → paid out first, then your AAPLx back share-for-share.

Your position is a program-derived account you control — non-custodial.

## Program (Solana mainnet)
- Program ID: `LuTgK5iC7MvcnWGeJTsXpZH6bHZ4Cf95m333U8ed9kA`
- Vault: `2vsxDXuanJxrWtBzhun6yaCidHZxVNdFEobtAC3CKwM2`
- Token: AAPLx (Token-2022) `XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp`
- Dividend: USDC (Token-v3) `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`

## Security
Audited adversarially before demo: two serious attack paths were found and
fixed (a dividend-pool drain via a mint swap in `withdraw`, and a deposit
diversion via an attacker-controlled token account) plus a dust-trigger
footgun. The live binary is the fixed build, verified byte-identical on-chain.

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
