import { PublicKey, TransactionInstruction } from "@solana/web3.js";
export interface DelegateInstructionArgs {
    commitFrequencyMs?: number;
    seeds?: Uint8Array[];
    validator?: PublicKey | null;
}
export declare function createDelegateInstruction(accounts: {
    payer: PublicKey;
    delegatedAccount: PublicKey;
    ownerProgram: PublicKey;
    validator?: PublicKey;
}, args?: DelegateInstructionArgs): TransactionInstruction;
export declare function serializeDelegateInstructionData(args?: DelegateInstructionArgs): Buffer;
//# sourceMappingURL=delegate.d.ts.map