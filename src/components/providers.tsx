"use client";

import { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { RPC_URL } from "@/lib/constants";
import { KeypairWalletAdapter } from "@/lib/keypair-wallet";

require("@solana/wallet-adapter-react-ui/styles.css");

export function Providers({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => RPC_URL, []);

  const wallets = useMemo(() => {
    const list: any[] = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];
    // Real keypair-backed signer, ONLY when the demo build injects the secret.
    // The vault is authorized by /root/.config/solana/id.json (deployer = the
    // same wallet that holds the demo AAPLx + USDC). Secret stays out of git
    // and out of any static build that doesn't set NEXT_PUBLIC_DEMO_WALLET.
    if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_DEMO_WALLET) {
      try {
        const secretKey = JSON.parse(process.env.NEXT_PUBLIC_DEMO_WALLET);
        if (Array.isArray(secretKey) && secretKey.length === 64) {
          list.push(new KeypairWalletAdapter({ secretKey, network }));
          console.info("[demo] keypair wallet adapter enabled");
        }
      } catch (e) { console.warn("[demo] bad demo wallet secret", e); }
    }
    return list;
  }, [network]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}