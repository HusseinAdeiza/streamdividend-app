// PDA + ATA helpers + program wiring shared across pages.
import { PublicKey, Connection } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Program, AnchorProvider, BN, Idl } from "@coral-xyz/anchor";
import { idl, PROGRAM_ID, VAULT_AUTHORITY, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, FALLBACK_RPC } from "./constants";

const PROGRAM = new PublicKey(PROGRAM_ID);

// Never let a slow / rate-limited RPC hang the UI.
function withTimeout<T>(p: Promise<T>, ms: number, label = "rpc"): T {
  return Promise.race([
    p,
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error(`${label} timed out`)), ms)),
  ]) as T;
}

export function getProgram(provider: AnchorProvider): Program {
  const idlWithAddress = { ...(idl as any), address: PROGRAM_ID };
  return new Program(idlWithAddress as unknown as Idl, provider as any);
}

function makeReadOnlyProvider(connection: Connection) {
  return new AnchorProvider(connection, { publicKey: null } as any, { commitment: "confirmed" });
}

// Read-only fetch of the vault account (no wallet needed). Tries the given
// connection first, then falls back to the public endpoint if that one is
// rate-limited or down, so the ledger never sits on "reading mainnet…".
export async function fetchVaultState(connection: Connection, timeoutMs = 8000) {
  const [vaultKey] = vaultPda(new PublicKey(VAULT_AUTHORITY));
  const candidates: Connection[] = [connection];
  try {
    candidates.push(new Connection(FALLBACK_RPC, "confirmed"));
  } catch { /* ignore */ }

  let lastErr: unknown;
  for (const conn of candidates) {
    try {
      const provider = makeReadOnlyProvider(conn);
      const program = getProgram(provider);
      const info = await withTimeout(conn.getAccountInfo(vaultKey, "confirmed"), timeoutMs);
      if (!info) return null;
      const vault: any = program.coder.accounts.decode("Vault", info.data);
      return { vaultKey, vault };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("vault read failed");
}

export async function fetchUserState(
  connection: Connection,
  vaultKey: PublicKey,
  user: PublicKey,
  timeoutMs = 8000
) {
  const [usKey] = userStatePda(vaultKey, user);
  const candidates: Connection[] = [connection];
  try {
    candidates.push(new Connection(FALLBACK_RPC, "confirmed"));
  } catch { /* ignore */ }

  let lastErr: unknown;
  for (const conn of candidates) {
    try {
      const provider = makeReadOnlyProvider(conn);
      const program = getProgram(provider);
      const info = await withTimeout(conn.getAccountInfo(usKey, "confirmed"), timeoutMs);
      if (!info) return null;
      const userState: any = program.coder.accounts.decode("UserState", info.data);
      return { userStateKey: usKey, userState };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("user state read failed");
}

export type { AnchorProvider as Provider };

export function findPda(seeds: (Buffer | Uint8Array | string)[], programId: PublicKey = PROGRAM): [PublicKey, number] {
  const seedBufs = seeds.map((s) => (typeof s === "string" ? Buffer.from(s) : Buffer.from(s)));
  return PublicKey.findProgramAddressSync(seedBufs, programId);
}

export function vaultPda(authority: PublicKey): [PublicKey, number] {
  return findPda(["vault", authority.toBuffer()]);
}
export function userStatePda(vault: PublicKey, user: PublicKey): [PublicKey, number] {
  return findPda(["user", vault.toBuffer(), user.toBuffer()]);
}

// --- Associated token accounts -------------------------------------------
// User + vault token accounts are ATAs (created client-side via the ATA
// program). The token program in the seeds depends on the mint's standard:
// Token-v3 (USDC) vs Token-2022 (AAPLx).
export function ataFor(mint: PublicKey, owner: PublicKey, tokenProgram: PublicKey = new PublicKey(TOKEN_PROGRAM_ID)): PublicKey {
  return getAssociatedTokenAddressSync(mint, owner, true, tokenProgram);
}

export const TOKEN_2022 = new PublicKey(TOKEN_2022_PROGRAM_ID);

export function toUi(amount: BN | number | bigint, decimals = 6): string {
  const n = typeof amount === "bigint" ? Number(amount) : Number(amount);
  return (n / 10 ** decimals).toFixed(decimals);
}
export function toBase(amount: number, decimals = 6): BN {
  return new BN(Math.round(amount * 10 ** decimals));
}

export type VaultAccount = {
  authority: PublicKey; xstockMint: PublicKey; dividendMint: PublicKey;
  totalShares: BN; totalXstock: BN; dividendPool: BN;
  totalDividendsDistributed: BN; dividendsPerShare: BN; lastDividendTs: BN;
  route: any; bump: number;
};
export type UserStateAccount = {
  user: PublicKey; vault: PublicKey; shares: BN;
  lastDividendsPerShare: BN; route: any; bump: number;
};

// earned = shares * (dps - last_dps) / 1e12
export function earnedAmount(userState: any, vault: VaultAccount): BN {
  if (userState.shares.isZero()) return new BN(0);
  const diff = vault.dividendsPerShare.sub(userState.lastDividendsPerShare);
  if (diff.lt(new BN(0))) return new BN(0);
  return userState.shares.mul(diff).div(new BN(1_000_000_000_000));
}
