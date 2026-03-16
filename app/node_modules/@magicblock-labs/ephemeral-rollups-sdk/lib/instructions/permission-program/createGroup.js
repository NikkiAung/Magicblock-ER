"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCreateGroupInstruction = createCreateGroupInstruction;
exports.serializeCreateGroupInstructionData = serializeCreateGroupInstructionData;
const web3_js_1 = require("@solana/web3.js");
const constants_1 = require("../../constants");
function createCreateGroupInstruction(accounts, args) {
    const keys = [
        { pubkey: accounts.group, isWritable: true, isSigner: false },
        { pubkey: accounts.payer, isWritable: true, isSigner: true },
        { pubkey: web3_js_1.SystemProgram.programId, isWritable: false, isSigner: false },
    ];
    const instructionData = serializeCreateGroupInstructionData(args);
    return new web3_js_1.TransactionInstruction({
        programId: constants_1.PERMISSION_PROGRAM_ID,
        keys,
        data: instructionData,
    });
}
function serializeCreateGroupInstructionData(args) {
    const discriminator = 0;
    const buffer = Buffer.alloc(10000);
    let offset = 0;
    buffer[offset++] = discriminator;
    buffer.set(args.id.toBuffer(), offset);
    offset += 32;
    buffer.writeUInt32LE(args.members.length, offset);
    offset += 4;
    for (const member of args.members) {
        buffer.set(member.toBuffer(), offset);
        offset += 32;
    }
    return buffer.subarray(0, offset);
}
//# sourceMappingURL=createGroup.js.map