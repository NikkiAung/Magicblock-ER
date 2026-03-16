import { PublicKey, TransactionInstruction } from "@solana/web3.js";
export interface TopUpEphemeralBalanceInstructionArgs {
    amount: bigint;
    index: number;
}
export declare function createTopUpEscrowInstruction(escrow: PublicKey, escrowAuthority: PublicKey, payer: PublicKey, amount: number, index?: number): TransactionInstruction;
export declare function serializeTopUpEphemeralBalanceInstructionData(args: TopUpEphemeralBalanceInstructionArgs): Buffer;
//# sourceMappingURL=topUpEphemeralBalance.d.ts.map