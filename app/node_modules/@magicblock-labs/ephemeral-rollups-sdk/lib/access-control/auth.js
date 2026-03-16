"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SESSION_DURATION = void 0;
exports.getAuthToken = getAuthToken;
exports.SESSION_DURATION = 1000 * 60 * 60 * 24 * 30;
async function getAuthToken(rpcUrl, publicKey, signMessage) {
    const bs58 = (await import("bs58")).default;
    const challengeResponse = await fetch(`${rpcUrl}/auth/challenge?pubkey=${publicKey.toString()}`);
    const { challenge } = await challengeResponse.json();
    const signature = await signMessage(new Uint8Array(Buffer.from(challenge, "utf-8")));
    const signatureString = bs58.encode(signature);
    const authResponse = await fetch(`${rpcUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            pubkey: publicKey.toString(),
            challenge,
            signature: signatureString,
        }),
    });
    const authJson = await authResponse.json();
    if (authResponse.status !== 200) {
        throw new Error(`Failed to authenticate: ${authJson.error}`);
    }
    const expiresAt = authJson.expiresAt ?? Date.now() + exports.SESSION_DURATION;
    return { token: authJson.token, expiresAt };
}
//# sourceMappingURL=auth.js.map