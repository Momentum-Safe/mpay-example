import { ISingleWallet } from '@msafe/mpay-sdk-sui';
import { SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';

export class LocalWallet implements ISingleWallet {
  private readonly kp: Ed25519Keypair;

  private readonly client: SuiClient;

  constructor(client: SuiClient, privateKey?: string) {
    this.client = client;
    this.kp = privateKey ? makeKeyPairFromPrivateKey(privateKey) : new Ed25519Keypair();
  }

  async address() {
    return this.kp.toSuiAddress();
  }

  async signAndSubmitTransaction(txb: TransactionBlock) {
    return this.client.signAndExecuteTransactionBlock({
      transactionBlock: txb,
      signer: this.kp,
      options: {
        showEffects: true,
        showObjectChanges: true,
        showEvents: true,
      },
    });
  }

  async inspect(txb: TransactionBlock) {
    return this.client.devInspectTransactionBlock({
      sender: await this.address(),
      transactionBlock: txb,
    });
  }
}

export function makeKeyPairFromPrivateKey(privateKey: string) {
  return Ed25519Keypair.fromSecretKey(Buffer.from(privateKey, 'base64').subarray(1));
}
