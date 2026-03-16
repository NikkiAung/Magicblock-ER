import { PublicKey, TransactionInstruction } from "@solana/web3.js";
export interface CreatePermissionInstructionArgs {
}
export declare function createCreatePermissionInstruction(accounts: {
    permission: PublicKey;
    delegatedAccount: PublicKey;
    group: PublicKey;
    payer: PublicKey;
}, args?: CreatePermissionInstructionArgs): TransactionInstruction;
export declare function serializeCreatePermissionInstructionData(args?: CreatePermissionInstructionArgs): Buffer;
//# sourceMappingURL=createPermission.d.ts.map