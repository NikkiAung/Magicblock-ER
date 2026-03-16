"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const web3_js_1 = require("@solana/web3.js");
const auth_1 = require("../access-control/auth");
(0, vitest_1.describe)("Access Control (web3.js)", () => {
    const mockRpcUrl = "http://localhost:8899";
    const mockPublicKey = new web3_js_1.PublicKey("11111111111111111111111111111111");
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)("getAuthToken", () => {
        (0, vitest_1.it)("should request a challenge and return token with expiration", async () => {
            const mockChallenge = "test-challenge";
            const mockToken = "test-token";
            const mockSignature = new Uint8Array([1, 2, 3]);
            global.fetch = vitest_1.vi
                .fn()
                .mockResolvedValueOnce({
                json: async () => ({ challenge: mockChallenge }),
            })
                .mockResolvedValueOnce({
                status: 200,
                json: async () => ({ token: mockToken }),
            });
            const signMessage = vitest_1.vi.fn().mockResolvedValue(mockSignature);
            const result = await (0, auth_1.getAuthToken)(mockRpcUrl, mockPublicKey, signMessage);
            (0, vitest_1.expect)(result).toHaveProperty("token");
            (0, vitest_1.expect)(result).toHaveProperty("expiresAt");
            (0, vitest_1.expect)(result.token).toBe(mockToken);
            (0, vitest_1.expect)(typeof result.expiresAt).toBe("number");
            (0, vitest_1.expect)(result.expiresAt).toBeGreaterThan(Date.now());
        });
        (0, vitest_1.it)("should use expiresAt from server response if provided", async () => {
            const mockChallenge = "test-challenge";
            const mockToken = "test-token";
            const mockServerExpiresAt = Date.now() + 7200000;
            const mockSignature = new Uint8Array([1, 2, 3]);
            global.fetch = vitest_1.vi
                .fn()
                .mockResolvedValueOnce({
                json: async () => ({ challenge: mockChallenge }),
            })
                .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    token: mockToken,
                    expiresAt: mockServerExpiresAt,
                }),
            });
            const signMessage = vitest_1.vi.fn().mockResolvedValue(mockSignature);
            const result = await (0, auth_1.getAuthToken)(mockRpcUrl, mockPublicKey, signMessage);
            (0, vitest_1.expect)(result.expiresAt).toBe(mockServerExpiresAt);
        });
        (0, vitest_1.it)("should throw error on authentication failure", async () => {
            const mockChallenge = "test-challenge";
            const mockError = "Invalid signature";
            global.fetch = vitest_1.vi
                .fn()
                .mockResolvedValueOnce({
                json: async () => ({ challenge: mockChallenge }),
            })
                .mockResolvedValueOnce({
                status: 401,
                json: async () => ({ error: mockError }),
            });
            const signMessage = vitest_1.vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]));
            await (0, vitest_1.expect)((0, auth_1.getAuthToken)(mockRpcUrl, mockPublicKey, signMessage)).rejects.toThrow("Failed to authenticate");
        });
        (0, vitest_1.it)("should call signMessage with the challenge", async () => {
            const mockChallenge = "test-challenge";
            const mockToken = "test-token";
            const mockSignature = new Uint8Array([1, 2, 3]);
            global.fetch = vitest_1.vi
                .fn()
                .mockResolvedValueOnce({
                json: async () => ({ challenge: mockChallenge }),
            })
                .mockResolvedValueOnce({
                status: 200,
                json: async () => ({ token: mockToken }),
            });
            const signMessage = vitest_1.vi.fn().mockResolvedValue(mockSignature);
            await (0, auth_1.getAuthToken)(mockRpcUrl, mockPublicKey, signMessage);
            (0, vitest_1.expect)(signMessage).toHaveBeenCalledWith(new Uint8Array(Buffer.from(mockChallenge, "utf-8")));
        });
        (0, vitest_1.it)("should send correct request to auth/challenge endpoint", async () => {
            const mockChallenge = "test-challenge";
            const mockToken = "test-token";
            global.fetch = vitest_1.vi
                .fn()
                .mockResolvedValueOnce({
                json: async () => ({ challenge: mockChallenge }),
            })
                .mockResolvedValueOnce({
                status: 200,
                json: async () => ({ token: mockToken }),
            });
            const signMessage = vitest_1.vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]));
            await (0, auth_1.getAuthToken)(mockRpcUrl, mockPublicKey, signMessage);
            const firstCall = global.fetch.mock.calls[0];
            (0, vitest_1.expect)(firstCall[0]).toContain(`${mockRpcUrl}/auth/challenge`);
            (0, vitest_1.expect)(firstCall[0]).toContain(`pubkey=${mockPublicKey.toString()}`);
        });
        (0, vitest_1.it)("should send POST request to auth/login with signature", async () => {
            const mockChallenge = "test-challenge";
            const mockToken = "test-token";
            global.fetch = vitest_1.vi
                .fn()
                .mockResolvedValueOnce({
                json: async () => ({ challenge: mockChallenge }),
            })
                .mockResolvedValueOnce({
                status: 200,
                json: async () => ({ token: mockToken }),
            });
            const signMessage = vitest_1.vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]));
            await (0, auth_1.getAuthToken)(mockRpcUrl, mockPublicKey, signMessage);
            const secondCall = global.fetch.mock.calls[1];
            (0, vitest_1.expect)(secondCall[0]).toContain(`${mockRpcUrl}/auth/login`);
            (0, vitest_1.expect)(secondCall[1].method).toBe("POST");
            (0, vitest_1.expect)(secondCall[1].headers["Content-Type"]).toBe("application/json");
        });
        (0, vitest_1.it)("should include pubkey, challenge, and signature in login request", async () => {
            const mockChallenge = "test-challenge";
            const mockToken = "test-token";
            global.fetch = vitest_1.vi
                .fn()
                .mockResolvedValueOnce({
                json: async () => ({ challenge: mockChallenge }),
            })
                .mockResolvedValueOnce({
                status: 200,
                json: async () => ({ token: mockToken }),
            });
            const signMessage = vitest_1.vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]));
            await (0, auth_1.getAuthToken)(mockRpcUrl, mockPublicKey, signMessage);
            const secondCall = global.fetch.mock.calls[1];
            const body = JSON.parse(secondCall[1].body);
            (0, vitest_1.expect)(body).toHaveProperty("pubkey");
            (0, vitest_1.expect)(body).toHaveProperty("challenge");
            (0, vitest_1.expect)(body).toHaveProperty("signature");
            (0, vitest_1.expect)(body.pubkey).toBe(mockPublicKey.toString());
            (0, vitest_1.expect)(body.challenge).toBe(mockChallenge);
        });
    });
});
//# sourceMappingURL=access-control.test.js.map