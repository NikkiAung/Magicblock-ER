import { PublicKey } from "@solana/web3.js";
export declare const SESSION_DURATION: number;
export declare function getAuthToken(rpcUrl: string, publicKey: PublicKey, signMessage: (message: Uint8Array) => Promise<Uint8Array>): Promise<{
    token: string;
    expiresAt: number;
}>;
//# sourceMappingURL=auth.d.ts.map