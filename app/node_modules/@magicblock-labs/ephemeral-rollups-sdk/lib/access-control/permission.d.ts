import { PublicKey } from "@solana/web3.js";
export interface PermissionStatusResponse {
    authorizedUsers?: string[];
}
export declare function getPermissionStatus(rpcUrl: string, publicKey: PublicKey): Promise<PermissionStatusResponse>;
export declare function waitUntilPermissionActive(rpcUrl: string, publicKey: PublicKey, timeout?: number): Promise<boolean>;
//# sourceMappingURL=permission.d.ts.map