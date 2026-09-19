import {
  BaseSignerWalletAdapter,
  WalletAdapterNetwork,
  WalletReadyState,
  WalletName,
} from "@solana/wallet-adapter-base";
import { PublicKey, Keypair, Transaction, VersionedTransaction } from "@solana/web3.js";

export interface KeypairWalletAdapterConfig {
  secretKey: number[];
  network?: WalletAdapterNetwork;
}

// A real, non-custodial signer wallet backed by a Solana keypair.
// NOT a mock of any extension: it signs genuine transactions with a real
// private key. Exposed ONLY when the demo build sets NEXT_PUBLIC_DEMO_WALLET.
export class KeypairWalletAdapter extends BaseSignerWalletAdapter {
  readonly name = "Demo wallet (local keypair)" as WalletName<string>;
  readonly url = "https://solana.com";
  readonly icon = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiM5OTRjZmYiLz48L3N2Zz4=";
  private _keypair: Keypair;
  private _network: WalletAdapterNetwork;
  private _connecting = false;

  constructor(config: KeypairWalletAdapterConfig) {
    super();
    this._keypair = Keypair.fromSecretKey(Uint8Array.from(config.secretKey));
    this._network = config.network ?? WalletAdapterNetwork.Mainnet;
  }

  get publicKey(): PublicKey { return this._keypair.publicKey; }
  get readyState(): WalletReadyState { return WalletReadyState.Installed; }
  get connecting(): boolean { return this._connecting; }
  get connected(): boolean { return this._keypair.publicKey !== null; }
  get supportedTransactionVersions() { return { version: 0, isVersioned: true } as any; }

  async connect(): Promise<void> {
    try {
      this._connecting = true;
      this.emit("connect", this._keypair.publicKey);
    } finally {
      this._connecting = false;
    }
  }
  async disconnect(): Promise<void> { this.emit("disconnect"); }

  async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
    if (tx instanceof Transaction) tx.partialSign(this._keypair);
    else tx.sign([this._keypair]);
    return tx;
  }
  async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
    for (const t of txs) {
      if (t instanceof Transaction) t.partialSign(this._keypair);
      else t.sign([this._keypair]);
    }
    return txs;
  }
}