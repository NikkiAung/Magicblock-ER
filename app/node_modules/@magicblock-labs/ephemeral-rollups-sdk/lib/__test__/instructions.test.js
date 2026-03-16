"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const web3_js_1 = require("@solana/web3.js");
const delegation_program_1 = require("../instructions/delegation-program");
const magic_program_1 = require("../instructions/magic-program");
const constants_1 = require("../constants");
(0, vitest_1.describe)("Exposed Instructions (web3.js)", () => {
    const mockPublicKey = new web3_js_1.PublicKey("11111111111111111111111111111111");
    const differentKey = new web3_js_1.PublicKey("11111111111111111111111111111112");
    (0, vitest_1.describe)("delegate instruction", () => {
        (0, vitest_1.it)("should create a delegate instruction with correct parameters", () => {
            const args = {
                commitFrequencyMs: 1000,
                seeds: [],
            };
            const instruction = (0, delegation_program_1.createDelegateInstruction)({
                payer: mockPublicKey,
                delegatedAccount: mockPublicKey,
                ownerProgram: mockPublicKey,
            }, args);
            (0, vitest_1.expect)(instruction.keys).toHaveLength(7);
            (0, vitest_1.expect)(instruction.data).toBeDefined();
            (0, vitest_1.expect)(instruction.data.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(instruction.programId.toBase58()).toBe(constants_1.DELEGATION_PROGRAM_ID.toBase58());
        });
        (0, vitest_1.it)("should create a delegate instruction without validator", () => {
            const args = {
                commitFrequencyMs: 1000,
                seeds: [],
            };
            const instruction = (0, delegation_program_1.createDelegateInstruction)({
                payer: mockPublicKey,
                delegatedAccount: mockPublicKey,
                ownerProgram: mockPublicKey,
            }, args);
            (0, vitest_1.expect)(instruction.keys).toHaveLength(7);
            (0, vitest_1.expect)(instruction.data).toBeDefined();
            (0, vitest_1.expect)(instruction.data.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)("should include all required account keys", () => {
            const args = {
                commitFrequencyMs: 1000,
                seeds: [],
            };
            const instruction = (0, delegation_program_1.createDelegateInstruction)({
                payer: mockPublicKey,
                delegatedAccount: mockPublicKey,
                ownerProgram: mockPublicKey,
            }, args);
            const keyCount = instruction.keys.length;
            (0, vitest_1.expect)(keyCount).toBe(7);
            instruction.keys.forEach((key) => {
                (0, vitest_1.expect)(key.pubkey).toBeDefined();
                (0, vitest_1.expect)(key.isSigner).toBeDefined();
                (0, vitest_1.expect)(key.isWritable).toBeDefined();
            });
        });
        (0, vitest_1.it)("should serialize validator in args when provided in accounts", () => {
            const args = {
                commitFrequencyMs: 1000,
                seeds: [],
            };
            const instruction = (0, delegation_program_1.createDelegateInstruction)({
                payer: mockPublicKey,
                delegatedAccount: mockPublicKey,
                ownerProgram: mockPublicKey,
                validator: mockPublicKey,
            }, args);
            (0, vitest_1.expect)(instruction.keys).toHaveLength(7);
            (0, vitest_1.expect)(instruction.data).toBeDefined();
            (0, vitest_1.expect)(instruction.data.length).toBeGreaterThanOrEqual(8 + 4 + 4 + 1 + 32);
        });
        (0, vitest_1.it)("should allow validator override via args", () => {
            const validatorFromArgs = new web3_js_1.PublicKey("11111111111111111111111111111112");
            const instruction = (0, delegation_program_1.createDelegateInstruction)({
                payer: mockPublicKey,
                delegatedAccount: mockPublicKey,
                ownerProgram: mockPublicKey,
                validator: mockPublicKey,
            }, {
                commitFrequencyMs: 1000,
                seeds: [],
                validator: validatorFromArgs,
            });
            (0, vitest_1.expect)(instruction.keys).toHaveLength(7);
            (0, vitest_1.expect)(instruction.data).toBeDefined();
        });
        (0, vitest_1.it)("should support different account addresses", () => {
            const args = {
                commitFrequencyMs: 1000,
                seeds: [],
            };
            const instruction1 = (0, delegation_program_1.createDelegateInstruction)({
                payer: mockPublicKey,
                delegatedAccount: mockPublicKey,
                ownerProgram: mockPublicKey,
            }, args);
            const instruction2 = (0, delegation_program_1.createDelegateInstruction)({
                payer: mockPublicKey,
                delegatedAccount: differentKey,
                ownerProgram: mockPublicKey,
            }, args);
            (0, vitest_1.expect)(instruction1.data).toBeDefined();
            (0, vitest_1.expect)(instruction2.data).toBeDefined();
        });
        (0, vitest_1.it)("should handle various commitFrequencyMs values", () => {
            const frequencies = [0, 1000, 5000, 60000];
            frequencies.forEach((freq) => {
                const args = {
                    commitFrequencyMs: freq,
                    seeds: [],
                };
                const instruction = (0, delegation_program_1.createDelegateInstruction)({
                    payer: mockPublicKey,
                    delegatedAccount: mockPublicKey,
                    ownerProgram: mockPublicKey,
                }, args);
                (0, vitest_1.expect)(instruction.data).toBeDefined();
            });
        });
        (0, vitest_1.it)("should use default commitFrequencyMs when args not provided", () => {
            const instruction = (0, delegation_program_1.createDelegateInstruction)({
                payer: mockPublicKey,
                delegatedAccount: mockPublicKey,
                ownerProgram: mockPublicKey,
            });
            (0, vitest_1.expect)(instruction.data).toBeDefined();
            (0, vitest_1.expect)(instruction.keys).toHaveLength(7);
            (0, vitest_1.expect)(instruction.programId.toBase58()).toBe(constants_1.DELEGATION_PROGRAM_ID.toBase58());
        });
        (0, vitest_1.it)("should handle multiple seeds", () => {
            const args = {
                commitFrequencyMs: 1000,
                seeds: [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])],
            };
            const instruction = (0, delegation_program_1.createDelegateInstruction)({
                payer: mockPublicKey,
                delegatedAccount: mockPublicKey,
                ownerProgram: mockPublicKey,
            }, args);
            (0, vitest_1.expect)(instruction.data).toBeDefined();
        });
        (0, vitest_1.it)("should serialize commitFrequencyMs as u32", () => {
            const args = {
                commitFrequencyMs: 1000,
                seeds: [],
            };
            const instruction = (0, delegation_program_1.createDelegateInstruction)({
                payer: mockPublicKey,
                delegatedAccount: mockPublicKey,
                ownerProgram: mockPublicKey,
            }, args);
            (0, vitest_1.expect)(instruction.data).toBeDefined();
            const minSize = 8 + 4 + 4;
            (0, vitest_1.expect)(instruction.data.length).toBeGreaterThanOrEqual(minSize);
            (0, vitest_1.expect)(instruction.data.readUInt32LE(8)).toBe(1000);
        });
        (0, vitest_1.it)("should serialize with default commitFrequencyMs as max u32", () => {
            const instruction = (0, delegation_program_1.createDelegateInstruction)({
                payer: mockPublicKey,
                delegatedAccount: mockPublicKey,
                ownerProgram: mockPublicKey,
            });
            (0, vitest_1.expect)(instruction.data).toBeDefined();
            (0, vitest_1.expect)(instruction.data.readUInt32LE(8)).toBe(0xffffffff);
        });
        (0, vitest_1.it)("should serialize seeds array correctly", () => {
            const args = {
                commitFrequencyMs: 1000,
                seeds: [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])],
            };
            const instruction = (0, delegation_program_1.createDelegateInstruction)({
                payer: mockPublicKey,
                delegatedAccount: mockPublicKey,
                ownerProgram: mockPublicKey,
            }, args);
            (0, vitest_1.expect)(instruction.data).toBeDefined();
            (0, vitest_1.expect)(instruction.data.readUInt32LE(12)).toBe(2);
        });
    });
    (0, vitest_1.describe)("topUpEscrow instruction", () => {
        (0, vitest_1.it)("should create a topUpEscrow instruction with all parameters", () => {
            const instruction = (0, delegation_program_1.createTopUpEscrowInstruction)(mockPublicKey, mockPublicKey, mockPublicKey, 1000000, 255);
            (0, vitest_1.expect)(instruction.keys).toHaveLength(4);
            (0, vitest_1.expect)(instruction.data).toBeDefined();
            (0, vitest_1.expect)(instruction.data.length).toBe(17);
            (0, vitest_1.expect)(instruction.programId.toBase58()).toBe(constants_1.DELEGATION_PROGRAM_ID.toBase58());
        });
        (0, vitest_1.it)("should create a topUpEscrow instruction with default index", () => {
            const instruction = (0, delegation_program_1.createTopUpEscrowInstruction)(mockPublicKey, mockPublicKey, mockPublicKey, 1000000);
            (0, vitest_1.expect)(instruction.keys).toHaveLength(4);
            (0, vitest_1.expect)(instruction.data).toBeDefined();
            (0, vitest_1.expect)(instruction.data.length).toBe(17);
            (0, vitest_1.expect)(instruction.data[0]).toBe(9);
            for (let i = 1; i < 8; i++) {
                (0, vitest_1.expect)(instruction.data[i]).toBe(0);
            }
            const amount = instruction.data.readBigUInt64LE(8);
            (0, vitest_1.expect)(amount).toBe(BigInt(1000000));
            (0, vitest_1.expect)(instruction.data[16]).toBe(255);
        });
        (0, vitest_1.it)("should convert number amount to bigint internally", () => {
            const instruction = (0, delegation_program_1.createTopUpEscrowInstruction)(mockPublicKey, mockPublicKey, mockPublicKey, 1234567);
            const amount = instruction.data.readBigUInt64LE(8);
            (0, vitest_1.expect)(amount).toBe(BigInt(1234567));
        });
        (0, vitest_1.it)("should handle custom index values", () => {
            const testIndices = [0, 1, 100, 254, 255];
            testIndices.forEach((index) => {
                const instruction = (0, delegation_program_1.createTopUpEscrowInstruction)(mockPublicKey, mockPublicKey, mockPublicKey, 1000000, index);
                (0, vitest_1.expect)(instruction.data[16]).toBe(index);
            });
        });
        (0, vitest_1.it)("should handle zero amount", () => {
            const instruction = (0, delegation_program_1.createTopUpEscrowInstruction)(mockPublicKey, mockPublicKey, mockPublicKey, 0);
            const amount = instruction.data.readBigUInt64LE(8);
            (0, vitest_1.expect)(amount).toBe(BigInt(0));
        });
        (0, vitest_1.it)("should handle large amounts", () => {
            const largeAmount = 9007199254740991;
            const instruction = (0, delegation_program_1.createTopUpEscrowInstruction)(mockPublicKey, mockPublicKey, mockPublicKey, largeAmount);
            const amount = instruction.data.readBigUInt64LE(8);
            (0, vitest_1.expect)(amount).toBe(BigInt(largeAmount));
        });
        (0, vitest_1.it)("should include correct account keys", () => {
            const instruction = (0, delegation_program_1.createTopUpEscrowInstruction)(mockPublicKey, mockPublicKey, mockPublicKey, 1000000);
            (0, vitest_1.expect)(instruction.keys.length).toBe(4);
            instruction.keys.forEach((key) => {
                (0, vitest_1.expect)(key.pubkey).toBeDefined();
                (0, vitest_1.expect)(typeof key.isSigner).toBe("boolean");
                (0, vitest_1.expect)(typeof key.isWritable).toBe("boolean");
            });
        });
        (0, vitest_1.it)("should use consistent data format for the same params", () => {
            const instruction1 = (0, delegation_program_1.createTopUpEscrowInstruction)(mockPublicKey, mockPublicKey, mockPublicKey, 1000000);
            const instruction2 = (0, delegation_program_1.createTopUpEscrowInstruction)(mockPublicKey, mockPublicKey, mockPublicKey, 1000000);
            (0, vitest_1.expect)(instruction1.data).toEqual(instruction2.data);
        });
    });
    (0, vitest_1.describe)("closeEscrow instruction", () => {
        (0, vitest_1.it)("should create a closeEscrow instruction with all parameters", () => {
            const instruction = (0, delegation_program_1.createCloseEscrowInstruction)(mockPublicKey, mockPublicKey, 255);
            (0, vitest_1.expect)(instruction.keys).toHaveLength(3);
            (0, vitest_1.expect)(instruction.data).toBeDefined();
            (0, vitest_1.expect)(instruction.data.length).toBe(9);
            (0, vitest_1.expect)(instruction.programId.toBase58()).toBe(constants_1.DELEGATION_PROGRAM_ID.toBase58());
        });
        (0, vitest_1.it)("should create a closeEscrow instruction with default index", () => {
            const instruction = (0, delegation_program_1.createCloseEscrowInstruction)(mockPublicKey, mockPublicKey);
            (0, vitest_1.expect)(instruction.keys).toHaveLength(3);
            (0, vitest_1.expect)(instruction.data).toBeDefined();
            (0, vitest_1.expect)(instruction.data.length).toBe(9);
            (0, vitest_1.expect)(instruction.data[0]).toBe(11);
            for (let i = 1; i < 8; i++) {
                (0, vitest_1.expect)(instruction.data[i]).toBe(0);
            }
            (0, vitest_1.expect)(instruction.data[8]).toBe(255);
        });
        (0, vitest_1.it)("should handle custom index values", () => {
            const testIndices = [0, 1, 100, 254, 255];
            testIndices.forEach((index) => {
                const instruction = (0, delegation_program_1.createCloseEscrowInstruction)(mockPublicKey, mockPublicKey, index);
                (0, vitest_1.expect)(instruction.data[8]).toBe(index);
            });
        });
        (0, vitest_1.it)("should include correct account keys", () => {
            const instruction = (0, delegation_program_1.createCloseEscrowInstruction)(mockPublicKey, mockPublicKey);
            (0, vitest_1.expect)(instruction.keys.length).toBe(3);
            instruction.keys.forEach((key) => {
                (0, vitest_1.expect)(key.pubkey).toBeDefined();
                (0, vitest_1.expect)(typeof key.isSigner).toBe("boolean");
                (0, vitest_1.expect)(typeof key.isWritable).toBe("boolean");
            });
        });
        (0, vitest_1.it)("should use consistent data format for the same params", () => {
            const instruction1 = (0, delegation_program_1.createCloseEscrowInstruction)(mockPublicKey, mockPublicKey);
            const instruction2 = (0, delegation_program_1.createCloseEscrowInstruction)(mockPublicKey, mockPublicKey);
            (0, vitest_1.expect)(instruction1.data).toEqual(instruction2.data);
        });
        (0, vitest_1.it)("should have correct discriminator", () => {
            const instruction = (0, delegation_program_1.createCloseEscrowInstruction)(mockPublicKey, mockPublicKey);
            (0, vitest_1.expect)(instruction.data[0]).toBe(11);
        });
    });
    (0, vitest_1.describe)("Cross-instruction consistency", () => {
        (0, vitest_1.it)("should all target the same delegation program", () => {
            const delegateArgs = {
                commitFrequencyMs: 1000,
                seeds: [],
            };
            const delegateInstr = (0, delegation_program_1.createDelegateInstruction)({
                payer: mockPublicKey,
                delegatedAccount: mockPublicKey,
                ownerProgram: mockPublicKey,
            }, delegateArgs);
            const topUpInstr = (0, delegation_program_1.createTopUpEscrowInstruction)(mockPublicKey, mockPublicKey, mockPublicKey, 1000000);
            const closeInstr = (0, delegation_program_1.createCloseEscrowInstruction)(mockPublicKey, mockPublicKey);
            const programId = constants_1.DELEGATION_PROGRAM_ID.toBase58();
            (0, vitest_1.expect)(delegateInstr.programId.toBase58()).toBe(programId);
            (0, vitest_1.expect)(topUpInstr.programId.toBase58()).toBe(programId);
            (0, vitest_1.expect)(closeInstr.programId.toBase58()).toBe(programId);
        });
    });
    (0, vitest_1.describe)("scheduleCommit instruction (Magic Program)", () => {
        (0, vitest_1.it)("should create a scheduleCommit instruction with required parameters", () => {
            const instruction = (0, magic_program_1.createCommitInstruction)(mockPublicKey, [
                mockPublicKey,
            ]);
            (0, vitest_1.expect)(instruction.keys).toHaveLength(3);
            (0, vitest_1.expect)(instruction.data).toBeDefined();
            (0, vitest_1.expect)(instruction.data.length).toBe(4);
            (0, vitest_1.expect)(instruction.programId.toBase58()).toBe(constants_1.MAGIC_PROGRAM_ID.toBase58());
        });
        (0, vitest_1.it)("should have correct discriminator", () => {
            const instruction = (0, magic_program_1.createCommitInstruction)(mockPublicKey, [
                mockPublicKey,
            ]);
            (0, vitest_1.expect)(instruction.data.readUInt32LE(0)).toBe(1);
        });
        (0, vitest_1.it)("should include payer as signer and writable", () => {
            const instruction = (0, magic_program_1.createCommitInstruction)(mockPublicKey, [
                mockPublicKey,
            ]);
            (0, vitest_1.expect)(instruction.keys[0].pubkey.toBase58()).toBe(mockPublicKey.toBase58());
            (0, vitest_1.expect)(instruction.keys[0].isSigner).toBe(true);
            (0, vitest_1.expect)(instruction.keys[0].isWritable).toBe(true);
        });
        (0, vitest_1.it)("should include magic context as writable", () => {
            const instruction = (0, magic_program_1.createCommitInstruction)(mockPublicKey, [
                mockPublicKey,
            ]);
            (0, vitest_1.expect)(instruction.keys[1].pubkey.toBase58()).toBe(constants_1.MAGIC_CONTEXT_ID.toBase58());
            (0, vitest_1.expect)(instruction.keys[1].isSigner).toBe(false);
            (0, vitest_1.expect)(instruction.keys[1].isWritable).toBe(true);
        });
        (0, vitest_1.it)("should include accounts to commit as readonly", () => {
            const accountsToCommit = [
                new web3_js_1.PublicKey("11111111111111111111111111111113"),
                new web3_js_1.PublicKey("11111111111111111111111111111114"),
            ];
            const instruction = (0, magic_program_1.createCommitInstruction)(mockPublicKey, accountsToCommit);
            (0, vitest_1.expect)(instruction.keys).toHaveLength(4);
            (0, vitest_1.expect)(instruction.keys[2].pubkey.toBase58()).toBe(accountsToCommit[0].toBase58());
            (0, vitest_1.expect)(instruction.keys[2].isSigner).toBe(false);
            (0, vitest_1.expect)(instruction.keys[2].isWritable).toBe(false);
            (0, vitest_1.expect)(instruction.keys[3].pubkey.toBase58()).toBe(accountsToCommit[1].toBase58());
        });
        (0, vitest_1.it)("should handle single account to commit", () => {
            const instruction = (0, magic_program_1.createCommitInstruction)(mockPublicKey, [
                differentKey,
            ]);
            (0, vitest_1.expect)(instruction.keys).toHaveLength(3);
            (0, vitest_1.expect)(instruction.keys[2].pubkey.toBase58()).toBe(differentKey.toBase58());
        });
        (0, vitest_1.it)("should handle multiple accounts to commit", () => {
            const accounts = [
                new web3_js_1.PublicKey("11111111111111111111111111111113"),
                new web3_js_1.PublicKey("11111111111111111111111111111114"),
                new web3_js_1.PublicKey("11111111111111111111111111111115"),
            ];
            const instruction = (0, magic_program_1.createCommitInstruction)(mockPublicKey, accounts);
            (0, vitest_1.expect)(instruction.keys).toHaveLength(5);
            accounts.forEach((account, index) => {
                (0, vitest_1.expect)(instruction.keys[2 + index].pubkey.toBase58()).toBe(account.toBase58());
            });
        });
    });
    (0, vitest_1.describe)("scheduleCommitAndUndelegate instruction (Magic Program)", () => {
        (0, vitest_1.it)("should create a scheduleCommitAndUndelegate instruction with required parameters", () => {
            const instruction = (0, magic_program_1.createCommitAndUndelegateInstruction)(mockPublicKey, [
                mockPublicKey,
            ]);
            (0, vitest_1.expect)(instruction.keys).toHaveLength(3);
            (0, vitest_1.expect)(instruction.data).toBeDefined();
            (0, vitest_1.expect)(instruction.data.length).toBe(4);
            (0, vitest_1.expect)(instruction.programId.toBase58()).toBe(constants_1.MAGIC_PROGRAM_ID.toBase58());
        });
        (0, vitest_1.it)("should have correct discriminator", () => {
            const instruction = (0, magic_program_1.createCommitAndUndelegateInstruction)(mockPublicKey, [
                mockPublicKey,
            ]);
            (0, vitest_1.expect)(instruction.data.readUInt32LE(0)).toBe(2);
        });
        (0, vitest_1.it)("should include payer as signer and writable", () => {
            const instruction = (0, magic_program_1.createCommitAndUndelegateInstruction)(mockPublicKey, [
                mockPublicKey,
            ]);
            (0, vitest_1.expect)(instruction.keys[0].pubkey.toBase58()).toBe(mockPublicKey.toBase58());
            (0, vitest_1.expect)(instruction.keys[0].isSigner).toBe(true);
            (0, vitest_1.expect)(instruction.keys[0].isWritable).toBe(true);
        });
        (0, vitest_1.it)("should include magic context as writable", () => {
            const instruction = (0, magic_program_1.createCommitAndUndelegateInstruction)(mockPublicKey, [
                mockPublicKey,
            ]);
            (0, vitest_1.expect)(instruction.keys[1].pubkey.toBase58()).toBe(constants_1.MAGIC_CONTEXT_ID.toBase58());
            (0, vitest_1.expect)(instruction.keys[1].isSigner).toBe(false);
            (0, vitest_1.expect)(instruction.keys[1].isWritable).toBe(true);
        });
        (0, vitest_1.it)("should include accounts to commit and undelegate as readonly", () => {
            const accountsToCommitAndUndelegate = [
                new web3_js_1.PublicKey("11111111111111111111111111111113"),
                new web3_js_1.PublicKey("11111111111111111111111111111114"),
            ];
            const instruction = (0, magic_program_1.createCommitAndUndelegateInstruction)(mockPublicKey, accountsToCommitAndUndelegate);
            (0, vitest_1.expect)(instruction.keys).toHaveLength(4);
            (0, vitest_1.expect)(instruction.keys[2].pubkey.toBase58()).toBe(accountsToCommitAndUndelegate[0].toBase58());
            (0, vitest_1.expect)(instruction.keys[2].isSigner).toBe(false);
            (0, vitest_1.expect)(instruction.keys[2].isWritable).toBe(false);
            (0, vitest_1.expect)(instruction.keys[3].pubkey.toBase58()).toBe(accountsToCommitAndUndelegate[1].toBase58());
        });
        (0, vitest_1.it)("should handle single account to commit and undelegate", () => {
            const instruction = (0, magic_program_1.createCommitAndUndelegateInstruction)(mockPublicKey, [
                differentKey,
            ]);
            (0, vitest_1.expect)(instruction.keys).toHaveLength(3);
            (0, vitest_1.expect)(instruction.keys[2].pubkey.toBase58()).toBe(differentKey.toBase58());
        });
        (0, vitest_1.it)("should handle multiple accounts to commit and undelegate", () => {
            const accounts = [
                new web3_js_1.PublicKey("11111111111111111111111111111113"),
                new web3_js_1.PublicKey("11111111111111111111111111111114"),
                new web3_js_1.PublicKey("11111111111111111111111111111115"),
            ];
            const instruction = (0, magic_program_1.createCommitAndUndelegateInstruction)(mockPublicKey, accounts);
            (0, vitest_1.expect)(instruction.keys).toHaveLength(5);
            accounts.forEach((account, index) => {
                (0, vitest_1.expect)(instruction.keys[2 + index].pubkey.toBase58()).toBe(account.toBase58());
            });
        });
    });
});
//# sourceMappingURL=instructions.test.js.map