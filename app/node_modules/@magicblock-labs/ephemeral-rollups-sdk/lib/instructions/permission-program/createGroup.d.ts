import { PublicKey, TransactionInstruction } from "@solana/web3.js";
export interface CreateGroupInstructionArgs {
    id: PublicKey;
    members: PublicKey[];
}
export declare function createCreateGroupInstruction(accounts: {
    group: PublicKey;
    payer: PublicKey;
}, args: CreateGroupInstructionArgs): TransactionInstruction;
export declare function serializeCreateGroupInstructionData(args: CreateGroupInstructionArgs): Buffer;
//# sourceMappingURL=createGroup.d.ts.map