"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommitInstruction = createCommitInstruction;
const web3_js_1 = require("@solana/web3.js");
const constants_1 = require("../../constants");
function createCommitInstruction(payer, accountsToCommit) {
    const accounts = [
        { pubkey: payer, isSigner: true, isWritable: true },
        { pubkey: constants_1.MAGIC_CONTEXT_ID, isSigner: false, isWritable: true },
        ...accountsToCommit.map((account) => ({
            pubkey: account,
            isSigner: false,
            isWritable: false,
        })),
    ];
    const data = Buffer.alloc(4);
    data.writeUInt32LE(1, 0);
    return new web3_js_1.TransactionInstruction({
        keys: accounts,
        programId: constants_1.MAGIC_PROGRAM_ID,
        data,
    });
}
//# sourceMappingURL=scheduleCommit.js.map