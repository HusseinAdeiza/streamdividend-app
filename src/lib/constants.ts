// StreamDividend on-chain constants
import idl from "./idl.json";

// The deployed program (same program ID on all clusters — PDA + declare_id)
export const PROGRAM_ID = "LuTgK5iC7MvcnWGeJTsXpZH6bHZ4Cf95m333U8ed9kA";
export const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
export const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
export const SYSTEM_PROGRAM_ID = "11111111111111111111111111111111";

// Real mainnet USDC (dividend token)
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// Live tokenized Apple stock — Backed/Kraken xStocks (Token-2022, 8 decimals).
// 1:1 backed by real Apple shares; pays real dividends in USDC.
// https://solscan.io/token/XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp
export const AAPLX_MINT = "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp";
export const AAPLX_DECIMALS = 8;

// The vault authority (deployer). The vault PDA is derived from this key.
// For the demo, this is the deployer wallet; users deposit into OUR vault.
export const VAULT_AUTHORITY = "4KTQiDUyvnkWyK7Vs4hnAp54UZecu3Vo1jku3JQ6kHWi";

// Vault PDAs / accounts (LIVE on mainnet — verified on-chain 2026-09-16):
// vault:          2vsxDXuanJxrWtBzhun6yaCidHZxVNdFEobtAC3CKwM2
// vault_xstock:   E4qLqRdxvv1HTAS7gePCq9JMaNhE1BpXh3WUEJjezpsk  (AAPLx, Token-2022)
// vault_dividend: 3khNwQmsAwXaeLZe4dWGtpEfs7FjQpjEqhPjZyeGydQg  (USDC, v3)

export const DEFAULT_RPC = "https://api.mainnet-beta.solana.com";
export const LOCAL_RPC = "http://localhost:8899";

// Mainnet by default; set NEXT_PUBLIC_RPC to override (e.g. local validator).
export const RPC_URL = process.env.NEXT_PUBLIC_RPC ?? DEFAULT_RPC;

export const PRECISION = 1_000_000_000_000; // 1e12

export { idl };
