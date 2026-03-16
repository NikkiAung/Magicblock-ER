import { PublicKey, TransactionInstruction } from "@solana/web3.js";
export interface CloseEphemeralBalanceInstructionArgs {
    index: number;
}
export declare function createCloseEscrowInstruction(escrow: PublicKey, escrowAuthority: PublicKey, index?: number): TransactionInstruction;
export declare function serializeCloseEphemeralBalanceInstructionData(args: CloseEphemeralBalanceInstructionArgs): Buffer;
//# sourceMappingURL=closeEphemeralBalance.d.ts.map