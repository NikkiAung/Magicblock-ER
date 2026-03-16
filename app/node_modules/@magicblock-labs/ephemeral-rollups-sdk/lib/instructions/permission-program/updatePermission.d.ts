import { PublicKey, TransactionInstruction } from "@solana/web3.js";
export interface UpdatePermissionInstructionArgs {
}
export declare function createUpdatePermissionInstruction(accounts: {
    permission: PublicKey;
    delegatedAccount: PublicKey;
    group: PublicKey;
}, args?: UpdatePermissionInstructionArgs): TransactionInstruction;
export declare function serializeUpdatePermissionInstructionData(args?: UpdatePermissionInstructionArgs): Buffer;
//# sourceMappingURL=updatePermission.d.ts.map