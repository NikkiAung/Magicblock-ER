"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delegationRecordPdaFromDelegatedAccount = delegationRecordPdaFromDelegatedAccount;
exports.delegationMetadataPdaFromDelegatedAccount = delegationMetadataPdaFromDelegatedAccount;
exports.delegateBufferPdaFromDelegatedAccountAndOwnerProgram = delegateBufferPdaFromDelegatedAccountAndOwnerProgram;
exports.escrowPdaFromEscrowAuthority = escrowPdaFromEscrowAuthority;
exports.undelegateBufferPdaFromDelegatedAccount = undelegateBufferPdaFromDelegatedAccount;
exports.feesVaultPda = feesVaultPda;
exports.validatorFeesVaultPdaFromValidator = validatorFeesVaultPdaFromValidator;
exports.commitStatePdaFromDelegatedAccount = commitStatePdaFromDelegatedAccount;
exports.commitRecordPdaFromDelegatedAccount = commitRecordPdaFromDelegatedAccount;
exports.permissionPdaFromAccount = permissionPdaFromAccount;
exports.groupPdaFromId = groupPdaFromId;
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("./constants.js");
function delegationRecordPdaFromDelegatedAccount(delegatedAccount) {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("delegation"), delegatedAccount.toBytes()], constants_js_1.DELEGATION_PROGRAM_ID)[0];
}
function delegationMetadataPdaFromDelegatedAccount(delegatedAccount) {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("delegation-metadata"), delegatedAccount.toBytes()], constants_js_1.DELEGATION_PROGRAM_ID)[0];
}
function delegateBufferPdaFromDelegatedAccountAndOwnerProgram(delegatedAccount, ownerProgramId) {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("buffer"), delegatedAccount.toBytes()], ownerProgramId)[0];
}
function escrowPdaFromEscrowAuthority(escrowAuthority, index = 255) {
    if (index < 0 || index > 255) {
        throw new Error("Index must be between 0 and 255");
    }
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("balance"), escrowAuthority.toBytes(), Buffer.from([index])], constants_js_1.DELEGATION_PROGRAM_ID)[0];
}
function undelegateBufferPdaFromDelegatedAccount(delegatedAccount) {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("undelegate-buffer"), delegatedAccount.toBytes()], constants_js_1.DELEGATION_PROGRAM_ID)[0];
}
function feesVaultPda() {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("fees-vault")], constants_js_1.DELEGATION_PROGRAM_ID)[0];
}
function validatorFeesVaultPdaFromValidator(validator) {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("v-fees-vault"), validator.toBytes()], constants_js_1.DELEGATION_PROGRAM_ID)[0];
}
function commitStatePdaFromDelegatedAccount(delegatedAccount) {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("state-diff"), delegatedAccount.toBytes()], constants_js_1.DELEGATION_PROGRAM_ID)[0];
}
function commitRecordPdaFromDelegatedAccount(delegatedAccount) {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("commit-state-record"), delegatedAccount.toBytes()], constants_js_1.DELEGATION_PROGRAM_ID)[0];
}
const PERMISSION_SEED = Buffer.from("permission:");
const GROUP_SEED = Buffer.from("group:");
function permissionPdaFromAccount(account) {
    return web3_js_1.PublicKey.findProgramAddressSync([PERMISSION_SEED, account.toBuffer()], constants_js_1.PERMISSION_PROGRAM_ID)[0];
}
function groupPdaFromId(id) {
    return web3_js_1.PublicKey.findProgramAddressSync([GROUP_SEED, id.toBuffer()], constants_js_1.PERMISSION_PROGRAM_ID)[0];
}
//# sourceMappingURL=pda.js.map