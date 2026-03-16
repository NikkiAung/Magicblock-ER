"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUpdatePermissionInstruction = createUpdatePermissionInstruction;
exports.serializeUpdatePermissionInstructionData = serializeUpdatePermissionInstructionData;
const web3_js_1 = require("@solana/web3.js");
const constants_1 = require("../../constants");
function createUpdatePermissionInstruction(accounts, args) {
    const keys = [
        { pubkey: accounts.permission, isWritable: true, isSigner: false },
        { pubkey: accounts.delegatedAccount, isWritable: false, isSigner: true },
        { pubkey: accounts.group, isWritable: false, isSigner: false },
    ];
    const instructionData = serializeUpdatePermissionInstructionData(args);
    return new web3_js_1.TransactionInstruction({
        programId: constants_1.PERMISSION_PROGRAM_ID,
        keys,
        data: instructionData,
    });
}
function serializeUpdatePermissionInstructionData(args) {
    const discriminator = 2;
    const buffer = Buffer.alloc(1);
    let offset = 0;
    buffer[offset++] = discriminator;
    return buffer.subarray(0, offset);
}
//# sourceMappingURL=updatePermission.js.map