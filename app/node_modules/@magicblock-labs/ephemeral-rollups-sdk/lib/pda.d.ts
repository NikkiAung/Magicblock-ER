import { PublicKey } from "@solana/web3.js";
export declare function delegationRecordPdaFromDelegatedAccount(delegatedAccount: PublicKey): PublicKey;
export declare function delegationMetadataPdaFromDelegatedAccount(delegatedAccount: PublicKey): PublicKey;
export declare function delegateBufferPdaFromDelegatedAccountAndOwnerProgram(delegatedAccount: PublicKey, ownerProgramId: PublicKey): PublicKey;
export declare function escrowPdaFromEscrowAuthority(escrowAuthority: PublicKey, index?: number): PublicKey;
export declare function undelegateBufferPdaFromDelegatedAccount(delegatedAccount: PublicKey): PublicKey;
export declare function feesVaultPda(): PublicKey;
export declare function validatorFeesVaultPdaFromValidator(validator: PublicKey): PublicKey;
export declare function commitStatePdaFromDelegatedAccount(delegatedAccount: PublicKey): PublicKey;
export declare function commitRecordPdaFromDelegatedAccount(delegatedAccount: PublicKey): PublicKey;
export declare function permissionPdaFromAccount(account: PublicKey): PublicKey;
export declare function groupPdaFromId(id: PublicKey): PublicKey;
//# sourceMappingURL=pda.d.ts.map