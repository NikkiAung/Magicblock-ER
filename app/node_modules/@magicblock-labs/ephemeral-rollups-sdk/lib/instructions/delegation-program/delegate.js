"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDelegateInstruction = createDelegateInstruction;
exports.serializeDelegateInstructionData = serializeDelegateInstructionData;
const web3_js_1 = require("@solana/web3.js");
const constants_1 = require("../../constants");
const pda_1 = require("../../pda");
function createDelegateInstruction(accounts, args) {
    const delegateBuffer = (0, pda_1.delegateBufferPdaFromDelegatedAccountAndOwnerProgram)(accounts.delegatedAccount, accounts.ownerProgram);
    const delegationRecord = (0, pda_1.delegationRecordPdaFromDelegatedAccount)(accounts.delegatedAccount);
    const delegationMetadata = (0, pda_1.delegationMetadataPdaFromDelegatedAccount)(accounts.delegatedAccount);
    const keys = [
        { pubkey: accounts.payer, isWritable: true, isSigner: true },
        { pubkey: accounts.delegatedAccount, isWritable: true, isSigner: true },
        { pubkey: accounts.ownerProgram, isWritable: false, isSigner: false },
        { pubkey: delegateBuffer, isWritable: true, isSigner: false },
        { pubkey: delegationRecord, isWritable: true, isSigner: false },
        { pubkey: delegationMetadata, isWritable: true, isSigner: false },
        { pubkey: web3_js_1.SystemProgram.programId, isWritable: false, isSigner: false },
    ];
    const instructionData = serializeDelegateInstructionData({
        validator: accounts.validator,
        ...args,
    });
    return new web3_js_1.TransactionInstruction({
        programId: constants_1.DELEGATION_PROGRAM_ID,
        keys,
        data: instructionData,
    });
}
function serializeDelegateInstructionData(args) {
    const delegateInstructionDiscriminator = [0, 0, 0, 0, 0, 0, 0, 0];
    const commitFrequencyMs = args?.commitFrequencyMs ?? 0xffffffff;
    const seeds = args?.seeds ?? [];
    const validator = args?.validator;
    const buffer = Buffer.alloc(1024);
    let offset = 0;
    for (let i = 0; i < 8; i++) {
        buffer[offset++] = delegateInstructionDiscriminator[i];
    }
    buffer.writeUInt32LE(commitFrequencyMs, offset);
    offset += 4;
    buffer.writeUInt32LE(seeds.length, offset);
    offset += 4;
    for (const seed of seeds) {
        buffer.writeUInt32LE(seed.length, offset);
        offset += 4;
        buffer.set(seed, offset);
        offset += seed.length;
    }
    if (validator) {
        buffer[offset++] = 1;
        buffer.set(validator.toBuffer(), offset);
        offset += 32;
    }
    else {
        buffer[offset++] = 0;
    }
    return buffer.subarray(0, offset);
}
//# sourceMappingURL=delegate.js.map