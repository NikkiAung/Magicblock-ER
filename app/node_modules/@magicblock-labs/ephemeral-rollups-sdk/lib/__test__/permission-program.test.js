"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const web3_js_1 = require("@solana/web3.js");
const permission_program_1 = require("../instructions/permission-program");
const constants_1 = require("../constants");
(0, vitest_1.describe)("Permission Program Instructions (web3.js)", () => {
    const mockPublicKey = new web3_js_1.PublicKey("11111111111111111111111111111111");
    const differentPublicKey = new web3_js_1.PublicKey("11111111111111111111111111111112");
    (0, vitest_1.describe)("createGroup instruction", () => {
        (0, vitest_1.it)("should create a createGroup instruction with valid parameters", () => {
            const id = mockPublicKey;
            const members = [mockPublicKey, differentPublicKey];
            const instruction = (0, permission_program_1.createCreateGroupInstruction)({
                group: mockPublicKey,
                payer: mockPublicKey,
            }, {
                id,
                members,
            });
            (0, vitest_1.expect)(instruction.programId.equals(constants_1.PERMISSION_PROGRAM_ID)).toBe(true);
            (0, vitest_1.expect)(instruction.keys).toHaveLength(3);
            (0, vitest_1.expect)(instruction.data).toBeDefined();
            (0, vitest_1.expect)(instruction.data.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)("should serialize group ID correctly", () => {
            const id = mockPublicKey;
            const instruction = (0, permission_program_1.createCreateGroupInstruction)({
                group: mockPublicKey,
                payer: mockPublicKey,
            }, {
                id,
                members: [],
            });
            (0, vitest_1.expect)(instruction.data).toBeDefined();
            (0, vitest_1.expect)(instruction.data.length).toBeGreaterThanOrEqual(1 + 32);
        });
        (0, vitest_1.it)("should include group account as writable", () => {
            const instruction = (0, permission_program_1.createCreateGroupInstruction)({
                group: mockPublicKey,
                payer: differentPublicKey,
            }, {
                id: mockPublicKey,
                members: [],
            });
            const groupAccount = instruction.keys.find((key) => key.pubkey.equals(mockPublicKey));
            (0, vitest_1.expect)(groupAccount).toBeDefined();
            (0, vitest_1.expect)(groupAccount?.isWritable).toBe(true);
        });
        (0, vitest_1.it)("should include payer as writable signer", () => {
            const instruction = (0, permission_program_1.createCreateGroupInstruction)({
                group: mockPublicKey,
                payer: differentPublicKey,
            }, {
                id: mockPublicKey,
                members: [],
            });
            const payerAccount = instruction.keys.find((key) => key.pubkey.equals(differentPublicKey));
            (0, vitest_1.expect)(payerAccount).toBeDefined();
            (0, vitest_1.expect)(payerAccount?.isWritable).toBe(true);
            (0, vitest_1.expect)(payerAccount?.isSigner).toBe(true);
        });
        (0, vitest_1.it)("should handle empty members list", () => {
            const instruction = (0, permission_program_1.createCreateGroupInstruction)({
                group: mockPublicKey,
                payer: mockPublicKey,
            }, {
                id: mockPublicKey,
                members: [],
            });
            (0, vitest_1.expect)(instruction.data).toBeDefined();
            (0, vitest_1.expect)(instruction.data.length).toBeGreaterThanOrEqual(37);
        });
        (0, vitest_1.it)("should handle multiple members", () => {
            const members = [
                mockPublicKey,
                differentPublicKey,
                new web3_js_1.PublicKey("11111111111111111111111111111113"),
            ];
            const instruction = (0, permission_program_1.createCreateGroupInstruction)({
                group: mockPublicKey,
                payer: mockPublicKey,
            }, {
                id: mockPublicKey,
                members,
            });
            (0, vitest_1.expect)(instruction.data).toBeDefined();
            const expectedSize = 1 + 32 + 4 + members.length * 32;
            (0, vitest_1.expect)(instruction.data.length).toBeGreaterThanOrEqual(expectedSize);
        });
        (0, vitest_1.it)("should use discriminator 0", () => {
            const instruction = (0, permission_program_1.createCreateGroupInstruction)({
                group: mockPublicKey,
                payer: mockPublicKey,
            }, {
                id: mockPublicKey,
                members: [],
            });
            (0, vitest_1.expect)(instruction.data[0]).toBe(0);
        });
    });
    (0, vitest_1.describe)("createPermission instruction", () => {
        (0, vitest_1.it)("should create a createPermission instruction with valid parameters", () => {
            const instruction = (0, permission_program_1.createCreatePermissionInstruction)({
                permission: mockPublicKey,
                delegatedAccount: mockPublicKey,
                group: differentPublicKey,
                payer: mockPublicKey,
            });
            (0, vitest_1.expect)(instruction.programId.equals(constants_1.PERMISSION_PROGRAM_ID)).toBe(true);
            (0, vitest_1.expect)(instruction.keys).toHaveLength(5);
            (0, vitest_1.expect)(instruction.data).toBeDefined();
        });
        (0, vitest_1.it)("should include permission account as writable", () => {
            const instruction = (0, permission_program_1.createCreatePermissionInstruction)({
                permission: mockPublicKey,
                delegatedAccount: differentPublicKey,
                group: new web3_js_1.PublicKey("11111111111111111111111111111113"),
                payer: new web3_js_1.PublicKey("11111111111111111111111111111114"),
            });
            const permissionAccount = instruction.keys.find((key) => key.pubkey.equals(mockPublicKey));
            (0, vitest_1.expect)(permissionAccount).toBeDefined();
            (0, vitest_1.expect)(permissionAccount?.isWritable).toBe(true);
        });
        (0, vitest_1.it)("should include delegatedAccount as readonly signer", () => {
            const instruction = (0, permission_program_1.createCreatePermissionInstruction)({
                permission: mockPublicKey,
                delegatedAccount: differentPublicKey,
                group: mockPublicKey,
                payer: mockPublicKey,
            });
            const delegatedAccount = instruction.keys.find((key) => key.pubkey.equals(differentPublicKey));
            (0, vitest_1.expect)(delegatedAccount).toBeDefined();
            (0, vitest_1.expect)(delegatedAccount?.isSigner).toBe(true);
            (0, vitest_1.expect)(delegatedAccount?.isWritable).toBe(false);
        });
        (0, vitest_1.it)("should include payer as writable signer", () => {
            const payerAddress = new web3_js_1.PublicKey("11111111111111111111111111111115");
            const instruction = (0, permission_program_1.createCreatePermissionInstruction)({
                permission: mockPublicKey,
                delegatedAccount: mockPublicKey,
                group: mockPublicKey,
                payer: payerAddress,
            });
            const payerAccount = instruction.keys.find((key) => key.pubkey.equals(payerAddress));
            (0, vitest_1.expect)(payerAccount).toBeDefined();
            (0, vitest_1.expect)(payerAccount?.isWritable).toBe(true);
            (0, vitest_1.expect)(payerAccount?.isSigner).toBe(true);
        });
        (0, vitest_1.it)("should use discriminator 1", () => {
            const instruction = (0, permission_program_1.createCreatePermissionInstruction)({
                permission: mockPublicKey,
                delegatedAccount: mockPublicKey,
                group: mockPublicKey,
                payer: mockPublicKey,
            });
            (0, vitest_1.expect)(instruction.data[0]).toBe(1);
        });
        (0, vitest_1.it)("should have minimal data (just discriminator)", () => {
            const instruction = (0, permission_program_1.createCreatePermissionInstruction)({
                permission: mockPublicKey,
                delegatedAccount: mockPublicKey,
                group: mockPublicKey,
                payer: mockPublicKey,
            });
            (0, vitest_1.expect)(instruction.data.length).toBe(1);
        });
    });
    (0, vitest_1.describe)("updatePermission instruction", () => {
        (0, vitest_1.it)("should create an updatePermission instruction with valid parameters", () => {
            const instruction = (0, permission_program_1.createUpdatePermissionInstruction)({
                permission: mockPublicKey,
                delegatedAccount: mockPublicKey,
                group: differentPublicKey,
            });
            (0, vitest_1.expect)(instruction.programId.equals(constants_1.PERMISSION_PROGRAM_ID)).toBe(true);
            (0, vitest_1.expect)(instruction.keys).toHaveLength(3);
            (0, vitest_1.expect)(instruction.data).toBeDefined();
        });
        (0, vitest_1.it)("should include permission account as writable", () => {
            const instruction = (0, permission_program_1.createUpdatePermissionInstruction)({
                permission: mockPublicKey,
                delegatedAccount: differentPublicKey,
                group: new web3_js_1.PublicKey("11111111111111111111111111111113"),
            });
            const permissionAccount = instruction.keys.find((key) => key.pubkey.equals(mockPublicKey));
            (0, vitest_1.expect)(permissionAccount).toBeDefined();
            (0, vitest_1.expect)(permissionAccount?.isWritable).toBe(true);
        });
        (0, vitest_1.it)("should include delegatedAccount as readonly signer", () => {
            const instruction = (0, permission_program_1.createUpdatePermissionInstruction)({
                permission: mockPublicKey,
                delegatedAccount: differentPublicKey,
                group: mockPublicKey,
            });
            const delegatedAccount = instruction.keys.find((key) => key.pubkey.equals(differentPublicKey));
            (0, vitest_1.expect)(delegatedAccount).toBeDefined();
            (0, vitest_1.expect)(delegatedAccount?.isSigner).toBe(true);
            (0, vitest_1.expect)(delegatedAccount?.isWritable).toBe(false);
        });
        (0, vitest_1.it)("should include group as readonly", () => {
            const groupAddress = new web3_js_1.PublicKey("11111111111111111111111111111114");
            const instruction = (0, permission_program_1.createUpdatePermissionInstruction)({
                permission: mockPublicKey,
                delegatedAccount: mockPublicKey,
                group: groupAddress,
            });
            const groupAccount = instruction.keys.find((key) => key.pubkey.equals(groupAddress));
            (0, vitest_1.expect)(groupAccount).toBeDefined();
            (0, vitest_1.expect)(groupAccount?.isWritable).toBe(false);
            (0, vitest_1.expect)(groupAccount?.isSigner).toBe(false);
        });
        (0, vitest_1.it)("should use discriminator 2", () => {
            const instruction = (0, permission_program_1.createUpdatePermissionInstruction)({
                permission: mockPublicKey,
                delegatedAccount: mockPublicKey,
                group: mockPublicKey,
            });
            (0, vitest_1.expect)(instruction.data[0]).toBe(2);
        });
        (0, vitest_1.it)("should have minimal data (just discriminator)", () => {
            const instruction = (0, permission_program_1.createUpdatePermissionInstruction)({
                permission: mockPublicKey,
                delegatedAccount: mockPublicKey,
                group: mockPublicKey,
            });
            (0, vitest_1.expect)(instruction.data.length).toBe(1);
        });
    });
    (0, vitest_1.describe)("Cross-instruction consistency", () => {
        (0, vitest_1.it)("should all target the same permission program", () => {
            const createGroupInstr = (0, permission_program_1.createCreateGroupInstruction)({
                group: mockPublicKey,
                payer: mockPublicKey,
            }, {
                id: mockPublicKey,
                members: [],
            });
            const createPermissionInstr = (0, permission_program_1.createCreatePermissionInstruction)({
                permission: mockPublicKey,
                delegatedAccount: mockPublicKey,
                group: mockPublicKey,
                payer: mockPublicKey,
            });
            const updatePermissionInstr = (0, permission_program_1.createUpdatePermissionInstruction)({
                permission: mockPublicKey,
                delegatedAccount: mockPublicKey,
                group: mockPublicKey,
            });
            (0, vitest_1.expect)(createGroupInstr.programId.equals(constants_1.PERMISSION_PROGRAM_ID)).toBe(true);
            (0, vitest_1.expect)(createPermissionInstr.programId.equals(constants_1.PERMISSION_PROGRAM_ID)).toBe(true);
            (0, vitest_1.expect)(updatePermissionInstr.programId.equals(constants_1.PERMISSION_PROGRAM_ID)).toBe(true);
        });
        (0, vitest_1.it)("should have unique discriminators", () => {
            const createGroupInstr = (0, permission_program_1.createCreateGroupInstruction)({
                group: mockPublicKey,
                payer: mockPublicKey,
            }, {
                id: mockPublicKey,
                members: [],
            });
            const createPermissionInstr = (0, permission_program_1.createCreatePermissionInstruction)({
                permission: mockPublicKey,
                delegatedAccount: mockPublicKey,
                group: mockPublicKey,
                payer: mockPublicKey,
            });
            const updatePermissionInstr = (0, permission_program_1.createUpdatePermissionInstruction)({
                permission: mockPublicKey,
                delegatedAccount: mockPublicKey,
                group: mockPublicKey,
            });
            const disc1 = createGroupInstr.data[0];
            const disc2 = createPermissionInstr.data[0];
            const disc3 = updatePermissionInstr.data[0];
            (0, vitest_1.expect)(disc1).not.toBe(disc2);
            (0, vitest_1.expect)(disc2).not.toBe(disc3);
            (0, vitest_1.expect)(disc1).not.toBe(disc3);
        });
    });
});
//# sourceMappingURL=permission-program.test.js.map