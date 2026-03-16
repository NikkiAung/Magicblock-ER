"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCloseEscrowInstruction = createCloseEscrowInstruction;
exports.serializeCloseEphemeralBalanceInstructionData = serializeCloseEphemeralBalanceInstructionData;
const web3_js_1 = require("@solana/web3.js");
const constants_1 = require("../../constants");
function createCloseEscrowInstruction(escrow, escrowAuthority, index) {
    const keys = [
        { pubkey: escrowAuthority, isWritable: false, isSigner: true },
        { pubkey: escrow, isWritable: true, isSigner: false },
        { pubkey: web3_js_1.SystemProgram.programId, isWritable: false, isSigner: false },
    ];
    const instructionData = serializeCloseEphemeralBalanceInstructionData({
        index: index ?? 255,
    });
    return new web3_js_1.TransactionInstruction({
        programId: constants_1.DELEGATION_PROGRAM_ID,
        keys,
        data: instructionData,
    });
}
function serializeCloseEphemeralBalanceInstructionData(args) {
    const discriminator = [11, 0, 0, 0, 0, 0, 0, 0];
    const buffer = Buffer.alloc(9);
    let offset = 0;
    for (let i = 0; i < 8; i++) {
        buffer[offset++] = discriminator[i];
    }
    buffer[offset] = args.index;
    return buffer;
}
//# sourceMappingURL=closeEphemeralBalance.js.map