"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTopUpEscrowInstruction = createTopUpEscrowInstruction;
exports.serializeTopUpEphemeralBalanceInstructionData = serializeTopUpEphemeralBalanceInstructionData;
const web3_js_1 = require("@solana/web3.js");
const constants_1 = require("../../constants");
function createTopUpEscrowInstruction(escrow, escrowAuthority, payer, amount, index) {
    const keys = [
        { pubkey: payer, isWritable: true, isSigner: true },
        { pubkey: escrowAuthority, isWritable: false, isSigner: false },
        { pubkey: escrow, isWritable: true, isSigner: false },
        { pubkey: web3_js_1.SystemProgram.programId, isWritable: false, isSigner: false },
    ];
    const instructionData = serializeTopUpEphemeralBalanceInstructionData({
        amount: BigInt(amount),
        index: index ?? 255,
    });
    return new web3_js_1.TransactionInstruction({
        programId: constants_1.DELEGATION_PROGRAM_ID,
        keys,
        data: instructionData,
    });
}
function serializeTopUpEphemeralBalanceInstructionData(args) {
    const discriminator = [9, 0, 0, 0, 0, 0, 0, 0];
    const buffer = Buffer.alloc(17);
    let offset = 0;
    for (let i = 0; i < 8; i++) {
        buffer[offset++] = discriminator[i];
    }
    buffer.writeBigUInt64LE(args.amount, offset);
    offset += 8;
    buffer[offset] = args.index;
    return buffer;
}
//# sourceMappingURL=topUpEphemeralBalance.js.map