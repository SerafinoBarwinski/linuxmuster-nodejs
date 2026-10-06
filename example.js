import muster from "./index.js"

const username = "MaxMustermann";
const password = "MaxMustermann";

muster.configure({
    serverUrl: "https://server.example.com",
    allowUnsafe: false,
    shutup: false,
    debug: false,
});

try {
    // Core User
    const sessionToken = await muster.login(username, password);
    const logout = await muster.logout(sessionToken);
    const changePassword = await muster.changePassword(sessionToken, password, "XDDCC");

    // User Details
    const identity = await muster.getIdentity(sessionToken);
    const quota = await muster.getQuota(sessionToken, username);

    // UI Stuff
    const customFields = await muster.getUICustomFields(sessionToken, username);
    const displayOptions = await muster.getDisplayOptions(sessionToken);

    // Other
    const setupStatus = await muster.getSetupStatus(sessionToken);
    const sessionTime = await muster.getSessionTime(sessionToken);

    // Filesystem
    const shares = await muster.getShares(sessionToken, username);
    const entries = await muster.list_dir(sessionToken, shares[0].path);
    const upload = await muster.uploadFile(
        sessionToken,
        "./icon.png",
        shares[0].path,
    );
    const move = await muster.moveFile(
        sessionToken,
        `${shares[0].path}/icon.png`,
        `${shares[0].path}/logo.png`,
    );
    const remove = await muster.rmFile(sessionToken, `${shares[0].path}/logo.png`);

    // Linbo (PXE-Boot) & WebDAV Extras
    const ISO = await muster.getLinboISO(sessionToken, 1); //0 = return RAW Buffer, 1 = return /tmp-file
    const WebdavQRCode = await muster.getWebdavQR(sessionToken, true); // <[2]:bool> add "data:image/png;base64," prefix to the base64
} catch (error) {
    console.error(`${error.name}: ${error.message}`);
}