import muster from "./index.js"

const username = "MaxMustermann";
const password = "MaxMustermann";

muster.configure({
    serverUrl: "https://server.example.com",
    isServerVersionBelow74: true,
    deprecatedTLS: false,
    shutup: false,
    debug: false,
});

try {
    const sessionToken = await muster.login(username, password);

    const identity = await muster.getIdentity(sessionToken);
    const quota = await muster.getQuota(sessionToken, username);

    const customFields = await muster.getUICustomFields(sessionToken, username);
    const displayOptions = await muster.getDisplayOptions(sessionToken);

    const setupStatus = await muster.getSetupStatus(sessionToken);
    const sessionTime = await muster.getSessionTime(sessionToken);

    const shares = await muster.getShares(sessionToken, username);
    const entries = await muster.listDir(sessionToken, shares[0].path);

    const uploaded = await muster.uploadFile(
        sessionToken,
        "./icon.png",
        shares[0].path,
    );
    const moved = await muster.moveFile(
        sessionToken,
        `${shares[0].path}/icon.png`,
        `${shares[0].path}/logo.png`,
    );
    const removed = await muster.rmFile(sessionToken, `${shares[0].path}/logo.png`);
} catch (error) {
    console.error(`${error.name}: ${error.message}`);
}