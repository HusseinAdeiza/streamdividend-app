"use client";

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
} from "@solana/spl-token";
import { AnchorProvider } from "@coral-xyz/anchor";
import { getProgram, vaultPda, userStatePda, toBase, TOKEN_2022 } from "./program";
import { VAULT_AUTHORITY, TOKEN_PROGRAM_ID } from "./constants";

export const AUTH = new PublicKey(VAULT_AUTHORITY);
const TOKEN_PROG = new PublicKey(TOKEN_PROGRAM_ID);

// Build an AnchorProvider from a wallet adapter's signer.
export function makeProvider(
  connection: Connection,
  publicKey: PublicKey,
  signTx: (tx: Transaction) => Promise<Transaction>
): AnchorProvider {
  const wallet = {
    publicKey,
    signTransaction: signTx,
    signAllTransactions: (txs: Transaction[]) => Promise.all(txs.map(signTx)),
  };
  return new AnchorProvider(connection, wallet as any, {
    preflightCommitment: "confirmed",
    commitment: "confirmed",
  });
}

export type TxResult = { sig: string };

// Token program for a mint (v3 vs 2022).
export function tokenProgramFor(mint: PublicKey): PublicKey {
  return isToken2022Mint(mint) ? TOKEN_2022 : TOKEN_PROG;
}

// Heuristic: on mainnet, known xStock mints are Token-2022; USDC is v3.
// Deterministic for the mints we deploy against.
const KNOWN_2022 = new Set(["XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp"]);
export function isToken2022Mint(mint: PublicKey): boolean {
  return KNOWN_2022.has(mint.toBase58());
}

// Ensure the owner's ATA for a mint exists (idempotent ATA creation).
export function ataCreateIx(
  owner: PublicKey,
  mint: PublicKey,
  payer: PublicKey,
  tokenProgram: PublicKey = TOKEN_PROG
) {
  const ata = getAssociatedTokenAddressSync(mint, owner, true, tokenProgram);
  return createAssociatedTokenAccountIdempotentInstruction(
    payer,
    ata,
    owner,
    mint,
    tokenProgram,
    new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
  );
}

/// Step 1: create the vault PDA.
export async function txInitialize(
  provider: AnchorProvider,
  xstockMint: PublicKey,
  dividendMint: PublicKey
): Promise<TxResult> {
  const program = getProgram(provider);
  const [vaultKey] = vaultPda(AUTH);
  const tx = await program.methods
    .initialize()
    .accounts({
      vault: vaultKey,
      xstockMint,
      dividendMint,
      authority: AUTH,
      systemProgram: SystemProgram.programId,
    })
    .transaction();
  const sig = await provider.sendAndConfirm(tx, [], { commitment: "confirmed" });
  return { sig };
}

// Create the vault's two token ATAs (xStock + USDC), idempotent.
export async function txCreateVaultTokenAccounts(
  provider: AnchorProvider,
  xstockMint: PublicKey,
  dividendMint: PublicKey
): Promise<TxResult> {
  const [vaultKey] = vaultPda(AUTH);
  const tx = new Transaction();
  tx.add(
    ataCreateIx(vaultKey, xstockMint, provider.wallet.publicKey, tokenProgramFor(xstockMint)),
    ataCreateIx(vaultKey, dividendMint, provider.wallet.publicKey, TOKEN_PROG)
  );
  const sig = await provider.sendAndConfirm(tx, [], { commitment: "confirmed" });
  return { sig };
}

export function vaultXstockAta(vault: PublicKey, xstockMint: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(xstockMint, vault, true, tokenProgramFor(xstockMint));
}
export function vaultDividendAta(vault: PublicKey, dividendMint: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(dividendMint, vault, true, TOKEN_PROG);
}

/// Deposit xStock from the user's ATA into the vault; user receives pro-rata shares.
export async function txDeposit(
  provider: AnchorProvider,
  xstockMint: PublicKey,
  userXstockAta: PublicKey,
  amount: number,
  amountDecimals: number
): Promise<TxResult> {
  const program = getProgram(provider);
  const [vaultKey] = vaultPda(AUTH);
  const [usKey] = userStatePda(vaultKey, provider.wallet.publicKey);
  const tx = await program.methods
    .deposit(toBase(amount, amountDecimals))
    .accounts({
      vault: vaultKey,
      userState: usKey,
      userXstock: userXstockAta,
      vaultXstock: vaultXstockAta(vaultKey, xstockMint),
      xstockMint,
      user: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
      tokenProgram: tokenProgramFor(xstockMint),
    })
    .transaction();
  const sig = await provider.sendAndConfirm(tx, [], { commitment: "confirmed" });
  return { sig };
}

/// Withdraw `shares` of xStock back to the user; accrued USDC is paid first.
export async function txWithdraw(
  provider: AnchorProvider,
  xstockMint: PublicKey,
  dividendMint: PublicKey,
  userXstockAta: PublicKey,
  userDividendAta: PublicKey,
  shares: number,
  shareDecimals: number
): Promise<TxResult> {
  const program = getProgram(provider);
  const [vaultKey] = vaultPda(AUTH);
  const [usKey] = userStatePda(vaultKey, provider.wallet.publicKey);
  const tx = await program.methods
    .withdraw(toBase(shares, shareDecimals))
    .accounts({
      vault: vaultKey,
      userState: usKey,
      userXstock: userXstockAta,
      vaultXstock: vaultXstockAta(vaultKey, xstockMint),
      userDividend: userDividendAta,
      vaultDividend: vaultDividendAta(vaultKey, dividendMint),
      xstockMint,
      dividendMint,
      user: provider.wallet.publicKey,
      tokenProgram: tokenProgramFor(xstockMint),
      usdcTokenProgram: TOKEN_PROG,
    })
    .transaction();
  const sig = await provider.sendAndConfirm(tx, [], { commitment: "confirmed" });
  return { sig };
}

/// Claim accrued dividends in USDC.
export async function txClaim(
  provider: AnchorProvider,
  dividendMint: PublicKey,
  userDividendAta: PublicKey
): Promise<TxResult> {
  const program = getProgram(provider);
  const [vaultKey] = vaultPda(AUTH);
  const [usKey] = userStatePda(vaultKey, provider.wallet.publicKey);
  const tx = await program.methods
    .claimDividend()
    .accounts({
      vault: vaultKey,
      userState: usKey,
      userDividend: userDividendAta,
      vaultDividend: vaultDividendAta(vaultKey, dividendMint),
      dividendMint,
      user: provider.wallet.publicKey,
      tokenProgram: TOKEN_PROG,
    })
    .transaction();
  const sig = await provider.sendAndConfirm(tx, [], { commitment: "confirmed" });
  return { sig };
}

// Admin-only: fund the vault's dividend pool with USDC + update dividendsPerShare.
export async function txTriggerDividend(
  provider: AnchorProvider,
  dividendMint: PublicKey,
  adminDividendAta: PublicKey,
  amount: number
): Promise<TxResult> {
  const program = getProgram(provider);
  const [vaultKey] = vaultPda(AUTH);
  const tx = await program.methods
    .triggerDividend(toBase(amount, 6))
    .accounts({
      vault: vaultKey,
      authority: AUTH,
      adminDividend: adminDividendAta,
      vaultDividend: vaultDividendAta(vaultKey, dividendMint),
      dividendMint,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROG,
    })
    .transaction();
  const sig = await provider.sendAndConfirm(tx, [], { commitment: "confirmed" });
  return { sig };
}
