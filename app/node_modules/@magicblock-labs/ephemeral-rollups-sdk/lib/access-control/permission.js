"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPermissionStatus = getPermissionStatus;
exports.waitUntilPermissionActive = waitUntilPermissionActive;
async function getPermissionStatus(rpcUrl, publicKey) {
    const [baseUrl, token] = rpcUrl.replace("/?", "?").split("?");
    let url;
    if (token) {
        url = `${baseUrl}/permission?${token}&pubkey=${publicKey.toString()}`;
    }
    else {
        url = `${baseUrl}/permission?pubkey=${publicKey.toString()}`;
    }
    try {
        const permissionStatusResponse = await fetch(url);
        if (!permissionStatusResponse.ok) {
            throw new Error(`Permission status request failed: ${permissionStatusResponse.statusText}`);
        }
        const response = await permissionStatusResponse.json();
        return response;
    }
    catch (error) {
        throw new Error(`Failed to get permission status: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function forcePermissionUpdate(rpcUrl, publicKey) {
    const [baseUrl, token] = rpcUrl.replace("/?", "?").split("?");
    let url;
    if (token) {
        url = `${baseUrl}/permission/force-update?${token}&pubkey=${publicKey.toString()}`;
    }
    else {
        url = `${baseUrl}/permission/force-update?pubkey=${publicKey.toString()}`;
    }
    try {
        const forceUpdateResponse = await fetch(url);
        if (!forceUpdateResponse.ok) {
            throw new Error(`Force permission update request failed: ${forceUpdateResponse.statusText}`);
        }
        return true;
    }
    catch (error) {
        console.error(`Failed to force permission update: ${error instanceof Error ? error.message : String(error)}`);
        return false;
    }
}
async function waitUntilPermissionActive(rpcUrl, publicKey, timeout) {
    const timeoutMs = timeout ?? 5000;
    let startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
        try {
            const { authorizedUsers } = await getPermissionStatus(rpcUrl, publicKey);
            if (authorizedUsers && authorizedUsers.length > 0) {
                return true;
            }
        }
        catch (error) {
            console.error(error);
        }
        await new Promise((resolve) => {
            setTimeout(resolve, 400);
        });
    }
    const forceUpdateSuccess = await forcePermissionUpdate(rpcUrl, publicKey);
    if (forceUpdateSuccess) {
        startTime = Date.now();
        while (Date.now() - startTime < timeoutMs) {
            try {
                const { authorizedUsers } = await getPermissionStatus(rpcUrl, publicKey);
                if (authorizedUsers && authorizedUsers.length > 0) {
                    return true;
                }
            }
            catch (error) {
                console.error(error);
            }
            await new Promise((resolve) => {
                setTimeout(resolve, 400);
            });
        }
    }
    return false;
}
//# sourceMappingURL=permission.js.map